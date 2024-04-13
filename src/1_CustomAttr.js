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
};
