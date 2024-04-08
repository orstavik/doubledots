window.DoubleDots ??= {};

DoubleDots.DoubleDotsError = class DoubleDotsError extends Error { };

DoubleDots.DefinitionsMap = class DefinitionsMap {

  #definitions = {};
  #rules = {};

  setRule(rule, FunFun) {
    for (let ru of Object.keys(this.#rules))
      if (ru.startsWith(rule) || rule.startsWith(ru))
        throw new DoubleDotsError(`:${rule} conflicts with rule: :${ru}.`);
    for (let re of Object.keys(this.#definitions))
      if (re.startsWith(rule))
        throw new DoubleDotsError(`:${rule} conflicts with reaction: :${re}.`);
    this.#rules[rule] = FunFun;
  }

  setDefinition(reaction, Fun) {
    if (this.#definitions.has(reaction))
      throw new DoubleDotsError(`:${reaction} already defined.`);
    for (let ru of Object.keys(this.#rules))
      if (reaction.startsWith(ru))
        throw new DoubleDotsError(`:${reaction} already defined by rule: :${ru}.`);
    this.#definitions[reaction] = Fun;
  }

  #checkViaRule(fullname) {
    for (let [rule, FunFun] of Object.entries(this.#rules))
      if (fullname.startsWith(rule))
        return this.#definitions[fullname] = FunFun(fullname);//todo what if FunFun throws an error here?
  }

  get(fullname) {
    return this.#definitions[fullname] || this.#checkViaRule(fullname);
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
    return [roots, roots.map(r => r.host)];
  }

  const rootsAndHosts = memoizeSingleArgFun(rootsAndHostsTopDown);
  const ReactionMaps = memoizeSingleArgFun(_ => new DefinitionsMap());
  const TriggerMaps = memoizeSingleArgFun(_ => new DefinitionsMap());

  (function (Document_p) {
    Object.defineProperty(Proto, "defineReaction", {
      value: function (name, Fun) {
        return ReactionMaps(this).setDefinition(name, Fun);
      }
    });
    Object.defineProperty(Proto, "defineReactionRule", {
      value: function (prefix, FunFun) {
        return ReactionMaps(this).setRule(prefix, FunFun);
      }
    });
    Object.defineProperty(Proto, "defineTrigger", {
      value: function (name, Class) {
        return TriggerMaps(this).setDefinition(name, Class);
      }
    });
    Object.defineProperty(Proto, "defineTriggerRule", {
      value: function (prefix, FunClass) {
        return TriggerMaps(this).setRule(prefix, FunClass);
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
        if (reactionLocks.has(this))
          throw new DoubleDotsError("You cannot define a reaction in a shadowRoot *after* a reaction has been queried from that root.");
        return ReactionMaps(this).setDefinition(name, Fun);
      }
    });
    Object.defineProperty(DocumentFragment_p, "defineReactionRule", {
      value: function (prefix, FunFun) {
        if (reactionLocks.has(this))
          throw new DoubleDotsError("You cannot define a reaction rule in a shadowRoot *after* a reaction has been queried from that root.");
        return ReactionMaps(this).setRule(prefix, FunFun);
      }
    });
    Object.defineProperty(DocumentFragment_p, "defineTrigger", {
      value: function (name, Class) {
        if (triggerLocks.has(this))
          throw new DoubleDotsError("You cannot define a trigger in a shadowRoot *after* a trigger has been queried from that root.");
        return TriggerMaps(this).setDefinition(name, Class);
      }
    });
    Object.defineProperty(DocumentFragment_p, "defineTriggerRule", {
      value: function (prefix, FunClass) {
        if (triggerLocks.has(this))
          throw new DoubleDotsError("You cannot define a trigger rule in a shadowRoot *after* a trigger has been queried from that root.");
        return TriggerMaps(this).setRule(prefix, FunClass);
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
