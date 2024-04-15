// const elEvents = [...window.domEvents()];
// const regx = elEvents.map((n) => "_?"+ n + ":+").join("|");
// const docEvents = [...window.documentEvents()];
// const winEvents = [...window.windowEvents()];

let CB, cache = [...document.querySelectorAll("*")];

window.observeElementsCreated = function (cb) {
  if (CB)
    throw "Only a single callback can be added to observeElementsCreated";
  CB = cb;
  const ar = cache;
  cache = undefined;
  return ar;
};

function doDispatch(elems) {
  CB?.(elems) || cache.push(...elems);
}

(function (NodeProto, DocumentProto, ElementProto, ShadowRootProto) {
  function monkeyPatch(proto, prop, valueOrSet, hoFun, desc = Object.getOwnPropertyDescriptor(proto, prop)) {
    desc[valueOrSet] = hoFun(desc[valueOrSet]);
    Object.defineProperty(proto, prop, desc);
  }

  function deprecated() {
    throw `${this}() is deprecated`;
  }

  function innerHTML_ho(og) {
    return function innerHTML_patch(val) {
      og.call(this, val);
      doDispatch([...this.querySelectorAll("*")]);
    };
  }

  NodeProto.cloneNode = deprecated.bind("node.cloneNode");
  DocumentProto.createElement = deprecated.bind("document.createElement");
  // todo appendChild, prepend.. etc. insertAdjacentElements
  // outerHTML

  monkeyPatch(ElementProto, "innerHTML", "set", innerHTML_ho);
  monkeyPatch(ShadowRootProto, "innerHTML", "set", innerHTML_ho);
  //red bug!
  monkeyPatch(ElementProto, "insertAdjacentHTML", "value", function (og) {
    return function insertAdjacentHTML_patch(position, ...args) {
      console.log("bob");
      const root = position === "beforebegin" || position === "afterend" ? this.parentNode : this;
      const index = root.children.indexOf(this);
      const length = root.children.length;
      og.call(this, position, ...args);
      const length2 = root.children.length;
      const added = length2 - length;
      const newRoots = root.children.slice(index, length);
      doDispatch(newRoots.map((r) => r.querySelectorAll("*")).flatten());
    };
  });
})(Node.prototype, Document.prototype, Element.prototype, ShadowRoot.prototype);

const mo = new MutationObserver(function (mrs) {
  // todo add the race condition test from the elementObserver.js
  const newElements =
    mrs.map(mr => [...mr.addedNodes].filter(n => n instanceof Element)).flat();
  doDispatch(newElements);
});
mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
window.addEventListener("DOMContentLoaded", _ => mo.disconnect());
// document.addEventListener("readystatechange", e => ); //bug
//      b)  Turn DOMEvents into querySelector inputs!! is there no way? :(
