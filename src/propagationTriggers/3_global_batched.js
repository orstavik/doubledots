(function (nativeMethods) {

  const stopProp = nativeMethods.Event.prototype.stopImmediatePropagation;

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

  class AttrListenerRoot extends AttrListenerGlobal {
    get target() {
      return this.getRootNode();
    }
  }

  class DCLTrigger extends AttrListenerRoot {
    get trigger() {
      return "DOMContentLoaded";
    }
  }

})(DoubleDots?.nativeMethods || window);

//this runs the global listeners as a batch