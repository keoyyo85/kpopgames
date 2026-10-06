// 极简 DOM 构建工具：el('div', {class:'x', onclick: fn}, child1, child2)
// 兼容基线为 Chrome 61：不使用 Array.prototype.flat（Chrome 69+）与 Element.replaceChildren（Chrome 86+）。

// 递归展开子节点，等价于原生 flat(Infinity)
function flatten(list, out) {
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (Array.isArray(item)) flatten(item, out);
    else out.push(item);
  }
  return out;
}

// 清空节点子元素，替代 Element.replaceChildren()
export function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      for (const [k, v] of Object.entries(value)) node.dataset[k] = v;
    } else node.setAttribute(key, value);
  }
  for (const child of flatten(children, [])) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

