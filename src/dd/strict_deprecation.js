export function noPrimitiveConstructor(OG, name = OG.name) {
  Object.defineProperty(window, name, {
    value: function PrimitiveConstructor(...args) {
      if (new.target)
        throw new Error(`Replace "new ${name}(..." with "${name}(...".`);
      return OG(...args);
    },
    enumerable: true, writable: true, configurable: true
  });
}

export function ShadowRootAlwaysOpen() {
  const OG = HTMLElement.prototype.attachShadow;
  HTMLElement.prototype.attachShadow = function attachShadowAlwaysOpen(opt = {}, ...args) {
    opt.mode = "open";
    return OG.call(this, opt, ...args);
  };
}

export const DoubleDotStrictMask = {
  "Element.prototype": [
    "after",
    "before",
    "hasAttributeNS",
    "getAttributeNS",
    "setAttributeNS",
    "removeAttributeNS",
    "setAttributeNode",
    "removeAttributeNode",
    "getAttributeNodeNS",
    "setAttributeNodeNS",
    //     "outerHTML"

    //.setAttribute(name, value)
    //.hasAttribute(name)
    //.getAttribute(name)
    //.getAttributeNode(name)
    //.attributes
  ],
  "Event.prototype": [
    "stopPropagation",
    "stopImmediatePropagation"
  ],
  "EventTarget.prototype": [
    "addEventListener",
    "removeEventListener",
    //.dispatchEvent
  ],
  "window": [
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "event"
    //must add "async sleep(ms)" first
    //MutationObserver
    //ResizeObserver
    //IntersectionObserver
  ],
  "Document.prototype": [
    "createAttribute",
    "createComment",
    "createDocumentFragment",
    "createElement",
    "createTextNode",
    "importNode",
    "currentScript",
    "write",
    // "createRange" //todo research
  ],
  "Node.prototype": [
    "cloneNode"
  ],
  /*
  "HTMLElement.prototype": {
    adoptionCallback: problematicDeprecationMethod, needs to highJack the HTMLElement constructor actually.
  }
  */
};

function deprecated() {
  throw new Error("Deprecated in DoubleDots strict.");
}

export function deprecate(mask, OGs = {}) {
  for (let [path, methods] of Object.entries(mask)) {
    path = path.split(".");
    const obj = path.reduce((o, p) => o[p], window);
    const OG = path.reduce((o, p) => o[p] ??= {}, OGs);
    for (let prop of methods) {
      const desc = Object.getOwnPropertyDescriptor(obj, prop);
      desc.value ? desc.value = deprecated : desc.get = desc.get = deprecated;
      Object.defineProperty(obj, prop, desc);
      Object.defineProperty(OG, prop, desc);
    }
  }
}
