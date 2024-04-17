(function (nativeMethods) {

  const nativeAddEventListener = nativeMethods.EventTarget.prototype.addEventListener;
  const nativeRemoveEventListener = nativeMethods.EventTarget.prototype.removeEventListener;
  const nativeStopImmediatePropagation = nativeMethods.Event.prototype.stopImmediatePropagation;

  class NativeEventTrigger extends CustomAttr {
    upgrade() {
      Object.defineProperty(this, "__l", { value: this.run.bind(this) });
      nativeAddEventListener.call(this.__target, this.__type, this.__l, true);
    }

    remove() {
      nativeRemoveEventListener.call(this.__target, this.__type, this.__l, true);
      super.remove();
    }

    get __type() {
      return this.trigger;
    }

    get __target() {
      return this.ownerElement;
    }

    run(e) {
      if (!this.isConnected)
        return this.remove();
      nativeStopImmediatePropagation.call(e);
      this.propagate(e);
    }

    static fixNonComposedPaths(path) {
      const res = [path[0]];
      let inSlot = 0;
      for (let i = 1; i < path.length; i++) {
        const prev = path[i - 1], node = path[i];
        node === prev.assignedSlot && inSlot++;
        node === prev.host && inSlot--;
        !inSlot && res.push(node);
      }
      return res;
    }

    static getAttributes(type, path) {
      const type_t = type + "_t";
      const elems = [], downs = [], ups = [], targets = [];
      let slotLevel = 0, prev;
      for (let n of path) {
        if (n instanceof Element) {
          for (let at of n.attributes)
            at.trigger === type && elems.push(at);
          if (prev?.assignedSlot === n) /*n instanceof HTMLSlotElement &&*/
            slotLevel++;
          if (prev?.host === n)  /*prev instanceof ShadowRoot &&*/
            if (slotLevel)
              slotLevel--;
            else {
              let t = 0;
              for (let at of n.attributes)
                at.trigger === type_t && targets.splice(t++, 0, at);
            }
        }
        else {
          const _g = n.triggers?.[type + "_g"];
          const _gp = n.triggers?.[type + "_gp"];
          _g && ups.push(..._g);
          _gp && downs.unshift(..._gp);
        }
        prev = n;
      }
      return [...downs, ...targets, ...elems, ...ups];
    }

    propagate(e) {
      let path = e.composedPath();
      !e.composed && (path = NativeEventTrigger.fixNonComposedPaths(path));
      eventLoop.batch(e, NativeEventTrigger.getAttributes(this.__type, path));
    }
  }

  class TargetNativeEventTrigger extends NativeEventTrigger {
    get __type() {
      return this.trigger.split("_")[0];
    }
  }

  class RootNativeEventTrigger extends NativeEventTrigger {
    upgrade() {
      super.upgrade();
      this.__triggerList.add(this);
    }

    get __triggerList() {
      if (!this.__target.triggers)
        Object.defineProperties(this.__target, "triggers", { value: {}, enumerable: true });
      return this.__target.triggers[this.trigger] ??= new DoubleDots.AttrWeakSet();
    }

    remove() {
      this.__triggerList.delete(this);
      super.remove();
    }

    get __target() {
      return this.getRootNode();
    }
  }

  class WindowNativeEventTrigger extends RootNativeEventTrigger {
    get __target() {
      return window;
    }
  }

  /**
   * window
   *   appinstalled
   *   beforeinstallprompt
   *   afterprint
   *   beforeprint
   *   beforeunload
   *   hashchange
   *   languagechange
   *   message
   *   messageerror
   *   offline
   *   online
   *   pagehide
   *   pageshow
   *   popstate
   *   rejectionhandled
   *   storage
   *   unhandledrejection
   *   unload
   */
  class OnlyWindowNativeEventTrigger extends WindowNativeEventTrigger {
    get __target() {
      return window;
    }

    get __type() {
      return this.trigger;
    }

    propagate(e) {
      eventLoop.batch(e, this.__target.triggers[this.__type]);
    }
  }

  /**
   * document
   *   readystatechange
   *   pointerlockchange
   *   pointerlockerror
   *   freeze
   *   prerenderingchange
   *   resume
   *   visibilitychange
   */
  class OnlyDocumentNativeEventTrigger extends OnlyWindowNativeEventTrigger {
    get __target() {
      return document;
    }
  }

  /**
   * document
   *   DOMContentLoaded
   */
  class DCLNativeEventTrigger extends OnlyDocumentNativeEventTrigger {
    get __type() {
      return "DOMContentLoaded";
    }
  }

  //todo we should do this in the ShadowRoot_p too? The inheritance of the DOMDefinitionMap should handle it ok.

  const nativeEventType = (function (HTMLElement_p, Element_, Document_p) {
    return function nativeEventType(type) {
      const prop = "on" + type;
      if (prop in HTMLElement_p || prop in Element_ ||
        ["touchstart", "touchmove", "touchend", "touchcancel"].indexOf(type) >= 0)
        return "element";
      if (prop in window)
        return "window";
      if (prop in Document_p)
        return "document";
      if (type === "domcontentloaded")
        return "domcontentloaded";
    };
  })(HTMLElement.prototype, Element.prototype, Document.prototype);

  class NativeEventDefinitionMap extends DoubleDots.DefinitionsMapUnknownAttr {

    static #syntaxCheckNativeEvent(name) {
      const [_, type, postfix] = name.match(/^(.*?)(_g|_pg|_l|_pl|_t)?$/);
      const target = nativeEventType(type);
      if (!target)
        return;
      if (target !== "element" && name !== type)
        throw DoubleDots.SyntaxError(`"${type}" is a native global event on ${target}. In DoubleDots you refer to it directly as "${type}:". To avoid confusion with the triggers for "normal" native events, "${name}:" throws a SyntaxError.`);
      return { type, target, postfix };
    }

    setDefintion(name, Class) {
      if (!NativeEventDefinitionMap.#syntaxCheckNativeEvent(name))
        return super.setDefintion(name, Class);
      throw new DoubleDots.SyntaxError(`${name}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    }

    setRule(prefix, FunClass) {
      if (!NativeEventDefinitionMap.#syntaxCheckNativeEvent(prefix))
        return super.setRule(prefix, FunClass);
      throw new DoubleDots.SyntaxError(`${prefix}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    }

    #builtinDefs(name) {
      const native = NativeEventDefinitionMap.#syntaxCheckNativeEvent(name);
      if (!native)
        return;
      const { type, target, postfix } = native;
      const Def =
        target === "element" && postfix === "_g" || postfix === "_gp" ? WindowNativeEventTrigger :
          target === "element" && postfix === "_l" || postfix === "_lp" ? RootNativeEventTrigger :
            target === "element" && postfix === "_t" ? TargetNativeEventTrigger :
              target === "element" && name === type ? NativeEventTrigger :
                target === "window" ? OnlyWindowNativeEventTrigger :
                  target === "document" ? OnlyDocumentNativeEventTrigger :
                    target === "domcontentloaded" ? DCLNativeEventTrigger :
                      null;
      super.setDefintion(name, Def);
      return Def;
    }

    get(name) {
      return super.get(name) || this.#builtinDefs(name);
    }
  }

  Object.defineProperty(Document.prototype, "Triggers", {
    configurable: true,
    get: function () {
      const map = new NativeEventDefinitionMap();
      Object.defineProperty(this, "Triggers", { value: map, enumerable: true });
      return map;
    }
  });
})(DoubleDots.nativeMethods);
