import { el } from './dom.js';
import { setMode } from '../state.js';

export function render() {
  return el('section', { class: 'step step-mode' },
    el('div', { class: 'mode-masthead' },
      el('span', {}, 'KPOP / CREATIVE STUDIO'), el('span', {}, 'VOL. 01')),
    el('div', { class: 'mode-intro' },
      el('span', { class: 'eyebrow' }, 'THE LINEUP IS YOURS.'),
      el('h1', {}, '重生之', el('br'), '我组', el('span', { class: 'mode-word' }, 'kpop'), '团体'),
      el('p', {}, '把喜欢的人，放在同一个舞台。', el('br'), '从这里，开始你的出道企划。')),
    el('div', { class: 'mode-options' },
      [['boys', '01', '男团企划', 'BOY GROUP'], ['girls', '02', '女团企划', 'GIRL GROUP']].map(([mode, no, title, subtitle]) =>
        el('button', { class: 'mode-card', type: 'button', onclick: () => setMode(mode) },
          el('span', { class: 'mode-card__no' }, no),
          el('span', { class: 'mode-card__text' }, el('b', {}, title), el('small', {}, subtitle)),
          el('span', { class: 'mode-card__arrow', 'aria-hidden': 'true' }, '↗')))),
    el('div', { class: 'mode-bottom' },
      el('span', {}, '选成员 / 定定位 / 取团名'),
      el('span', {}, 'YOUR TASTE. YOUR GROUP.')));
}
