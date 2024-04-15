window.CustomAttr = class CustomAttr extends Attr {
  get trigger() {
    this.#updateTriggerReactions();
    return this.trigger;
  }

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
      "trigger": { value: trigger, enumerable: true, configurable: false },
      "reactions": { value: reactions, enumerable: true, configurable: false },
    });
  }

  dispatchEvent(e) {
    if (!target.isConnected)
      throw new DoubleDots.ReactionError("dispatch on disconnected attribute.");
    eventLoop.addTask(this, e);
  }

  static upgrade(Def, at) {
//todo
  }
};

window.UnknownAttr = class UnknownAttr extends CustomAttr {

  static #unknowns = new DoubleDots.AttrWeakSet();

  upgrade() {
    UnknownAttr.#unknowns.add(this);
  }

  upgradeUpgrade(Def){
    UnknownAttr.#unknowns.delete(this);
    CustomAttr.upgrade(Def, this);
  }

  remove() {
    UnknownAttr.#unknowns.delete(this);
    super.remove();
  }

  static *matchesDefinition(name, root) {
    for (let r = root; r; r = r.host.getRootNode())
      for (let at of UnknownAttr.#unknowns)
        if (name === at.trigger) 
          yield at;
  }

  static *matchesRule(rule, root) {
    for (let r = root; r; r = r.host.getRootNode())
      for (let at of UnknownAttr.#unknowns)
        if (at.trigger.startsWith(rule))
          yield at;
  }
};
