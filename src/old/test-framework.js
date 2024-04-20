document.addEventListener("beforescriptexecute", e => e.preventDefault());

function pauseScript(script) {
  if (script.hasAttribute("src"))
    script.setAttribute(":src", script.getAttribute("src"));
  script.setAttributeNode(document.createAttribute("src"));
}

function activateScript(script) {
  script.hasAttribute(":src") ?
    script.setAttribute("src", script.getAttribute(":src")) :
    script.removeAttribute("src");
}

const ignore = observeElementsCreated(function checkForCustomReaction(elems) {
  if(elems[elems.length-1]?.tagName === "SCRIPT")
    pauseScript(elems[elems.length-1]);

  for (let el of elems)
    if (el.attributes)
      for (const att of el.attributes)
        if (att.name.includes(":"))
          console.log(att.name, el.tagName);
});

setTimeout(function () {
  for (let script of document.querySelectorAll("script[:src]"))
    activateScript(script);
}, 0);
