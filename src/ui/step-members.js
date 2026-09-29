// Step 2 · 选择成员（搜索 / 按团筛选 / 已选成员固定显示 / 人数上限）
import { el } from './dom.js';
import { iconSearch, iconCheck, iconClose } from './icons.js';
import { MEMBERS, GROUPS, displayGroup } from '../data/members.js';
import {
  getState,
  subscribe,
  toggleMember,
  goto,
  isFull,
  selectedMembers,
} from '../state.js';

export function render() {
  let query = '';
  let group = 'all';

  const state = getState();

  /* ---- 顶部：已选成员固定显示 ---- */
  const pickedCount = el('b', {}, state.selected.length);
  const pickedChips = el('div', { class: 'picked__chips' });
  const pickedEmpty = el('span', { class: 'picked__empty' }, '还没有选人，点下面的卡片加入');

  const picked = el('div', { class: 'picked' },
    el('div', { class: 'picked__head' },
      el('span', { class: 'picked__count' }, '已选 ', pickedCount, el('i', {}, ` / ${state.size} 人`)),
      el('span', { class: 'picked__tip' }, '点卡片加入，再点一次移出')
    ),
    el('div', { class: 'picked__row' }, pickedEmpty, pickedChips)
  );

  /* ---- 搜索 + 按团筛选 ---- */
  const input = el('input', {
    type: 'search',
    placeholder: '搜索成员 / 中文名 / 团名',
    autocomplete: 'off',
    oninput: () => {
      query = input.value.trim().toLowerCase();
      renderGrid();
    },
  });
  const search = el('div', { class: 'search' },
    el('span', { class: 'search__icon', html: iconSearch }), input);

  const chips = el('div', { class: 'gchips' });
  chips.append(
    el('button', {
      class: 'gchip gchip--on',
      type: 'button',
      dataset: { group: 'all' },
      onclick: () => setGroup('all'),
    }, '全部')
  );
  for (const g of GROUPS) {
    chips.append(
      el('button', {
        class: 'gchip',
        type: 'button',
        dataset: { group: g },
        onclick: () => setGroup(g),
      }, displayGroup(g))
    );
  }

  function setGroup(g) {
    group = g;
    chips.querySelectorAll('.gchip').forEach((c) => c.classList.toggle('gchip--on', c.dataset.group === g));
    renderGrid();
  }

  /* ---- 成员卡片网格 ---- */
  const grid = el('div', { class: 'mgrid' });

  function visibleMembers() {
    return MEMBERS.filter((m) => {
      if (group !== 'all' && m.group !== group) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        (m.zh || '').includes(query) ||
        m.group.toLowerCase().includes(query) ||
        displayGroup(m.group).includes(query)
      );
    });
  }

  function renderGrid() {
    const list = visibleMembers();
    grid.replaceChildren();
    if (!list.length) {
      grid.append(el('div', { class: 'mgrid__empty' }, `没有找到 “${input.value.trim()}”`));
      return;
    }
    for (const m of list) {
      grid.append(
        el('button', {
          class: 'mcard',
          type: 'button',
          dataset: { id: m.id },
          onclick: () => toggleMember(m.id),
        },
          el('span', { class: 'mcard__zh' }, m.zh || m.name),
          el('span', { class: 'mcard__en' }, m.name),
          el('span', { class: 'mcard__group' }, displayGroup(m.group)),
          el('span', { class: 'mcard__check', html: iconCheck })
        )
      );
    }
    syncCards();
  }

  function syncCards() {
    const picked = new Set(getState().selected);
    grid.querySelectorAll('.mcard').forEach((card) => {
      card.classList.toggle('mcard--on', picked.has(card.dataset.id));
    });
  }

  function renderPickedChips() {
    const list = selectedMembers();
    pickedCount.textContent = list.length;
    pickedChips.replaceChildren();
    pickedEmpty.style.display = list.length ? 'none' : '';
    for (const m of list) {
      pickedChips.append(
        el('span', { class: 'picked__chip' },
          el('i', { class: 'picked__chipgroup' }, displayGroup(m.group)),
          m.zh || m.name,
          el('button', {
            class: 'picked__x',
            html: iconClose,
            'aria-label': `移出 ${m.zh || m.name}`,
            onclick: () => toggleMember(m.id),
          })
        )
      );
    }
    pickedChips.scrollLeft = pickedChips.scrollWidth;
  }

  /* ---- 底部操作条 ---- */
  const nextBtn = el('button', {
    class: 'btn btn--primary btn--block',
    type: 'button',
    onclick: () => goto(3),
  }, '下一步 · 分配定位');

  function syncNext() {
    nextBtn.disabled = !isFull();
    nextBtn.textContent = isFull()
      ? '下一步 · 分配定位'
      : `还差 ${getState().size - getState().selected.length} 人`;
  }

  // 自己处理“选择变化”的局部刷新，不整页重绘（保住搜索框焦点）
  const unsub = subscribe(() => {
    syncCards();
    renderPickedChips();
    syncNext();
  });

  renderGrid();
  renderPickedChips();
  syncNext();

  const node = el('section', { class: 'step step-members' },
    picked,
    el('div', { class: 'toolbar' }, search, chips),
    grid,
    el('footer', { class: 'actionbar' }, nextBtn)
  );
  node.addEventListener('unmount', unsub);
  return node;
}
