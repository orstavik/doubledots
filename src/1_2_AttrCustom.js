(function () {

  class AttrCustom extends Attr {

    // Interface
    // set value(newValue) { const oldValue = super.value; super.value = newValue; ... }
    // upgrade(){ super.upgrade(); ... }
    // remove(){ ...; super.remove() }

    get trigger() {
      const [trigger, ...reactions] = this.name.split(":");
      Object.defineProperties(this, {
        "trigger": { value: trigger, enumerable: true },
        "reactions": { value: reactions, enumerable: true },
      });
      return this.trigger;
    }

    get reactions() {
      const [trigger, ...reactions] = this.name.split(":");
      Object.defineProperties(this, {
        "trigger": { value: trigger, enumerable: true },
        "reactions": { value: reactions, enumerable: true },
      });
      return this.reactions;
    }

    isConnected() {
      return this.ownerElement.isConnected();
    }

    getRootNode(...args) {
      return this.ownerElement?.getRootNode(...args);
    }

    remove() {
      return this.ownerElement.removeAttribute(this.name);
    }

    //todo remove this and only use eventLoop.dispatch(e, ...attrs);
    dispatchEvent(e) {
      if (!this.isConnected)
        throw new DoubleDots.ReactionError("dispatch on disconnected attribute.");
      eventLoop.dispatch(e, this);
    }

    static upgradeBranch(...els) {
      for (let el of els)
        for (let desc of el.querySelectorAll("*"))
          for (let at of desc.attributes)
            if (at.name.includes(":"))
              AttrCustom.upgrade(at);
      //todo we don't want to run the eventLoop until all the attr are upgraded.
    }

    static upgrade(at, Def) {
      if (!Def)
        Def = at.ownerElement.getRootNode().Triggers.get(at.name.split(":")[0]);
      if (!Def)
        Def = AttrUnknown;
      if (Def instanceof Promise) {
        Def.resolve(Def => this.upgrade(Def, at));
        Def = AttrPromise;
      }
      try {
        Object.setPrototypeOf(at, Def.prototype);
        at.upgrade?.();
      } catch (err) {
        throw new DoubleDots.TriggerUpgradeError(Def.name + ".upgrade() caused an error. Triggers shouldn't cause errors.");
      }
    }
  };
  class AttrImmutable extends AttrCustom {
    remove() { /* cannot be removed */ }
  };

  class AttrPromise extends AttrCustom { };

  class AttrUnknown extends AttrCustom {

    static #unknowns = new DoubleDots.AttrWeakSet();

    upgrade() {
      AttrUnknown.#unknowns.add(this);
    }

    upgradeUpgrade(Def) {
      AttrUnknown.#unknowns.delete(this);
      AttrCustom.upgrade(this, Def);
    }

    remove() {
      AttrUnknown.#unknowns.delete(this);
      super.remove();
    }

    static *matchesDefinition(name) {
      for (let at of AttrUnknown.#unknowns)
        if (name === at.trigger)
          yield at;
    }

    static *matchesRule(rule) {
      for (let at of AttrUnknown.#unknowns)
        if (at.trigger.startsWith(rule))
          yield at;
    }
  };

  const stopProp = Event.prototype.stopImmediatePropagation;
  const addEventListenerOG = EventTarget.prototype.addEventListener;
  const removeEventListenerOG = EventTarget.prototype.removeEventListener;

  const listenerReg = {};
  Object.defineProperty(Event, "activeListeners", {
    enumerable: true,
    value: function activeListeners(name) {
      return listenerReg[name];
    }
  });

  class AttrListener extends AttrCustom {
    upgrade() {
      Object.defineProperty(this, "__l", { value: this.run.bind(this) });
      addEventListenerOG.call(this.target, this.type, this.__l, this.options);
      listenerReg[this.type] = (listenerReg[this.type] || 0) + 1;
    }

    remove() {
      listenerReg[this.type] -= 1;
      removeEventListenerOG(this.target, this.type, this.__l, this.options);
      super.remove();
    }

    get target() {
      return this.ownerElement;
    }

    get type() {
      return this.trigger;
    }

    // get options(){ 
    //   return undefined; this is redundant to implement
    // }

    run(e) {
      // !this.isConnected && this.remove();
      eventLoop.dispatch(e, this);
    }
  }

  class AttrListenerGlobal extends AttrListener {

    // We can hide the triggers in JS space. But this makes later steps much worse.
    //
    // static #triggers = new WeakMap();
    // get register() {
    //   let dict = AttrListenerGlobal.#triggers.get(this.target);
    //   !dict && AttrListenerGlobal.#triggers.set(this.target, dict = {});
    //   return dict[this.trigger] ??= DoubleDots.AttrWeakSet();
    // }

    get register() {
      let dict = this.target.triggers;
      if (!dict)
        Object.defineProperty(this.target, "triggers", { value: dict = {} });
      return dict[this.trigger] ??= DoubleDots.AttrWeakSet();
    }

    get target() {
      return window;
    }

    upgrade() {
      super.upgrade();
      this.register.add(this);
    }

    remove() {
      this.register.delete(this);
      super.remove();
    }

    run(e) {
      // if (!this.isConnected)
      //   return this.remove();
      stopProp.call(e);
      eventLoop.dispatch(e, ...this.register);
    }
  }

  /**
 * AttrMutation is the only needed main base for MutationObserver.
 * With AttrMutation we can deprecate MutationObserver.
 * All other MutationObserver triggers should use AttrMutation.
 */
  class AttrMutation extends AttrCustom {
    upgrade() {
      const observer = new MutationObserver(this.run.bind(this));
      Object.defineProperty(this, "observer", { value: observer });
      this.observer.observe(this.target, this.settings);
    }

    remove() {
      this.observer.disconnect();
      super.remove();
    }

    get target() {
      return this.ownerElement;
    }

    get settings() {
      return { attributes: true, attributesOldValue: true };
    }

    run(mrs) {
      for (let mr of mrs)
        eventLoop.dispatch(mr, this); //one event per attribute changed.
    }
  }

  /**
   * works out of the box using:
   * 
   * documents.Triggers.define("content-box", AttrResize);
   * documents.Triggers.define("border-box", AttrResize);
   * documents.Triggers.define("device-pixel-content-box", AttrResize);
   */
  class AttrResize extends AttrCustom {
    upgrade() {
      const observer = new ResizeObserver(this.run.bind(this));
      Object.defineProperty(this, "observer", { value: observer });
      this.observer.observe(this.ownerElement, this.settings);
    }

    remove() {
      this.observer.disconnect();
      super.remove();
    }

    get settings() {
      return { box: this.trigger };
    }

    run(entries) {
      eventLoop.dispatch(entries, this);
    }
  }

  /**
   * AttrIntersection is the main base for IntersectionObserver.
   * With AttrIntersection we can deprecate IntersectionObserver.
   * All other IntersectionObserver triggers should use AttrIntersection.
   */
  class AttrIntersection extends AttrCustom {
    upgrade() {
      const observer = new IntersectionObserver(this.run.bind(this));
      Object.defineProperty(this, "observer", { value: observer });
      this.observer.observe(this.ownerElement, this.settings);
    }

    stop() {
      this.observer.disconnect();
    }

    remove() {
      this.stop();
      super.remove();
    }

    // get settings() {
    //   return { threshold: 0.0, root: null, rootMargin: '0px 0px 0px 0px' };
    // }

    run([mr]) {
      //todo add a native event listener for the DOMContentLoaded or readystatechange?
      //todo and then ensure that the inview is called on all elements that are then inview?
      //should we await sleep() on it??
      document.readyState === "complete" && eventLoop.dispatch(mr, this);
    }
  }

  Object.assign(window, {
    AttrListener,
    AttrListenerGlobal,
    AttrCustom,
    AttrImmutable,
    AttrUnknown,
    AttrPromise,
    AttrMutation,
    AttrIntersection,
    AttrResize
  });
})();