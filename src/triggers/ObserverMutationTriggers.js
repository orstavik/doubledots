(function () {

  /**
   * accepts an input of 
   *  ["type.class.class", "attr-name..", "attr-value", "attr-name2"]
   * @param {[string]} args 
   * @returns string
   */
  DoubleDots.queryToSelector = function queryToSelector(args) {
    let q = args[0];
    for (let i = 1; i <= args.length - 1; i++) {
      let at = args[i], val;
      if (i <= args.length)
        val = args[i];
      at.replaceAll("..", "\\:");
      if (val)
        at += `="${val}"`;
      q += `[${at}]`;
    }
    return q;
  };
})();

(function () {
  /**
   * AttrAttr is the only needed main base for MutationObserver.
   * With AttrAttr we can deprecate MutationObserver.
   * All other MutationObserver triggers should use AttrAttr.
   */
  class AttrAttr extends AttrCustom {
    upgrade() {
      const observer = new MutationObserver(this.run.bind(this));
      Object.defineProperty(this, "observer", { value: observer });
      this.observer.observe(this.ownerElement, this.settings);
    }

    remove() {
      this.observer.disconnect();
      super.remove();
    }

    get settings() {
      return { attributes: true, attributesOldValue: true };
    }

    run(mrs) {
      for (let mr of mrs)
        eventLoop.dispatch(mr, this); //one event per attribute changed.
    }
  }


  function TriggerRuleAttr(fullname) {
    const attributesFilter = fullname.split("_").slice(1).map(n => n.replaceAll("..", ":"));
    Object.freeze(attributesFilter);
    return class TriggerRuleAttr extends AttrTrigger {
      get settings() {
        return { attributes: true, attributesOldValue: true, attributesFilter };
      }
    };
  }
  document.Triggers.define("attr", AttrTrigger);
  document.Triggers.defineRule("attr_", AttrTriggerRule);

  class TriggerChild extends AttrAttr {
    get settings() { return { childList: true }; }
    run([mr]) { eventLoop.dispatch(mr, this); }
  }

  class TriggerChildAdd extends AttrAttr {
    get settings() { return { childList: true }; }
    run([mr]) { mr.addedNodes?.forEach(n => eventLoop.dispatch(n, this)); }
  }

  class TriggerChildRemove extends AttrAttr {
    get settings() { return { childList: true }; }
    run([mr]) { mr.removedNodes?.forEach(n => eventLoop.dispatch(n, this)); }
  }

  document.Triggers.define("child", TriggerChild);
  document.Triggers.define("addchild", TriggerChildAdd);
  document.Triggers.define("removechild", TriggerChildRemove);

  function TriggerDescRule(fullname, nodeListName = "addedNodes") {
    const q = DoubleDots.argsToSelector(fullname.split("_").slice(1));
    return class TriggerDescAdd extends AttrAttr {
      get settings() { return { childList: true, subtree: true }; }
      run([mr]) {
        for (let n in mr[nodeListName])
          if (n.match?.(q))
            eventLoop.dispatch(n, this);
      }
    };
  }

  document.Triggers.defineRule("desc_", TriggerDescRule);
  
})(DoubleDots?.nativeMethods || window);
