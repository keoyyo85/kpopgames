// 运行时能力检测与基线兜底（Chrome 61 可用）
// 只做“对象 / 方法是否存在”的能力检测，不按 UA 或机型分支。

// Flex gap 必须用布局行为检测：@supports / CSS.supports('gap') 只能证明语法可解析，
// 无法证明 gap 在 Flexbox（Chrome 84+）中生效。
function supportsFlexGap() {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.display = 'flex';
  probe.style.flexDirection = 'column';
  probe.style.rowGap = '1px';
  probe.appendChild(document.createElement('div'));
  probe.appendChild(document.createElement('div'));
  document.body.appendChild(probe);
  const supported = probe.scrollHeight === 1;
  if (probe.parentNode) probe.parentNode.removeChild(probe);
  return supported;
}

function supportsEnv() {
  try {
    return !!(window.CSS && window.CSS.supports && window.CSS.supports('padding-top: env(safe-area-inset-top)'));
  } catch (error) {
    return false;
  }
}

// 安全区变量兜底：PC 模拟器注入 --safe-area-inset-*；真机用 env()。
// 两者都拿不到的内核里，显式给 0px，避免 var() 解析失败导致整条 padding 声明失效。
function ensureSafeAreaVars() {
  if (supportsEnv()) return;
  const root = document.documentElement;
  const sides = ['top', 'right', 'bottom', 'left'];
  for (let i = 0; i < sides.length; i += 1) {
    const name = '--safe-area-inset-' + sides[i];
    const current = root.style.getPropertyValue(name);
    if (!current) root.style.setProperty(name, '0px');
  }
}

// 可视高度：软键盘 / 地址栏变化时维护 --app-height，静态兜底为 100vh
function trackAppHeight() {
  const root = document.documentElement;
  const setHeight = () => {
    const viewport = window.visualViewport;
    const height = viewport && viewport.height ? viewport.height : window.innerHeight;
    if (height) root.style.setProperty('--app-height', Math.round(height) + 'px');
  };
  setHeight();
  window.addEventListener('resize', setHeight);
  window.addEventListener('orientationchange', setHeight);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setHeight);
}

let applied = false;

export function applyCompatFlags() {
  if (applied) return;
  applied = true;

  if (supportsFlexGap()) document.documentElement.classList.add('supports-flex-gap');
  ensureSafeAreaVars();
  trackAppHeight();
}
