(function () {

  function deprecated() {
    throw new DoubleDots.DeprecationError();
  }

  const mask = {
    "Element.prototype": {
      hasAttributeNS: deprecated,
      getAttributeNS: deprecated,
      setAttributeNS: deprecated,
      removeAttributeNS: deprecated,
      setAttributeNode: deprecated,
      removeAttributeNode: deprecated,
      getAttributeNodeNS: deprecated,
      setAttributeNodeNS: deprecated,
      // remaining API surface
      //  el.setAttribute(name, value)
      //  el.hasAttribute(name)
      //  el.getAttribute(name)
      //  el.getAttributeNode(name)
      //  el.attributes
      after: deprecated,
      before: deprecated
      //     "outerHTML": deprecated
    },
    "Event.prototype": {
      stopPropagation: deprecated,
      stopImmediatePropagation: deprecated,
    },
    "EventTarget.prototype": {
      addEventListener: deprecated,
      removeEventListener: deprecated,
      // remaining API surface
      //   dispatchEvent
    },
    "window": {
      setTimeout: deprecated,
      clearTimeout: deprecated,
      setInterval: deprecated,
      clearInterval: deprecated,
      event: deprecated
      //must add "async sleep(ms)" first
      //MutationObserver
      //ResizeObserver
      //IntersectionObserver
    },
    "Document.prototype": {
      createAttribute: deprecated,
      createComment: deprecated,
      createDocumentFragment: deprecated,
      createElement: deprecated,
      createTextNode: deprecated,
      importNode: deprecated,
      currentScript: deprecated,
      write: deprecated,
      // "createRange" //todo research
    },
    "Node.prototype": {
      cloneNode: deprecated
    },
    /*
    "HTMLElement.prototype": {
      adoptionCallback: problematicDeprecationMethod, needs to highJack the HTMLElement constructor actually.
    }
    */
  };

  for (let [path, objMask] of Object.entries(mask)) {
    path = path.split(".");
    const obj = path.reduce((o, p) => o[p], window);
    const nativeObj = path.reduce((o, p) => o[p] ??= {}, DoubleDots.nativeMethods);
    for (let [prop, deprecator] of Object.entries(objMask)) {
      const desc = Object.getOwnPropertyDescriptor(obj, prop);
      Object.defineProperty(nativeObj, prop, desc);
      if (desc.value)
        desc.value = deprecator;
      else
        desc.get = desc.get = deprecator;
    }
  }
})();