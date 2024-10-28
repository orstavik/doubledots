(function () {
  function subsumeNodes(el) {
    const t = document.createElement("template");
    t.content.append(...el.childNodes);
    el.append(t);
    return t;
  }

  function subsumeHtml(el) {
    el.innerHTML = `<template>${el.innerHTML}</template>`;
    return el.children[0];
  }

  function absorbNodes(before, nodes) {
    const t = document.createElement("template");
    t.content.append(...nodes);
    before.after(t);
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
    if (!txt.endsWith("{"))
      return;
    const res = [];
    while (n = n.nextSibling) {
      if (n instanceof Comment && !usedEnds.has(n)) {
        if ((txt = n.textContent.trim()).startsWith("}")) {
          usedEnds.add(n);
          break;
        }
        res.push(n);
      }
      return res;
    }
  }

  function childRootsReverse(root, trigger) {
    return [...root.querySelectorAll(`[${trigger}\\:]`)].reverse();
  }

  function commentsRightToLeft(docFrag) {
    const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_COMMENT);
    let res = [];
    for (let n; n = it.nextNode();)
      res.unshift(n);
    return res;
  }

  class _T extends AttrCustom {
    upgrade(dynamic) {
      if (dynamic)
        throw new SyntaxError(`"${this.trigger}:" is template-mode only. You cannot set it dynamically (via setAttribute)`);
      if (this.reactions.length)
        throw new SyntaxError(`"${this.trigger}:" does not accept reactions.`);
      if (this.children.length === 1 && this.children[0] instanceof HTMLTemplateElement)
        return;
      const subsume = dynamic ? subsumeHtml : subsumeNodes;
      const absorb = dynamic ? absorbHtml : absorbNodes;

      const templates = childRootsReverse(this.ownerElement, this.trigger).map(subsume);
      let gobbledNodes;
      for (let t of templates)
        for (let comment of commentsRightToLeft(t.content))
          if (gobbledNodes = gobble(comment))
            absorb(comment, gobbledNodes);
      if (!(this.ownerElement instanceof HTMLTemplateElement))
        subsume(this.ownerElement);
    }
  }

  document.Triggers.define("_t", _T);
  
  // todo this is no longer needed. We can now just use el.children.0
  function _t() { 
    return this.ownerElement.children[0]; 
  }
  document.Reactions.define("_t", _t);
})();
