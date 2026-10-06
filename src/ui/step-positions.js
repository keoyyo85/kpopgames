// Step 3 · 分配定位（可多选；队长 / Center / Face of the Group 全团限 1 人；忙内按生日自动预选）
import { el } from './dom.js';
import { POSITIONS, MAKNAE_LABEL } from '../data/positions.js';
import { displayGroup } from '../data/members.js';
import {
  subscribe,
  togglePosition,
  positionsOf,
  canAssign,
  selectedMembers,
  goto,
} from '../state.js';

export function render() {
  const members = selectedMembers();

  const list = el('div', { class: 'poslist' });

  function chip(member, def) {
    const btn = el('button', {
      class: 'pchip',
      type: 'button',
      dataset: { member: member.id, label: def.label },
      onclick: () => togglePosition(member.id, def.label),
    }, def.label);
    if (def.auto === 'maknae') btn.classList.add('pchip--maknae');
    return btn;
  }

  function syncCard(card, member) {
    const mine = new Set(positionsOf(member.id));
    card.querySelectorAll('.pchip').forEach((btn) => {
      const label = btn.dataset.label;
      btn.classList.toggle('pchip--on', mine.has(label));
      btn.classList.toggle('pchip--lock', !mine.has(label) && !canAssign(member.id, label));
    });
  }

  for (const m of members) {
    const card = el('article', { class: 'poscard', dataset: { id: m.id } },
      el('header', { class: 'poscard__head' },
        el('div', { class: 'poscard__name' },
          el('span', { class: 'poscard__zh' }, m.zh || m.name),
          el('span', { class: 'poscard__en' }, m.name)
        ),
        el('div', { class: 'poscard__meta' },
          displayGroup(m.group),
          m.birth ? el('i', {}, ` · 生日 ${m.birth.slice(5).replace('-', '.')}`) : null
        )
      ),
      el('div', { class: 'poscard__chips' }, POSITIONS.map((def) => chip(m, def)))
    );
    syncCard(card, m);
    list.append(card);
  }

  // 状态变化（含自动忙内）时，只同步各卡片上的标签状态
  const unsub = subscribe(() => {
    list.querySelectorAll('.poscard').forEach((card) => {
      const m = members.find((x) => x.id === card.dataset.id);
      if (m) syncCard(card, m);
    });
  });

  const node = el('section', { class: 'step step-pos' },
    el('p', { class: 'lead lead--pos' },
      '点标签安排定位，一人可以身兼多个；', el('b', {}, '不用全部填满'), '。队长 / Center / Face of the Group 每个全团限 1 人。',
      members.some(m => !m.birth) ? ' 部分成员暂无生日，忙内可手动选择。' : ''),
    list,
    el('footer', { class: 'actionbar' },
      el('button', {
        class: 'btn btn--primary btn--block',
        type: 'button',
        onclick: () => goto(4),
      }, '下一步 · 取团名'))
  );
  node.addEventListener('unmount', unsub);
  return node;
}

// 忙内自动逻辑的说明文案（供卡片内的自动标签使用）
export const MAKNAE_HINT = MAKNAE_LABEL;
