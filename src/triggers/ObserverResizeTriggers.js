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

  class AttrContainerQuery extends AttrResize {
    run() {
      const style = getComputedStyle(this.ownerElement);
      const width = parseFloat(style.width);
      const height = parseFloat(style.height);
      const cq = {
        cqw: width + "px",
        cqh: height + "px",
        // cqi: 1% of a query container's inline size,
        // cqb: 1% of a query container's block size,
        // cqmin: The smaller value of either cqi or cqb,
        // cqmax: The larger value of either cqi or cqb,
      };
      for (let [k, v] of Object.entries(cq))
        this.ownerElement.style.setProperty("--" + k, v);
    }
  }

})(DoubleDots?.nativeMethods || window);
