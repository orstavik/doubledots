(function () {

  //todo deprecate the setter of outerHTML

  window.DoubleDots.nativeMethods = {};

  //.attachShadow(/*always open*/);   
  //Needed to capture the full composedPath of customEvents.
  function attachShadowforceModeOpen(...args) {
    (args[0] ??= {}).mode = "open";
    return args;
  }

  function sameRootFirstArg(child) {
    if (this.getRootNode() !== child?.getRootNode())
      throw new DoubleDots.InsertElementFromJSError(this, child);
  }

  function sameRootSecond(_, child) {
    if (this.getRootNode() !== child?.getRootNode())
      throw new DoubleDots.InsertElementFromJSError(this, child);
  }

  function sameRootSpreadArg(...args) {
    for (const child of args)
      if (this.getRootNode() !== child?.getRootNode())
        throw new DoubleDots.InsertElementFromJSError(this, child);
  }

  function deprecated() {
    throw new DoubleDots.DeprecationError;
  }

  const mask = {
    "Element.prototype": {
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,
      insertAdjacentElement: sameRootSecond,

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
    },
    "Event.prototype": {
      stopPropagation: deprecated,
      stopImmediatePropagation: deprecated,
    },
    // todo this should likely not be hidden. Used by lots of triggers.
    // "EventTarget.prototype": {
    //   addEventListener: deprecated,
    //   removeEventListener: deprecated,
    //   dispatchEvent: deprecated
    // },
    "window": {
      setTimeout: deprecated,
      clearTimeout: deprecated,
      setInterval: deprecated,
      clearInterval: deprecated,
      // event: deprecated, //todo this is impossible. It will always remain.
    },
    "document": {
      write: deprecated,
    },
    "Document.prototype": {
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,

      // currentScript: deprecated, //todo this is a setter, not a function. Do we really need to bother with it
      createAttribute: deprecated,
      createComment: deprecated,
      createDocumentFragment: deprecated,
      createElement: deprecated,
      createTextNode: deprecated,
      importNode: deprecated,
      // "createRange" //todo research
    },
    "DocumentFragment.prototype": {
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,
    },
    "Node.prototype": {
      cloneNode: deprecated
    },
    "HTMLElement.prototype": {
      attachShadow: attachShadowforceModeOpen
      // adoptionCallback: problematicDeprecationMethod, needs to highJack the HTMLElement constructor actually.
    }
  };

  function monkeyPatch(proto, prop, value) {
    Object.defineProperty(proto, prop, {
      ...Object.getOwnPropertyDescriptor(proto, prop), value
    });
  }

  function injectArgumentVerifier(OG, verify) {
    return function (...args) {
      return OG.apply(this, verify.call(this, ...args) || args);
    };
  }

  function getObj(obj, path) {
    for (let i = 0; i < path.length; i++)
      obj = (obj[path[i]] ??= {});
    return obj;
  }

  for (let [path, objMask] of Object.entries(mask)) {
    path = path.split(".");
    const obj = getObj(window, path);
    const nativeObj = getObj(DoubleDots.nativeMethods, path);
    for (let [prop, verifyMethod] of Object.entries(objMask)) {
      const OG = nativeObj[prop] = obj[prop];
      const newFunc = injectArgumentVerifier(OG, verifyMethod);
      monkeyPatch(obj, prop, newFunc);
    }
  }
})();