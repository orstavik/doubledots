(function () {

  const DefinitionError = DoubleDots.DefinitionError;

  class DefinitionsMap {

    #definitions = {};
    #rules = {};

    setRule(rule, FunFun) {
      for (let ru of Object.keys(this.#rules))
        if (ru.startsWith(rule) || rule.startsWith(ru))
          throw new DefinitionError(`rule :${rule} conflicts with rule: :${ru}.`);
      for (let re of Object.keys(this.#definitions))
        if (re.startsWith(rule))
          throw new DefinitionError(`rule :${rule} conflicts with reaction: :${re}.`);
      this.#rules[rule] = FunFun;
    }

    setDefinition(reaction, Fun) {
      if (this.#definitions.has(reaction))
        throw new DefinitionError(`reaction :${reaction} already defined.`);
      for (let ru of Object.keys(this.#rules))
        if (reaction.startsWith(ru))
          throw new DefinitionError(`reaction :${reaction} already defined by rule: :${ru}.`);
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


  (function (Document_p, DocumentFragment_p) {

    const Definitions = {
      Reaction: memoizeSingleArgFun(_ => new DefinitionsMap()),
      Trigger: memoizeSingleArgFun(_ => new DefinitionsMap()),
    };
    const locks = { Reaction: new WeakSet(), Trigger: new WeakSet() };

    const Proto = Document.prototype;
    for (let Tr of ["Reaction", "Trigger"]) {
      const getDefinitions = Definitions[Tr];
      Proto[`define${Tr}`] = function (name, Fun) {
        return getDefinitions(this).setDefinition(name, Fun);
      };
      Proto[`define${Tr}Rule`] = function (prefix, FunFun) {
        return getDefinitions(this).setRule(prefix, FunFun);
      };
      Proto[`get${Tr}`] = function (name) {
        return getDefinitions(this).get(name);
      };
    }

    const Proto = DocumentFragment.prototype;
    for (let Tr of ["Reaction", "Trigger"]) {
      const getDefinitions = Definitions[Tr];
      Proto[`define${Tr}`] = function (name, Fun) {
        if (locks[Tr].has(this))
          throw new DefinitionError("ShadowRoot too-late definition error.");
        return getDefinitions(this).setDefinition(name, Fun);
      };
      Proto[`define${Tr}Rule`] = function (prefix, FunFun) {
        if (locks[Tr].has(this))
          throw new DefinitionError("ShadowRoot too-late definition error.");
        return getDefinitions(this).setRule(prefix, FunFun);
      };
      //todo this function should be memoized outside..
      Proto[`get${Tr}`] = function (name) {
        locks[Tr].add(this);
        const [roots, hosts] = rootsAndHosts(this);
        let i;
        for (i = hosts.length - 2; i >= 0; i++)
          if (hosts[i].getAttribute("override-" + Tr)?.matches(override))
            break;
        let Definition;
        for (; i < roots.length; i++)
          if (Definition = Definitions[Tr](roots[i]).get(name))
            return Definition;
      };
    }

})();
