(function () {
  class AttrWeakSet extends Set {
    static #bigSet = new Set(); //wr => AttrWeakSet
    static #key;
    static GC = 10_000;

    static gc() {
      let active, l;
      for (let wr of AttrWeakSet.#bigSet) {
        if (l = wr.ref())
          for (let a of l)
            a.isConnected ? (active = true) : (l.delete(a), a.remove());
        else
          AttrWeakSet.#bigSet.delete(wr);

      }
      !active && (AttrWeakSet.#key = clearInterval(AttrWeakSet.#key));
    }

    constructor(...args) {
      super(...args);
      AttrWeakSet.#bigSet.add(new WeakRef(this));
    }

    add(at) {
      AttrWeakSet.#key ??= setInterval(AttrWeakSet.gc, AttrWeakSet.GC);
      super.add(at);
    }
  }

  const nativeEvents = (function () {
    function extractHandlers(obj) {
      return Object.keys(obj)
        .filter(k => k.startsWith("on"))
        .map(k => k.substring(2).toLowerCase());
    }
    const eOn = extractHandlers(Element.prototype);
    const hOn = extractHandlers(HTMLElement.prototype);
    const wOn = extractHandlers(window);
    const dOn = extractHandlers(Document.prototype);

    const e = [...eOn, ...hOn].filter((a, i, ar) => ar.indexOf(a) === i);
    const w = wOn.filter(x => !e.includes(x));
    const d = dOn.filter(x => !e.includes(x) && !w.includes(x));
    //todo should I switch the difference between window and document?
    const result = { element: e, window: w, document: d };
    result.element.push("touchstart", "touchmove", "touchend", "touchcancel");
    result.document.push("DOMContentLoaded");
    Object.values(result).forEach(Object.freeze);
    Object.freeze(result);
    return result;
  })();

  function kebabToPascal(str) {
    return str.replace(/-./g, match => match[1].toUpperCase());
  }

  function pascalToKebab(str) {
    return str.replace(/[A-Z]/g, '-$0').toLowerCase();
  }

  class DoubleDotsError extends Error {
    constructor(at) {
      //todo
    }
  }
  window.DoubleDots = {
    DoubleDotsError,
    DeprecationError: class DeprecationError extends DoubleDotsError { },
    DefinitionError: class DefinitionError extends DoubleDotsError { },
    MissingReaction: class MissingReaction extends DoubleDotsError { },
    DisconnectedError: class DisconnectedError extends DoubleDotsError { },
    TriggerUpgradeError: class TriggerUpgradeError extends DoubleDotsError {
      constructor(at, error) {
        super(at);
        //todo
      }

    },
    AttrWeakSet,
    nativeEvents,
    kebabToPascal,
    pascalToKebab
  };
})();
