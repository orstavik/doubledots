(function () {
  /**
   * works out of the box iff:
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

  customAttributes.define("border-box", ResizeAttr);
  customAttributes.define("content-box", ResizeAttr);
  customAttributes.define("device-pixel-content-box", ResizeAttr);

  class TriggerCQW extends AttrResize {
    run([{ contentBoxSize: [{ inlineSize }] }]) {
      this.ownerElement.style.setProperty("--cqw", inlineSize);
      //todo run through the contentBoxSize and 
      //check how to map the contentBoxSize values to 
      //cqw, cqh, cqi, cqb, cqmin, cqmax
    }

    settings() {
      return { box: "content-box" };
    }
  }
  
  customAttributes.define("cqw", TriggerCQW);

})(DoubleDots?.nativeMethods || window);
