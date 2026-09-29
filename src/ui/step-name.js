// Step 4 · 给新团取名
import { el } from './dom.js';
import { getState, setTeamName, goto } from '../state.js';

const MAX_LEN = 16;

export function render() {
  const state = getState();

  const input = el('input', {
    class: 'nameinput__field',
    type: 'text',
    placeholder: '比如 NOVA',
    maxlength: MAX_LEN,
    autocomplete: 'off',
    value: state.teamName,
  });

  const preview = el('div', { class: 'namepreview' },
    el('span', { class: 'namepreview__tag' }, 'NEW BOY GROUP'),
    el('span', { class: 'namepreview__name' }, state.teamName.trim() || '你的新团名'),
    el('span', { class: 'namepreview__sub' }, '这是你亲手组建的新男团。')
  );

  const lenLabel = el('span', { class: 'nameinput__len' }, `${state.teamName.length}/${MAX_LEN}`);

  const done = el('button', {
    class: 'btn btn--primary btn--block',
    type: 'button',
    disabled: !state.teamName.trim(),
    onclick: () => goto(5),
  }, '完成 · 生成出道资料卡');

  input.addEventListener('input', () => {
    const name = input.value;
    setTeamName(name, { silent: true }); // 只存数据不触发重绘，保住输入框焦点
    preview.querySelector('.namepreview__name').textContent = name.trim() || '你的新团名';
    lenLabel.textContent = `${name.length}/${MAX_LEN}`;
    done.disabled = !name.trim();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) goto(5);
  });

  return el('section', { class: 'step step-name' },
    el('label', { class: 'namelabel' }, '团名'),
    el('div', { class: 'nameinput' }, input, lenLabel),
    preview,
    el('p', { class: 'hint hint--center' }, '只差一步了——取个响亮的名字。'),
    el('footer', { class: 'actionbar actionbar--static' }, done)
  );
}
