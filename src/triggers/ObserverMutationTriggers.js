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

  function TriggerRuleAttr(fullname) {
    const attributesFilter = fullname.split("_").slice(1).map(n => n.replaceAll("..", ":"));
    Object.freeze(attributesFilter);
    return class TriggerRuleAttr extends AttrMutation {
      get settings() {
        return { attributes: true, attributesOldValue: true, attributesFilter };
      }
    };
  }
  document.Triggers.define("attr", AttrMutation);
  document.Triggers.defineRule("attr_", TriggerRuleAttr);
  
  function TriggerRuleParentAttr(fullname) {
    const attributesFilter = fullname.split("_").slice(1).map(n => n.replaceAll("..", ":"));
    Object.freeze(attributesFilter);
    return class TriggerRuleAttr extends AttrMutation {
      get settings() {
        return { attributes: true, attributesOldValue: true, attributesFilter };
      }
      get target(){
        return this.ownerElement.parentNode;
      }
    };
  }
  document.Triggers.defineRule("p-attr_", TriggerRuleParentAttr);

  class TriggerChild extends AttrMutation {
    get settings() { return { childList: true }; }
    run([mr]) { eventLoop.dispatch(mr, this); }
  }

  class TriggerChildAdd extends AttrMutation {
    get settings() { return { childList: true }; }
    run([mr]) { mr.addedNodes?.forEach(n => eventLoop.dispatch(n, this)); }
  }

  class TriggerChildRemove extends AttrMutation {
    get settings() { return { childList: true }; }
    run([mr]) { mr.removedNodes?.forEach(n => eventLoop.dispatch(n, this)); }
  }

  document.Triggers.define("child", TriggerChild);
  document.Triggers.define("addchild", TriggerChildAdd);
  document.Triggers.define("removechild", TriggerChildRemove);

  function TriggerDescRule(fullname, nodeListName = "addedNodes") {
    const q = DoubleDots.argsToSelector(fullname.split("_").slice(1));
    return class TriggerDescAdd extends AttrMutation {
      get settings() { return { childList: true, subtree: true }; }
      run([mr]) {
        for (let n in mr[nodeListName])
          if (n.match?.(q))
            eventLoop.dispatch(n, this);
      }
    };
  }

  document.Triggers.defineRule("desc_", TriggerDescRule);

  class TriggerSiblingAdd extends AttrMutation {
    get target() { return this.ownerElement.parentNode; }
    run([mr]) { mr.addedNodes?.forEach(n => eventLoop.dispatch(n, this)); }
  }

  document.Triggers.define("new-sibling", TriggerSiblingAdd);

})(DoubleDots?.nativeMethods || window);
