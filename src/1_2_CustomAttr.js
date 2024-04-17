window.CustomAttr = class CustomAttr extends Attr {
  get trigger() {
    this.#updateTriggerReactions();
    return this.trigger;
  }

  //to catch value changes in a trigger, override the set value()
  // set value(newValue) {
  //   super.value = newValue;
  // }

  get reactions() {
    this.#updateTriggerReactions();
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

  #updateTriggerReactions() {
    const [trigger, ...reactions] = this.name.split(":");
    Object.defineProperties(this, {
      "trigger": { value: trigger, enumerable: true },
      "reactions": { value: reactions, enumerable: true },
    });
  }

  dispatchEvent(e) {
    if (!target.isConnected)
      throw new DoubleDots.ReactionError("dispatch on disconnected attribute.");
    eventLoop.addTask(this, e);
  }

  static upgradeBranch(...els) {
    for (let el of els)
      for (let desc of el.querySelectorAll("*"))
        for (let at of desc.attributes)
          if (at.name.indexOf(":") >= 0)
            CustomAttr.upgrade(at);
    //todo we don't want to run the eventLoop until all the attr are upgraded.
  }

  static upgrade(at, Def) {
    if (!Def)
      Def = at.ownerElement.getRootNode().Triggers.get(at.name.split(":")[0]);
    if (!Def)
      Def = UnknownAttr;
    if (Def instanceof Promise) {
      Def.resolve(Def => this.upgrade(Def, at));
      Def = WaitForItAttr;
    }
    try {
      Object.setPrototypeOf(at, Def.prototype);
      at.upgrade?.();
    } catch (err) {
      throw new DoubleDots.TriggerUpgradeError(Def.name + ".upgrade() caused an error. Triggers shouldn't cause errors.");
    }
  }
};

window.WaitForItAttr = class WaitForItAttr extends CustomAttr { };

window.UnknownAttr = class UnknownAttr extends CustomAttr {

  static #unknowns = new DoubleDots.AttrWeakSet();

  upgrade() {
    UnknownAttr.#unknowns.add(this);
  }

  upgradeUpgrade(Def) {
    UnknownAttr.#unknowns.delete(this);
    CustomAttr.upgrade(this, Def);
  }

  remove() {
    UnknownAttr.#unknowns.delete(this);
    super.remove();
  }

  static *matchesDefinition(name) {
    for (let at of UnknownAttr.#unknowns)
      if (name === at.trigger)
        yield at;
  }

  static *matchesRule(rule) {
    for (let at of UnknownAttr.#unknowns)
      if (at.trigger.startsWith(rule))
        yield at;
  }
};
