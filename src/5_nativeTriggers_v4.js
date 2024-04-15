(function (nativeMethods) {

  //todo should I add this to window, document, ShadowRoot.prototype, Document.prototype?
  //todo should we do this for the "Definitions" property too?? 
  //todo This might be good, it will make the code much easier to understand?
  Object.defineProperty(window, "triggers", { value: {}, configurable: false });
  Object.defineProperty(document, "triggers", { value: {}, configurable: false });

  const nativeAddEventListener = nativeMethods.EventTarget.prototype.addEventListener;
  const nativeRemoveEventListener = nativeMethods.EventTarget.prototype.removeEventListener;
  const nativeStopImmediatePropagation = nativeMethods.Event.prototype.stopImmediatePropagation;

  class NativeEventTrigger extends CustomAttr {
    upgrade() {
      Object.defineProperty(this, "__l", { value: this.run.bind(this), configurable: false });
      nativeAddEventListener.call(this.__target, this.__type, this.__l, true);
    }

    remove() {
      nativeRemoveEventListener.call(this.__target, this.__type, this.__l, true);
      super.remove();
    }

    get __type() {
      return this.trigger.split("_")[0];
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
          const localsGlobals = n.triggers?.[type];
          if (localsGlobals) {
            let t = 0;
            for (let at in localsGlobals)
              at.trigger.endsWith("p") ? ups.push(at) : downs.splice(t++, 0, at);
          }
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

  class RootNativeEventTrigger extends NativeEventTrigger {
    upgrade() {
      super.upgrade();
      if (!this.__target.triggers)
        Object.defineProperties(this.__target, "triggers", { value: {}, configurable: false });
      (this.__target.triggers[this.__type] ??= new DoubleDots.AttrWeakSet()).add(this);
    }

    remove() {
      this.__target.triggers[this.__type].delete(this);
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

  //todo we should do this in the DocumentFragment_p too? The inheritance of the DOMDefinitionMap should handle it ok.

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
    };
  })(HTMLElement.prototype, Element.prototype, Document.prototype);

  class NativeEventDefinitionMap extends DefinitionsMap {

    static #syntaxCheckNativeEvent(name) {
      const type = name.match(/^(.*?)(?:_g|_pg|_l|_pl|_t)?$/)?.[1];
      const target = nativeEventType(type);
      if (!target)
        return;
      if (target !== "element" && name !== type)
        throw DoubleDots.SyntaxError(`"${type}" is a native global event on ${target}. In DoubleDots you refer to it directly as "${type}:". To avoid confusion with the triggers for "normal" native events, "${name}:" throws a SyntaxError.`);
      return { type, target };
    }

    setDefintion(name, Class) {
      if (!NativeEventDefinitionMap.#syntaxCheckNativeEvent(name))
        return super.setDefintion(name, Class);
      throw new DoubleDots.SyntaxError(`${name}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    }

    setRule(prefix, FunClass) {
      if (!NativeEventDefinitionMap.#syntaxCheckNativeEvent(prefix))
        return super.setRule(prefix, FunClass);
      throw new DoubleDots.SyntaxError(`${name}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    }

    #builtinDefs(name) {
      const { type, target } = NativeEventDefinitionMap.#syntaxCheckNativeEvent(name);
      if (!type)
        return;
      if (target === "element") {
        const Defs = nativeEventTrigger(type);
        for (const [postFix, def] of Object.entries(Defs))
          super.setDefintion(type + postFix, def);
        return Defs[name.substring(type.length)];
      }
      // target === "window" || "document"
      const Def = globalEventTrigger(type, window[target]);
      super.setDefintion(name, Def);
      return Def;
    }

    get(name) {
      return super.get(name) || this.#builtinDefs(name);
    }
  }

  document.Definitions.trigger = new NativeEventDefinitionMap();
})(DoubleDots.nativeMethods);
