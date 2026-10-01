// 结果页 · 男团出道资料卡
import { el } from './dom.js';
import { iconSpark } from './icons.js';
import { displayGroup } from '../data/members.js';
import { getState, selectedMembers, positionsOf, editRoster, resetAll } from '../state.js';
import { generateShareImages, copyShareText } from './share.js';

export function render() {
  const { teamName } = getState();
  const members = selectedMembers();

  const rows = members.map((m, i) => {
    const pos = positionsOf(m.id);
    return el('li', { class: 'roster__item' },
      el('span', { class: 'roster__no' }, String(i + 1).padStart(2, '0')),
      el('div', { class: 'roster__info' },
        el('div', { class: 'roster__name' },
          el('b', {}, m.zh || m.name),
          el('i', {}, m.name)
        ),
        el('div', { class: 'roster__group' }, '原团：', displayGroup(m.group)),
        el('div', { class: 'roster__pos' },
          '定位：',
          pos.length
            ? el('span', { class: 'roster__postags' },
                pos.map((p, idx) => [
                  idx > 0 ? el('i', { class: 'roster__slash' }, ' / ') : null,
                  el('em', {}, p),
                ]))
            : el('i', { class: 'roster__none' }, '自由活动')
        )
      )
    );
  });

  const card = el('div', { class: 'profilecard' },
    el('div', { class: 'profilecard__frame' },
      el('div', { class: 'profilecard__top' },
        el('span', { class: 'profilecard__tag', html: `${iconSpark}DEBUT PROFILE` }),
        el('h2', { class: 'profilecard__name' }, teamName.trim() || '未命名'),
        el('span', { class: 'profilecard__count' }, `成员人数：${members.length} 人`)
      ),
      el('ol', { class: 'roster' }, rows)
    ),
    el('p', { class: 'profilecard__slogan' }, '这是你组建的男团！')
  );

  return el('section', { class: 'step step-result' },
    card,
    el('div', { class: 'resultbtns resultbtns--share' },
      el('button', {
        class: 'btn btn--primary',
        type: 'button',
        onclick: () => generateShareImages(),
      }, '生成小红书分享图'),
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        onclick: () => copyShareText(),
      }, '复制出道文案')
    ),
    el('div', { class: 'resultbtns' },
      el('button', {
        class: 'btn btn--ghost',
        type: 'button',
        onclick: () => editRoster(),
      }, '修改阵容'),
      el('button', {
        class: 'btn btn--primary',
        type: 'button',
        onclick: () => resetAll(),
      }, '重新组团')
    )
  );
}
