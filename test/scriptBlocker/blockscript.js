function doBlockScriptUsingMo() {
  const mo = new MutationObserver(function blockScripts(mrs) {

    if (document.readyState !== 'loading')  //todo don't know fully about this one yet..
      debugger;

    const maybe = mrs[mrs.length - 1].target;
    if (maybe.tagName !== "SCRIPT")
      return;

    maybe.hasAttribute("src") ?
      maybe.setAttribute("src-og", maybe.getAttribute("src")) :
      maybe.removeAttribute("src-og");

    maybe.setAttributeNode(document.createAttribute("src"));
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
}

'onbeforescriptexecute' in document ?
  document.addEventListener("beforescriptexecute", e => e.preventDefault()) :
  doBlockScriptUsingMo();
