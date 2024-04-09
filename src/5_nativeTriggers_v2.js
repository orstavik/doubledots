class WeakRefSet extends Set {

  add(at) {
    super.add(new WeakRef(at));
    return this;
  }

  delete(at) {
    for (let ref of super.values())
      if (ref.deref() === at)
        return super.delete(ref);
  }

  * iterate() {
    for (let ref of this) {
      const at = ref.deref();
      at?.isConnected ? yield at : super.delete(ref);
    }
  }
}

function makeNativeTriggerClasses(type, winDoc, globalsOnly) {

  class NativeEventSyntaxErrorTrigger extends CustomAttr {
    upgrade(name) {
      throw `${name} is only a document or window event, and so cannot be listened for on the element itself.`;
    }
  }

  const global = new WeakRefSet();
  const global_p = new WeakRefSet();
  const locals = new WeakMap();
  const locals_p = new WeakMap();

  function propagateAll(e) {
    const path = e.composedPath();
    const roots = path.filter(n => n instanceof ShadowRoot);
    const elements = path.filter(n => n instanceof Element);
    const hosts = path.filter(_=>false)//todo make a function that finds the host nodes in the shadowRoot (that are not slotting host nodes.)
    const rootsDown = roots.filter(r => locals.get(r)?.length);
    rootsDown.reverse();
    const rootsUp = roots.filter(r => locals_p.get(r)?.length);
    const targets = hosts.map(el => el.attributes.filter(at => at.trigger === type + "_t")).flatten();
    //should targets go top-down? capture style?
    const bubbles = elements.map(el => el.attributes.filter(at => at.trigger === type)).flatten();
    const attrs = [...global, ...rootsDown, ...targets, ...bubbles, ...rootsUp, ...global_p];
    eventLoop.dispatchEvent(e, ...attrs);
  }

  function propagateGlobals(e) {
    eventLoop.dispatchEvent(e, ...global, ...global_p);
  }

  const propagate = globalsOnly ? propagateGlobals : propagateAll;

  function runTriggers(e) {
    if (!this.isConnected)
      return this.remove();
    DoubleDots.native.stopImmediatePropagation.call(e);
    propagate(e);
  }


  class NativeEventTrigger extends CustomAttr {

    upgrade() {
      this.__l = runTriggers.bind(this);
      DoubleDots.native.addEventListener.call(this.ownerElement, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(this.ownerElement, type, this.__l, true);
      super.remove();
    }
  }

  class GlobalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      global.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      global.delete(this);
      super.remove();
    }
  }

  class PostGlobalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      global_p.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      global_p.delete(this);
      super.remove();
    }
  }

  class LocalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      let reg = locals.get(this.getRootNode());
      if (!reg)
        locals.set(this.getRootNode(), reg = new WeakRefSet());
      reg.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      locals.get(this.getRootNode()).delete(this);
      super.remove();
    }
  }

  class PostLocalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      let reg = locals_p.get(this.getRootNode());
      if (!reg)
        locals_p.set(this.getRootNode(), reg = new WeakRefSet());
      reg.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      locals_p.get(this.getRootNode()).delete(this);
      super.remove();
    }
  }

  if (globalsOnly)
    NativeEventTrigger = LocalTrigger = PostLocalTrigger = NativeEventSyntaxErrorTrigger;

  return { NativeEventTrigger, GlobalTrigger, PostGlobalTrigger, LocalTrigger, PostLocalTrigger };
}

(function (Event, HTMLElementProto, ElementProto, DocumentProto) {
  Event.isNative = function isNative(type) {
    const prop = "on" + type;
    if (prop in HTMLElementProto || prop in ElementProto ||
      ["touchstart", "touchmove", "touchend", "touchcancel"].indexOf(type) >= 0)
      return "Element";
    if (prop in window)
      return "window";
    if (prop in DocumentProto)
      return "document";
  };
})(Event, HTMLElement.prototype, Element.prototype, Document.prototype);


(function (Document_p) {

  const defineTriggerOG = Document_p.defineTrigger;
  const defineTriggerRuleOG = Document_p.defineTriggerRule;
  const getTriggerOG = Document_p.getTrigger;

  function checkNativeEventOverlap(name) {
    for (let post of ["", "_g", "_pg", "_l", "_pl"])
      if (Event.isNative(name + post))
        throw new DoubleDotsSyntaxError(name + post + ": is a native event trigger, it is builtin, you cannot define it.");
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
      const old = getTriggerOG.call(this, name);
      if (old)
        return old;
      let [_, type, mode, type2] = name.match(/^(.*)_(g|pg|l|pl)$|(.*)/);
      type ??= type2;
      const eventClass = Event.isNative(type);
      if (!eventClass)
        return;
      const winDoc = eventClass === "window" ? window : document;
      const globalsOnly = eventClass !== "Element";
      let {
        NativeEventTrigger,
        GlobalTrigger,
        PostGlobalTrigger,
        LocalTrigger,
        PostLocalTrigger
      } = makeNativeTriggerClasses(type, winDoc, globalsOnly);

      defineTriggerOG.call(this, type, NativeEventTrigger);
      defineTriggerOG.call(this, type + "_g", GlobalTrigger);
      defineTriggerOG.call(this, type + "_l", LocalTrigger);
      defineTriggerOG.call(this, type + "_pg", PostGlobalTrigger);
      defineTriggerOG.call(this, type + "_pl", PostLocalTrigger);

      return !mode ? NativeEventTrigger :
        mode === "g" ? GlobalTrigger :
          mode === "l" ? LocalTrigger :
            mode === "pg" ? PostGlobalTrigger :
              mode === "pl" ? PostLocalTrigger :
                undefined;
    }
  });
})(Document.prototype);
