(function (cloneNodeOg, insertAdjacentElementOg) {

  function insertAdjacentClone(pos, templateEl, cb) {
    const c = cloneNodeOg.call(templateEl, true);
    typeof cb === 'function' && cb(c);
    insertAdjacentElementOg.call(this, pos, c);
    AttrCustom.upgradeBranch(c);
  }
  Object.defineProperty(Element.prototype, "insertAdjacentClone", {
    value: insertAdjacentClone,
    writable: true, configurable: true, enumerable: true
  });

})(Node.prototype.cloneNode, Element.prototype.insertAdjacentElement);