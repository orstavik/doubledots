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

  class AttrListener extends AttrCustom {
    static #knownEvents = new Set();

    static isEvent(name) {
      return this.#knownEvents.has(name);
    }

    upgrade() {
      Object.defineProperty(this, "__l", this.run.bind(this));
      AttrListener.#knownEvents.add(this.type);
      addEventListenerOG.call(this.target, this.type, this.__l, this.options);
    }

    remove() {
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
      !this.isConnected && this.remove();
      this.dispatchEvent(e);
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
      if (!this.isConnected)
        return this.remove();
      stopProp.call(e);
      eventLoop.dispatch(e, ...this.register);
    }
  }

  Object.assign(window, {
    AttrListener,
    AttrListenerGlobal,
    AttrCustom,
    AttrImmutable, 
    AttrUnknown,
    AttrPromise, 
  });
})();