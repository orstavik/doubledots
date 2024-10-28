(function () {
  const ElAppendOG = DoubleDots.nativeMethods.Element.prototype.append;
  const DocfragAppendOG = DoubleDots.nativeMethods.DocumentFragment.prototype.append;
  const CommentAfterOG = DoubleDots.nativeMethods.Comment.prototype.after;

  function subsumeNodes(el) {
    const t = document.createElement("template");
    DocfragAppendOG.call(t.content, ...el.childNodes);
    ElAppendOG.call(el, t);
    return t;
  }

  function subsumeHtml(el) {
    el.innerHTML = `<template>${el.innerHTML}</template>`;
    return el.children[0];
  }

  function absorbNodes(before, nodes) {
    const t = document.createElement("template");
    DocfragAppendOG.call(t.content, ...nodes);
    CommentAfterOG.call(before, t);
  }

  function absorbHtml(before, nodes) {
    const txt = nodes.map(n =>
      n.outerHTML ?? n instanceof Comment ? `<!--${n.textContent}-->` : n.textContent);
    nodes.forEach(n => n.remove());
    before.insertAdjacentHTML("afterend", `<template>${txt.join("")}</template>`);
  }

  const usedEnds = new WeakSet();

  function gobble(n) {
    let txt = n.textContent.trim();
    if (!txt.match(/^template(\s|)/))
      return;
    const res = [];
    while (n = n.nextSibling) {
      if (n instanceof Comment && !usedEnds.has(n)) {
        if ((txt = n.textContent.trim()).match(/^\/template(\s|)/)) {
          usedEnds.add(n);
          break;
        }
      }
      res.push(n);
    }
    return res;
  }

  function descendantsReverse(root, trigger) {
    const it = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
    const elements = [], attributes = [];
    for (let n; n = it.nextNode();) {
      for (let a of n.attributes)
        if (a.name.startsWith(trigger)) {
          attributes.push(a);
          elements.unshift(n);
          break;
        }
    }
    return { elements, attributes };
    // return [...root.querySelectorAll(`[${trigger}\\:]`)].reverse();
  }

  function commentsRightToLeft(docFrag) {
    const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_COMMENT);
    let res = [];
    for (let n; n = it.nextNode();)
      res.unshift(n);
    return res;
  }

  class Template extends AttrCustom {
    upgrade(dynamic) {
      const el = this.ownerElement;
      if (el.childNodes.length === 0 || el.children.length === 1 && el.children[0] instanceof HTMLTemplateElement)
        return;
      if (el instanceof HTMLTemplateElement)
        throw new Error("template trigger cannot be applied to template elements.");
      const subsume = dynamic ? subsumeHtml : subsumeNodes;
      const absorb = dynamic ? absorbHtml : absorbNodes;

      const { elements, attributes } = descendantsReverse(el, this.trigger + ":");
      const templates = elements.map(subsume);
      let gobbledNodes;
      for (let t of templates)
        for (let comment of commentsRightToLeft(t.content))
          if (gobbledNodes = gobble(comment))
            absorb(comment, gobbledNodes);
      //todo now we don't have any events coming from the template: trigger.
      //todo below is what it looks like if we upgrade and dispatch an event using downward propagation.
      // for (let a of attributes)
      //   AttrCustom.upgrade(a);
      // eventLoop.dispatchBatch(new Event("template"), [attributes]);
    }
  }

  document.Triggers.define("template", Template);

  // todo this is no longer needed. We can now just use el.children.0
  function template() {
    return this.ownerElement.children[0];
  }
  document.Reactions.define("template", template);
})();