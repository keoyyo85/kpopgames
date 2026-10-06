// Step 1 · 选择团人数
import { el } from './dom.js';
import { getState, setSize, goto } from '../state.js';

const SIZES = [3, 4, 5, 6, 7, 8, 9, 10];

export function render() {
  const { size } = getState();

  const grid = el('div', { class: 'sizegrid' },
    SIZES.map((n) =>
      el('button', {
        class: `sizecard${n === size ? ' sizecard--on' : ''}`,
        type: 'button',
        onclick: () => {
          setSize(n);
          goto(2);
        },
      },
        el('span', { class: 'sizecard__num' }, n),
        el('span', { class: 'sizecard__unit' }, '人团'),
        el('span', { class: 'sizecard__arrow', 'aria-hidden': 'true' }, '↗')
      )
    )
  );

  return el('section', { class: 'step step-size' },
    el('div', { class: 'studio-hero' },
      el('span', { class: 'studio-hero__tag' }, 'YOUR DREAM LINEUP'),
      el('h1', {}, '重生之', el('br'), '我组kpop团体'),
      el('p', {}, '喜欢的人，这次站在同一个舞台。')
    ),
    el('div', { class: 'section-heading' },
      el('h2', {}, '先定一个心动阵容'), el('span', {}, '01 / 04')),
    el('p', { class: 'lead' },
      '从现有团体里挑人，', el('b', {}, '重新组成你的新团'), '。先定几个人？'),
    grid,
    el('p', { class: 'hint' }, '点击人数开始组团 · 随时可以返回调整'),
    el('div', { class: 'studio-footer' }, 'MADE OF YOUR FAVORITES · 梦想企划室')
  );
}
