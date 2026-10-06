// 顶部进度条 + 轻提示 toast
import { el, clearNode } from './dom.js';
import { iconBack } from './icons.js';
import { getState, goBack } from '../state.js';

export const STEP_TITLES = {
  1: '选择团人数',
  2: '选择成员',
  3: '分配定位',
  4: '命名团体',
};

let headerEl = null;
let toastEl = null;
let toastTimer = 0;

export function initShell(root) {
  headerEl = el('header', { class: 'topbar' });
  toastEl = el('div', { class: 'toast', role: 'status' });
  root.append(headerEl, el('main', { id: 'view', class: 'view' }), toastEl);
  renderHeader();
}

export function renderHeader() {
  const { step } = getState();
  clearNode(headerEl);

  if (step === 0 || step >= 5) {
    headerEl.classList.add('topbar--hidden');
    return;
  }
  headerEl.classList.remove('topbar--hidden');

  const segments = [1, 2, 3, 4].map((n) =>
    el('i', { class: `seg${n <= step ? ' seg--on' : ''}`, dataset: { n } })
  );

  headerEl.append(
    el('div', { class: 'topbar__row' },
      step > 0
        ? el('button', {
            class: 'iconbtn',
            html: iconBack,
            'aria-label': '上一步',
            onclick: () => goBack(),
          })
        : el('span', { class: 'iconbtn iconbtn--ghost' }),
      el('div', { class: 'topbar__step' },
        el('span', { class: 'topbar__stepno' }, `${getState().mode === 'girls' ? '女团' : '男团'} · ${step} / 4`),
        el('div', { class: 'topbar__segs' }, segments)
      ),
      el('span', { class: 'iconbtn iconbtn--ghost' })
    ),
    el('div', { class: 'topbar__title' }, STEP_TITLES[step] || '')
  );
}

export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('toast--show'), 1900);
}
