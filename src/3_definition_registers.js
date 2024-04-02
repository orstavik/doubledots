window.DoubleDots ??= {};

DoubleDots.DoubleDotsError = class DoubleDotsError extends Error { };

DoubleDots.TriggerMap = class TriggerMap {

  #triggers = {};

  setTrigger(trigger, Class) {
    for (let tr of Object.keys(this.#triggers))
      if (tr.startsWith(trigger) || trigger.startsWith(tr))
        throw new DoubleDotsError(`${trigger}: conflicts with trigger: ${tr}:.`);
    this.#triggers[trigger]= Class;
  }

  get(fullname) {
    for (let [trigger, Class] of Object.entries(this.#triggers))
      if (fullname.startsWith(trigger))
        return Class;
  }
};

DoubleDots.ReactionsMap = class ReactionsMap {

  #reactions = {};
  #rules = {};

  setRule(rule, FunFun) {
    for (let ru of Object.keys(this.#rules))
      if (ru.startsWith(rule) || rule.startsWith(ru))
        throw new DoubleDotsError(`:${rule} conflicts with rule: :${ru}.`);
    for (let re of Object.keys(this.#reactions))
      if (re.startsWith(rule))
        throw new DoubleDotsError(`:${rule} conflicts with reaction: :${re}.`);
    this.#rules[rule] = FunFun;
  }

  setReaction(reaction, Fun) {
    if (this.#reactions.has(reaction))
      throw new DoubleDotsError(`:${reaction} already defined.`);
    for (let ru of Object.keys(this.#rules))
      if (reaction.startsWith(ru))
        throw new DoubleDotsError(`:${reaction} already defined by rule: :${ru}.`);
    this.#reactions[reaction] = Fun;
  }

  #checkViaRule(fullname) {
    for (let [rule, FunFun] of Object.entries(this.#rules))
      if (fullname.startsWith(rule)) 
        return this.#reactions[fullname] = FunFun(fullname);
  }

  get(fullname) {
    return this.#reactions[fullname] || this.#checkViaRule(fullname);
  }
};

(function () {

  function memoizeSingleArgFun(fun) {
    const cache = new WeakMap();
    return function (arg) {
      let res = cache.get(arg);
      !res && cache.set(arg, res = fun(arg));
      return res;
    };
  }

  function rootsAndHostsTopDown(root) {
    const roots = [root];
    while (root !== document)
      roots.push(root = root.host.getRootNode());
    return [roots, roots.map(r=>r.host)];
  }

  const rootsAndHosts = memoizeSingleArgFun(rootsAndHostsTopDown);
  const ReactionMaps = memoizeSingleArgFun(_ => new ReactionsMap());
  const TriggerMaps = memoizeSingleArgFun(_ => new TriggerMap());

  (function (Document_p) {
    Object.defineProperty(Proto, "defineReaction", {
      value: function (name, Fun) {
        return ReactionMaps(this).setReaction(name, Fun);
      }
    });
    Object.defineProperty(Proto, "defineReactionRule", {
      value: function (prefix, FunFun) {
        return ReactionMaps(this).setRule(prefix, FunFun);
      }
    });
    Object.defineProperty(Proto, "defineTrigger", {
      value: function (prefix, Class) {
        return TriggerMap(this).setTrigger(prefix, Class);
      }
    });
    Object.defineProperty(Document_p, "getReaction", {
      value: function (fullname) {
        return ReactionMaps(this).get(fullname);
      }
    });
    Object.defineProperty(Document_p, "getTrigger", {
      value: function (fullname, fullname) {
        return TriggerMaps(this).get(fullname);
      }
    });
  })(Document.prototype);

  (function (DocumentFragment_p) {
    const reactionLocks = new WeakSet();
    const triggerLocks = new WeakSet();
    Object.defineProperty(DocumentFragment_p, "defineReaction", {
      value: function (name, Fun) {
        if(reactionLocks.has(this))
          throw new DoubleDotsError("You cannot define a reaction in a shadowRoot until *after* a reaction has been queried from that root.");
        return ReactionMaps(this).setReaction(name, Fun);
      }
    });
    Object.defineProperty(DocumentFragment_p, "defineReactionRule", {
      value: function (prefix, FunFun) {
        if(reactionLocks.has(this))
          throw new DoubleDotsError("You cannot define a reaction rule in a shadowRoot until *after* a reaction has been queried from that root.");
        return ReactionMaps(this).setRule(prefix, FunFun);
      }
    });
    Object.defineProperty(DocumentFragment_p, "defineTrigger", {
      value: function (prefix, Class) {
        if(triggerLocks.has(this))
          throw new DoubleDotsError("You cannot define a trigger in a shadowRoot until *after* a trigger has been queried from that root.");
        return TriggerMap(this).setTrigger(prefix, Class);
      }
    });
    Object.defineProperty(DocumentFragment_p, "getReaction", {
      value: function (fullname) {
        reactionLocks.add(this);
        const [roots, hosts] = rootsAndHosts(this);
        let i = hosts.length - 2;
        for (; i >= 0; i++) {
          const host = hosts[i];
          const override = host.getAttribute("override-reaction");
          if (override && fullname.matches(override))
            break;
        }
        for (; i < roots.length; i++) {
          const root = roots[i];
          const Definition = ReactionMaps(root).get(fullname);
          if (Definition)
            return Definition;
        }
      }
    });
    Object.defineProperty(DocumentFragment_p, "getTrigger", {
      value: function (name, fullname) {
        triggerLocks.add(this);
        const [roots, hosts] = rootsAndHosts(this);
        let i = hosts.length - 2;
        for (; i >= 0; i++) {
          const host = hosts[i];
          const override = host.getAttribute("override-trigger");
          if (override && fullname.matches(override))
            break;
        }
        for (; i < roots.length; i++) {
          const root = roots[i];
          const Definition = TriggerMaps(root).get(name);
          if (Definition)
            return Definition;
        }
      }
    });
  })(DocumentFragment.prototype);
})();
