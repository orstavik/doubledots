(function (aelOG) {
  if (document.readyState !== "loading")
    return AttrCustom.upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", _ => AttrCustom.upgradeBranch(document.documentElement));
})(EventTarget.prototype.addEventListener);