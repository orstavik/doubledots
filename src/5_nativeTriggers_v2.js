(function (Event, HTMLElementProto, ElementProto, DocumentProto) {
  Event.isNative = function isNative(type) {
    const prop = "on" + type;
    if (prop in HTMLElementProto || prop in ElementProto ||
      ["touchstart", "touchmove", "touchend", "touchcancel"].indexOf(type) >= 0)
      return "element";
    if (prop in window)
      return "window";
    if (prop in DocumentProto)
      return "document";
  };
})(Event, HTMLElement.prototype, Element.prototype, Document.prototype);

function AttrArray(GC) {
  const attrs = [];
  setInterval(_ => attrs.forEach(at => !at.isConnected && at.remove()), GC);
  return attrs;
}

/**
 * Used for native events such as:
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

  const attrs = AttrArray(GC);

  function run(e) {
    if (!this.isConnected)
      return this.remove();
    e.stopImmediatePropagation();
    eventLoop.batch(e, attrs);
  }

  class GlobalOnlyEventTrigger extends CustomAttr {
    upgrade() {
      attrs.push(this);
      Object.defineProperty(this, "__l", { value: run.bind(this), configurable: false });
      DoubleDots.native.addEventListener.call(target, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(target, type, this.__l, true);
      attrs.splice(attrs.indexOf(this), 1);
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
        at.trigger === type && elems.unshift(at);  //todo trøbbel
        at.trigger === type_t && targets.push(at);
      }
      prev.assignedSlot === n && slotLevel++; /*n instanceof HTMLSlotElement &&*/
    }
    else {
      d in n && downs.push(...n[d]);
      u in n && ups.unshift(...n[u]);       //todo trøbbel
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
    DoubleDots.native.stopImmediatePropagation.call(e);
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
          Object.defineProperty(this.__n, listName, { value: AttrArray(GC), configurable: false });
        this.__n[listName].push(this);
        DoubleDots.native.addEventListener.call(this.__n, type, this.__l, true);
      }

      remove() {
        DoubleDots.native.removeEventListener.call(this.__n, type, this.__l, true);
        this.__n[listName].splice(this.__n[listName].indexOf(this), 1);
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
      DoubleDots.native.addEventListener.call(this.__t, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(this.__t, type, this.__l, true);
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

function getBuiltinDefs(name) {
  const type = name.match(/^(.*?)(?:_g|_pg|_l|_pl|_t)?$/)[1];
  const nType = Event.isNative(type);
  return nType === "element" ? nativeEventTrigger(type) :
    nType === "window" ? globalEventTrigger(type, window) :
      nType === "document" && globalEventTrigger(type, document);
}

(function (Document_p) {

  const defineTriggerOG = Document_p.defineTrigger;
  const defineTriggerRuleOG = Document_p.defineTriggerRule;
  const getTriggerOG = Document_p.getTrigger;

  function checkNativeEventOverlap(name) {
    const type = name.match(/^(.*?)(?:_g|_pg|_l|_pl|_t)?$/)?.[1];
    if (Event.isNative(type))
      throw new DoubleDots.SyntaxError(`${name}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
  }

  Object.defineProperty(Proto, "defineTrigger", {
    value: function (name, Class) {
      checkNativeEventOverlap(name);
      return defineTriggerOG.call(this, name, Class);
    }
  });
  Object.defineProperty(Proto, "defineTriggerRule", {
    value: function (prefix, FunClass) {
      checkNativeEventOverlap(prefix);
      return defineTriggerRuleOG.call(this, prefix, FunClass);
    }
  });
  Object.defineProperty(Document_p, "getTrigger", {
    value: function (name) {
      const Def = getTriggerOG.call(this, name);
      if (Def)
        return Def;
      const Defs = getBuiltinDefs(name);
      if (!Defs)
        return;
      for (const [postFix, def] of Object.entries(Defs))
        defineTriggerOG.call(this, type + postFix, def);
      return getTriggerOG.call(this, name);
    }
  });
})(Document.prototype);
