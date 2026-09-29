// 游戏状态与规则逻辑。UI 只调用这里的 action，不直接改内部数据。
import { MEMBERS, memberById, displayGroup } from './data/members.js';
import { positionByLabel, MAKNAE_LABEL } from './data/positions.js';

const state = {
  step: 1, // 1 选人数 2 选成员 3 分配定位 4 取团名 5 结果页
  size: 5,
  selected: [], // 按点选顺序保存的成员 id，天然不会重复
  positions: {}, // memberId -> [定位label, ...]
  teamName: '',
  direction: 'fwd', // 页面切换动画方向
};

const listeners = new Set();

export const getState = () => state;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

/* ---------------- 查询 ---------------- */

export const memberCount = () => state.selected.length;

export const isFull = () => state.selected.length >= state.size;

export const selectedMembers = () => state.selected.map(memberById).filter(Boolean);

export const positionsOf = (memberId) => state.positions[memberId] || [];

export function takenBy(positionLabel, exceptMemberId = null) {
  // 该定位当前被哪个成员占用（仅对 max=1 的定位有意义）
  for (const id of state.selected) {
    if (id === exceptMemberId) continue;
    if (positionsOf(id).includes(positionLabel)) return memberById(id);
  }
  return null;
}

export function canAssign(memberId, positionLabel) {
  const def = positionByLabel(positionLabel);
  if (!def) return false;
  if (positionsOf(memberId).includes(positionLabel)) return true; // 取消不受限
  if (def.max === 1 && takenBy(positionLabel, memberId)) return false;
  return true;
}

/* ---------------- 内部工具 ---------------- */

function cleanPositionsFor(ids) {
  const keep = new Set(ids);
  for (const id of Object.keys(state.positions)) {
    if (!keep.has(id) || !state.positions[id].length) delete state.positions[id];
  }
}

// 根据生日自动指定忙内：拿掉旧的，挂到最年轻的成员身上（没有生日数据则不挂）
function autoAssignMaknae() {
  for (const id of state.selected) {
    const list = state.positions[id];
    if (list) state.positions[id] = list.filter((l) => l !== MAKNAE_LABEL);
  }
  const dated = selectedMembers().filter((m) => m.birth);
  if (!dated.length) return;
  const youngest = dated.reduce((a, b) => (a.birth > b.birth ? a : b));
  const list = state.positions[youngest.id] || [];
  if (!list.includes(MAKNAE_LABEL)) state.positions[youngest.id] = [...list, MAKNAE_LABEL];
}

let toastFn = null;
export function bindToast(fn) {
  toastFn = fn;
}
function toast(msg) {
  if (toastFn) toastFn(msg);
}

/* ---------------- actions ---------------- */

export function setSize(n) {
  if (state.size === n) return;
  state.size = n;
  if (state.selected.length > n) state.selected = state.selected.slice(0, n);
  cleanPositionsFor(state.selected);
  autoAssignMaknae();
  emit();
}

// 选择 / 取消成员。超过人数上限时给出提示并拒绝。
export function toggleMember(id) {
  const idx = state.selected.indexOf(id);
  if (idx >= 0) {
    state.selected.splice(idx, 1);
    delete state.positions[id];
    autoAssignMaknae();
    emit();
    return true;
  }
  if (state.selected.length >= state.size) {
    toast(`这个团只要 ${state.size} 个人，先取消一位再换吧`);
    return false;
  }
  state.selected.push(id);
  autoAssignMaknae();
  emit();
  return true;
}

export function togglePosition(memberId, label) {
  if (!state.selected.includes(memberId)) return;
  const list = state.positions[memberId] || [];
  if (list.includes(label)) {
    const next = list.filter((l) => l !== label);
    if (next.length) state.positions[memberId] = next;
    else delete state.positions[memberId];
  } else {
    if (!canAssign(memberId, label)) {
      const def = positionByLabel(label);
      const other = takenBy(label, memberId);
      toast(`「${def.label}」已经是 ${other.zh || other.name} 的了`);
      return;
    }
    state.positions[memberId] = [...list, label];
  }
  emit();
}

export function setTeamName(name, { silent = false } = {}) {
  state.teamName = name;
  if (!silent) emit();
}

// 带门禁的跳页：人数没选满不允许进 Step 3
export function goto(step) {
  if (step >= 3 && state.selected.length < state.size) {
    toast(`还差 ${state.size - state.selected.length} 个人，先选满吧`);
    return;
  }
  if (step === state.step) return;
  state.direction = step > state.step ? 'fwd' : 'back';
  state.step = step;
  emit();
}

export function goBack() {
  const prev = { 2: 1, 3: 2, 4: 3, 5: 4 }[state.step];
  if (prev) goto(prev);
}

// 从结果页回 Step 2 改阵容：已选成员与定位全部保留
export function editRoster() {
  state.direction = 'back';
  state.step = 2;
  emit();
}

// 重新组团：清空上一局的一切
export function resetAll() {
  state.step = 1;
  state.size = 5;
  state.selected = [];
  state.positions = {};
  state.teamName = '';
  state.direction = 'back';
  emit();
}

export { displayGroup };
