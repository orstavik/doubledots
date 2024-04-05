window.CustomAttr = class CustomAttr extends Attr {
  get trigger() {
    this.#updateTriggerReactions();
    return this.trigger;
  }

  get reactions(){
    this.#updateTriggerReactions();
    return this.reactions;
  }

  isConnected(){
    return this.ownerElement.isConnected();
  }
  
  remove() {
    return this.ownerElement.removeAttribute(this.name);
  }

  #updateTriggerReactions(){
    const [trigger, ...reactions] = this.name.split(":");
    Object.defineProperties(this, {
      "trigger": {value: trigger, enumerable: true, configurable: false},
      "reactions": {value: reactions, enumerable: true, configurable: false},
    });
  }
}