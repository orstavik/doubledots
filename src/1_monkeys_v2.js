(function () {
  window.DoubleDots = {
    DoubleDotsError: class DoubleDotsError extends Error { },
    DeprecationError: class DeprecationError extends Error { },
    native: {}
  };

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
    },
    "Event.prototype": {
      stopPropagation: deprecated,
      stopImmediatePropagation: deprecated,
    },
    "EventTarget.prototype": {
      addEventListener: deprecated,
      removeEventListener: deprecated,
      dispatchEvent: deprecated
    },
    "document": {
      write: deprecated,
    },
    // "window": {
    //   event: deprecated, //todo this is impossible. It will always remain.
    // },
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

  function patchMethod(OG, verify) {
    return function DoubleDotsArgumentVerifier(...args) {
      return OG.apply(this, verify.call(this, ...args) || args);
    };
  }

  function getObj(obj, path) {
    for (let i = 0; i < path.length - 1; i++)
      obj = obj[path.shift()] || {};
    return obj;
  }

  for (let [path, objMask] of Object.entries(mask)) {
    path = path.split(".");
    const obj = getObj(window, path);
    const nativeObj = getObj(DoubleDots.native, path);
    for (let [prop, verifyMethod] of objMask) {
      nativeObj[prop] = obj[prop];
      const monkey = patchMethod(nativeObj[prop], verifyMethod);
      Object.defineProperty(proto, p, { ...Object.getOwnPropertyDescriptor(proto, p), value: monkey });
    }
  }
})();