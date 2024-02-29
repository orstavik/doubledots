import { domEvents, windowEvents, documentEvents } from "./test/scriptBlocker/nativeEvents.js";

const elEvents = [...domEvents()];
const regx = elEvents.map((n) => n + ":+").join("|");
const docEvents = [...documentEvents()];
const winEvents = [...windowEvents()];

function getCustomReactionsFromElements(elementsArr) {
  let customReactions = [];
  console.log(elementsArr);
  for (let element in elementsArr) {
    console.log(element.getAttributeNames());
    console.log(element.outerHTML);
    console.log(element.nodeName);
  }
  return customReactions;
}

function doDispatch(elems) {
  const customReactions = getCustomReactionsFromElements(elems);
  //todo this is the callback
}

(function () {
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

  Node.prototype.cloneNode = deprecated.bind("node.cloneNode");
  Document.prototype.createElement = deprecated.bind("document.createElement");
  // todo appendChild, prepend.. etc. insertAdjacentElements
  // outerHTML

  monkeyPatch(Element.prototype, "innerHTML", "set", innerHTML_ho);
  monkeyPatch(ShadowRoot.prototype, "innerHTML", "set", innerHTML_ho);
  monkeyPatch(Element.prototype, "insertAdjacentHTML", "value", function (og) {
    return function insertAdjacentHTML_patch(position, ...args) {
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
})();

function pauseScriptInMRS(mrs) {
  const last = mrs[mrs.length - 1].target;
  if (last.tagName === "SCRIPT") pauseScript(last);
}

function pauseScript(script) {
  if (script.hasAttribute("src")) script.setAttribute(":src", script.getAttribute("src"));
  script.setAttributeNode(document.createAttribute("src"));
}

function newElementsFromMrs(mrs) {
  let response = [];
  mrs.map((mr) => {
    if (mr.addedNodes.length > 0) {
      mr.addedNodes.forEach((element) => {
        response = response.concat(element);
      });
    }
    if (mr.removedNodes.length > 0) {
      mr.removedNodes.forEach((element) => {
        response = response.concat(element);
      });
    }
  });
  return response;
  // throw "implement me, get all the added elements from all the mr in mrs. Please. Thank you)";
}

document.addEventListener("beforescriptexecute", (e) => e.preventDefault());
const mo = new MutationObserver(function (mrs) {
  pauseScriptInMRS(mrs);
  const newElements = newElementsFromMrs(mrs);
  doDispatch(newElements);
  if (document.readyState === "complete")
    //interactive??
    mo.disconnect();
    
});
mo.observe(document.documentElement, { childList: true, subtree: true });

// document.addEventListener("readystatechange", e => ); //bug
//      b)  Turn DOMEvents into querySelector inputs!! is there no way? :(
