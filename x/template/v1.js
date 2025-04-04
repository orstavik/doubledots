// (function () {
const ElAppendOG = DoubleDots.nativeMethods("Element.prototype.append");
const DocfragAppendOG = DoubleDots.nativeMethods("DocumentFragment.prototype.append");
const CommentAfterOG = DoubleDots.nativeMethods("Comment.prototype.after");
const cloneNodeOG = DoubleDots.nativeMethods("Node.prototype.cloneNode");
const docCreateElOG = DoubleDots.nativeMethods("Document.prototype.createElement");
const setAttributeOG = DoubleDots.nativeMethods("Element.prototype.setAttribute");

function setAttributes(el, txt) {
  const pieces = txt.split(/([_a-zA-Z][a-zA-Z0-9.:_-]*="[^"]*")/);
  pieces.forEach((unit, i) => {
    if (i % 2 === 1) {
      const [_, name, value] = unit.match(/^([_a-zA-Z][a-zA-Z0-9.:_-]*)="([^"]*)"$/);
      setAttributeOG.call(el, name, value);
    } else if (unit.trim() !== "") {
      throw new SyntaxError(`<!--<template ${txt}>-->` + ' has an incorrect name="value"');
    }
  });
}

function subsumeNodes(at) {
  const el = at.ownerElement;
  const t = docCreateElOG.call(document, "template");
  setAttributes(t, at.value);
  DocfragAppendOG.call(t.content, ...el.childNodes);
  ElAppendOG.call(el, t);
  return t;
}

function subsumeHtml(at) {
  const el = at.ownerElement;
  el.innerHTML = `<template ${at.value}>${el.innerHTML}</template>`;
  return el.children[0];
}

function absorbNodes({ start, nodes, txt, end }) {
  const t = docCreateElOG.call(document, "template");
  setAttributes(t, txt);
    //todo instead of doing this, we could just add the STR = `<template {txt}></template>` and add it and then check that the outerHTML of the element added === STR ??
  DocfragAppendOG.call(t.content, ...nodes);
  CommentAfterOG.call(start, t);
  start.remove(), end?.remove();
}

function absorbHtml({ start, nodes, txt, end }) {
  let content = "";
  for (let n of nodes) {
    content += n.outerHTML ?? n instanceof Comment ? `<!--${n.textContent}-->` : n.textContent;
    n.remove();
  }
  start.insertAdjacentHTML("afterend", `<template ${txt}>${content}</template>`);
  start.remove(), end?.remove();
}

function gobble(start) {
  const txt = start.textContent.match(/^\s*<template(.*)>\s*$/)[1];
  const nodes = [];
  for (let n = start; n = n.nextSibling;) {
    if (n instanceof Comment && n.textContent.match(/^\s*<\/template\s*>\s*$/))
      return { start, nodes, txt, end: n };
    nodes.push(n);
  }
  return { start, nodes, txt };
}

function* templateTriggers(el, trigger) {
  for (let n, it = document.createNodeIterator(el, NodeFilter.SHOW_ELEMENT); n = it.nextNode();)
    for (let a of n.attributes)
      if (a.name.startsWith(trigger)) {
        yield a;
        break;
      }
}

function* templateCommentStarts(root) {
  const it = document.createNodeIterator(root, NodeFilter.SHOW_COMMENT);
  for (let n; n = it.nextNode();)
    if (n.textContent.match(/^\s*<template(.*)>\s*$/))
      yield n;
}

function hashDebug(el) {
  el = cloneNodeOG.call(el, true);
  for (let a of el.attributes)
    if (a.name.startsWith("template:"))
      el.removeAttribute(a.name);
  return `Replace the following element in your code:\n\n${el.outerHTML}`;
}

export class Template extends AttrCustom {
  upgrade(dynamic) {
    const el = this.ownerElement;
    if (el instanceof HTMLTemplateElement)
      throw new Error("template trigger cannot be applied to template elements.");
    if (!el.childNodes.length === 0 || el.children.length === 1 && el.children[0] instanceof HTMLTemplateElement)
      return;
    const subsume = dynamic ? subsumeHtml : subsumeNodes;
    const absorb = dynamic ? absorbHtml : absorbNodes;

    const attributes = [...templateTriggers(el, this.trigger + ":")].reverse();
    const templates = attributes.map(subsume);
    for (let t of templates)
      for (let comment of [...templateCommentStarts(t.content)].reverse())
        absorb(gobble(comment));

    DoubleDots.log?.('template: production tutorial', hashDebug(el));
    //todo now we don't have any events coming from the template: trigger.
    //todo below is what it looks like if we upgrade and dispatch an event using downward propagation.
    // for (let a of attributes)
    //   AttrCustom.upgrade(a);
    // eventLoop.dispatchBatch(new Event("template"), [attributes]);
  }
}


// todo this is no longer needed. We can now just use el.children.0
export function template() {
  return this.ownerElement.children[0];
}
// })();