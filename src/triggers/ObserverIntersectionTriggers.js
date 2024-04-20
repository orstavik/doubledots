(function () {
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
      eventLoop.dispatch(mr, this);
    }
  }
  document.Triggers.define("inview", AttrIntersection);

  /**
   * This rule should only be applied when the ownerElement of the
   * custom attribute and the element being observed do not change
   * relationship.
   * 
   * If either the ownerElement or the other related element ("root")
   * is moved around, then we at best have a misleading trigger name
   * and at worst a silent state error.
   * 
   * To monitor for movements could be done using MutationObservers.
   * But, more likely, a setInterval poll would be better. But. But.
   * Do not use such a TriggerOverlapRule for dynamic elements. Use only
   * when their position in the DOM don't change towards each other.  
   * 
   * @param {string} fullname 
   * @returns class AttrIntersection 
   */
  function TriggerOverlapRule(fullname) {
    const [_, prop] = fullname.split("_");
    const q = DoubleDots.snakeToPascal(prop);
    return class SiblingOverlapTrigger extends AttrIntersection {
      get settings() {
        return { threshold: 0.5, root: this[q], rootMargin: '5px' };
      }
    };
  }

  document.Triggers.defineRule("overlap_", TriggerOverlap);

})(DoubleDots?.nativeMethods || window);
