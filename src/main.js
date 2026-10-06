import './styles.css';
import './glass.css';

import { getState, subscribe, bindToast } from './state.js';
import { initShell, renderHeader, toast } from './ui/shell.js';
import { clearNode } from './ui/dom.js';
import { applyCompatFlags } from './ui/compat.js';
import * as stepSize from './ui/step-size.js';
import * as stepMode from './ui/step-mode.js';
import * as stepMembers from './ui/step-members.js';
import * as stepPositions from './ui/step-positions.js';
import * as stepName from './ui/step-name.js';
import * as stepResult from './ui/result.js';

const STEPS = {
  0: stepMode,
  1: stepSize,
  2: stepMembers,
  3: stepPositions,
  4: stepName,
  5: stepResult,
};

let currentStep = -1;

function renderStep() {
  const state = getState();
  const view = document.getElementById('view');

  const old = view.firstElementChild;
  if (old) old.dispatchEvent(new CustomEvent('unmount'));
  clearNode(view);

  const node = STEPS[state.step].render();
  node.classList.add('step--enter', state.direction === 'back' ? 'step--back' : 'step--fwd');
  // 动画结束后移除动画类：残留的 transform 会把 fixed 定位的包含块劫持到 .step
  node.addEventListener('animationend', () => node.classList.remove('step--enter'), { once: true });
  view.append(node);

  renderHeader();
  window.scrollTo(0, 0);
  currentStep = state.step;
}

const app = document.getElementById('app');
// 能力检测须在核心页面渲染前执行
applyCompatFlags();
initShell(app);
bindToast(toast);

subscribe((state) => {
  if (state.step !== currentStep) renderStep();
});
renderStep();
