import './styles.css';

import { getState, subscribe, bindToast } from './state.js';
import { initShell, renderHeader, toast } from './ui/shell.js';
import * as stepSize from './ui/step-size.js';
import * as stepMembers from './ui/step-members.js';
import * as stepPositions from './ui/step-positions.js';
import * as stepName from './ui/step-name.js';
import * as stepResult from './ui/result.js';

const STEPS = {
  1: stepSize,
  2: stepMembers,
  3: stepPositions,
  4: stepName,
  5: stepResult,
};

let currentStep = 0;

function renderStep() {
  const state = getState();
  const view = document.getElementById('view');

  const old = view.firstElementChild;
  if (old) old.dispatchEvent(new CustomEvent('unmount'));
  view.replaceChildren();

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
initShell(app);
bindToast(toast);

subscribe((state) => {
  if (state.step !== currentStep) renderStep();
});
renderStep();
