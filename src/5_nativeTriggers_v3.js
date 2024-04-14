const getBuiltinDefs = (function (nativeMethods) {

  const nativeAddEventListener = nativeMethods.EventTarget.prototype.addEventListener;
  const nativeRemoveEventListener = nativeMethods.EventTarget.prototype.removeEventListener;
  const nativeStopImmediatePropagation = nativeMethods.Event.prototype.stopImmediatePropagation;

  const setOfSet = new Set();
  let intervalKey;
  const GC = 10_000;
  function checkLists() {
    for (let l of setOfSet) {
      for (let a of l)
        !a.isConnected && a.remove(); //Note! a.remove() *also* remove from list.
      !l.size && setOfSet.remove(l);
    }
    !setOfSet.size && clearInterval(intervalKey);
  }

  function AttrWeakSet(GC) {
    !setOfSet.size && setInterval(checkLists, GC);
    const attrs = new Set();
    setOfSet.add(attrs);
    return attrs;
  }

  const isNativeEvent = (function (HTMLElement_p, Element_, Document_p) {
    return function isNative(type) {
      const prop = "on" + type;
      if (prop in HTMLElement_p || prop in Element_ ||
        ["touchstart", "touchmove", "touchend", "touchcancel"].indexOf(type) >= 0)
        return "element";
      if (prop in window)
        return "window";
      if (prop in Document_p)
        return "document";
    };
  })(HTMLElement.prototype, Element.prototype, Document.prototype);

  /**
   * Used for native events such as:
   * 
   *   window
   *     appinstalled
   *     beforeinstallprompt
   *     afterprint
   *     beforeprint
   *     beforeunload
   *     hashchange
   *     languagechange
   *     message
   *     messageerror
   *     offline
   *     online
   *     pagehide
   *     pageshow
   *     popstate
   *     rejectionhandled
   *     storage
   *     unhandledrejection
   *     unload
   * 
   *   document
   *     DOMContentLoaded
   *     readystatechange
   *     pointerlockchange
   *     pointerlockerror
   *     freeze
   *     prerenderingchange
   *     resume
   *     visibilitychange
   * 
   * @param {string} type the native event type name
   * @param {window} target set target to document or window nodes
   * @param {number} [GC=10000] 
   * @returns class GlobalOnlyEventTrigger extends CustomAttr
   */
  function globalEventTrigger(type, target, GC = 10000) {

    class SyntaxErrorNativeEventTrigger extends CustomAttr {
      upgrade() {
        throw DoubleDots.SyntaxError(`"${type}" is a native global event on ${target}. In DoubleDots you refer to it directly as "${type}:". To avoid confusion with the triggers for "normal" native events, "${this.trigger}:" throws a SyntaxError.`);
      }
    }

    const attrs = AttrWeakSet(GC);

    function run(e) {
      if (!this.isConnected)
        return this.remove();
      e.stopImmediatePropagation();
      eventLoop.batch(e, attrs);
    }

    class GlobalOnlyEventTrigger extends CustomAttr {
      upgrade() {
        attrs.add(this);
        Object.defineProperty(this, "__l", { value: run.bind(this), configurable: false });
        nativeAddEventListener.call(target, type, this.__l, true);
      }

      remove() {
        nativeRemoveEventListener.call(target, type, this.__l, true);
        attrs.delete(this);
        super.remove();
      }
    };
    return {
      "": GlobalOnlyEventTrigger,
      "_t": SyntaxErrorNativeEventTrigger,
      "_g": SyntaxErrorNativeEventTrigger,
      "_pg": SyntaxErrorNativeEventTrigger,
      "_l": SyntaxErrorNativeEventTrigger,
      "_pl": SyntaxErrorNativeEventTrigger
    };
  }

  function processPath(type, path) {
    const d = "__" + type;
    const u = d + "_post";
    const type_t = type + "_t";

    const elems = [], downs = [], ups = [], targets = [];
    let slotLevel = 0, prev;
    for (let n of path) {
      if (n instanceof Element) {
        for (let at of n.attributes) {
          at.trigger === type && elems.push(at);
          at.trigger === type_t && targets.push(at); //todo trøbbel
        }
        prev.assignedSlot === n && slotLevel++; /*n instanceof HTMLSlotElement &&*/
      }
      else {
        d in n && downs.push(...n[d]);   //todo trøbbel
        u in n && ups.push(...n[u]);
      }
      if (prev.host === n)  /*prev instanceof ShadowRoot &&*/
        slotLevel ? slotLevel-- : targets.push(n);
      prev = n;
    }
    return [...downs, ...targets, ...elems, ...ups];
  }

  function nativeEventTrigger(type, GC = 10000) {

    function run(e) {
      if (!this.isConnected)
        return this.remove();
      nativeStopImmediatePropagation.call(e);
      eventLoop.batch(e, processPath(type, e.composedPath()));
    }

    /**
     * @param {string} type 
     * @param {window|document|ShadowRoot} node  _g => window; _l => falsy
     * @param {boolean} post true for _pg and _pl
     * @returns 
     */
    function globalLocalTrigger(type, node, post) {
      post = post ? "_post" : "";
      const listName = `__${type}${post}`;
      return class GlobalLocalNativeEventTrigger extends CustomAttr {
        upgrade() {
          Object.defineProperties(this, {
            "__l": { value: run.bind(this), configurable: false },
            "__n": { value: node || this.getRootNode(), configurable: false }
          });
          if (!(listName in this.__n))
            Object.defineProperty(this.__n, listName, { value: AttrWeakSet(GC), configurable: false });
          this.__n[listName].add(this);
          nativeAddEventListener.call(this.__n, type, this.__l, true);
        }

        remove() {
          nativeRemoveEventListener.call(this.__n, type, this.__l, true);
          this.__n[listName].delete(this);
          super.remove();
        }
      };
    }

    class NativeEventTrigger extends CustomAttr {
      upgrade() {
        Object.defineProperties(this, {
          "__l": { value: run.bind(this), configurable: false },
          "__t": { value: this.ownerElement, configurable: false }
        });
        nativeAddEventListener.call(this.__t, type, this.__l, true);
      }

      remove() {
        nativeRemoveEventListener.call(this.__t, type, this.__l, true);
        super.remove();
      }
    }

    return {
      "": NativeEventTrigger,
      "_t": NativeEventTrigger,
      "_g": globalLocalTrigger(type, window),
      "_pg": globalLocalTrigger(type, window, true),
      "_l": globalLocalTrigger(type),
      "_pl": globalLocalTrigger(type, false, true),
    };
  }

  return function getBuiltinDefs(name) {
    const type = name.match(/^(.*?)(?:_g|_pg|_l|_pl|_t)?$/)[1];
    const nType = DoubleDots.isNativeEvent(type);
    return nType === "element" ? nativeEventTrigger(type) :
      nType === "window" ? globalEventTrigger(type, window) :
        nType === "document" && globalEventTrigger(type, document);
  };

})(DoubleDots.nativeMethods);

(function () {
  //todo we should do this in the DocumentFragment_p too? The inheritance of the DOMDefinitionMap should handle it ok.

  class NativeEventDefinitionMap extends DefinitionsMap {

    static checkNativeEventOverlap(name) {
      const type = name.match(/^(.*?)(?:_g|_pg|_l|_pl|_t)?$/)?.[1];
      if (DoubleDots.isNativeEvent(type))
        throw new DoubleDots.SyntaxError(`${name}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    }

    setDefintion(name, Class) {
      NativeEventDefinitionMap.checkNativeEventOverlap(name);
      return super.setDefintion(name, Class);
    }

    setRule(prefix, FunClass) {
      NativeEventDefinitionMap.checkNativeEventOverlap(prefix);
      return super.setRule(prefix, FunClass);
    }

    #builtinDefs(name) {
      const type = name.match(/^(.*?)(?:_g|_pg|_l|_pl|_t)?$/)?.[1];
      const Defs = getBuiltinDefs(name); //todo here we can pass in only the simple type now.
      if (Defs)
        for (const [postFix, def] of Object.entries(Defs))
          super.setDefintion(type + postFix, def);
      return Defs[name];
    }

    get(name) {
      return super.get(name) || this.#builtinDefs(name);
    }
  }
})();
