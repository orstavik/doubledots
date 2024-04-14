(function () {

  // function memoizeSingleArgFun(fun) {
  //   const cache = new WeakMap();
  //   return function (arg) {
  //     let res = cache.get(arg);
  //     !res && cache.set(arg, res = fun(arg));
  //     return res;
  //   };
  // }

  // function rootChainTopDown(root) {
  //   const roots = [root];
  //   while (root !== document)
  //     roots.unshift(root = root.host.getRootNode());
  //   return roots;
  // }

  const DefinitionError = DoubleDots.DefinitionError;


  class DefinitionsMap {

    #definitions = {};
    #rules = {};

    setRule(prefix, FunFun) {
      for (let r of Object.keys(this.#rules))
        if (r.startsWith(prefix) || prefix.startsWith(r))
          throw new DefinitionError(`rule/rule conflict: trying to add '${prefix}' when '${r}' exists.`);
      for (let fullname of Object.keys(this.#definitions))
        if (fullname.startsWith(prefix))
          throw new DefinitionError(`rule/name conflict: trying to add '${prefix}' when '${fullname}' exists.`);
      this.#rules[prefix] = FunFun;
    }

    setDefinition(fullname, Def) {
      if (this.#definitions.has(fullname))
        throw new DefinitionError(`name/name conflict: '${fullname}' already exists.`);
      for (let r of Object.keys(this.#rules))
        if (fullname.startsWith(r))
          throw new DefinitionError(`name/rule conflict: trying to add '${fullname}' when rule '${r}' exists.`);
      this.#definitions[fullname] = Def;
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

  class DomDefinitionsMap extends DefinitionsMap {
    #lock;
    #type;
    #root;
    #overrides; //entries map
    #cache = {};

    constructor(root, type) {
      this.#root = root;
      this.#type = type;
    }

    getOverrideEntries() {
      if (this.#overrides)
        return this.#overrides;
      for (let root = this.#root, override; root != document; root = root.host.getRootNode())
        if (override = root.host.getAttribute("override-" + this.#type))
          this.#overrides.unshift([override, root]);
      return this.#overrides;
    }

    setRule(rule, FunFun) {
      if (this.#lock)
        throw new DefinitionError("ShadowRoot too-late definition error.");
      super.setRule(rule, FunFun);
    }

    setDefinition(name, Def) {
      if (this.#lock)
        throw new DefinitionError("ShadowRoot too-late definition error.");
      super.setDefinition(name, Def);
    }

    #getCheckOverride(name) {
      for (let [override, root] of this.#overrides)
        if (override.matches(name))
          return root.Definitions[this.#type].get(name);
      return super.get(name);
    }

    get(name) {
      this.#lock = true;
      return this.#cache[name] ??= this.#getCheckOverride(name) || super.get(name);
    }
  }

  Object.defineProperty(Document.prototype, "Definitions", { value: {}, configurable: false });
  Object.defineProperty(DocumentFragment.prototype, "Definitions", { value: {}, configurable: false });
  Document.prototype.getDefinitions = function (type) {
    return this.Definitions[type] ??= new DefinitionsMap(this, type);
  };
  DocumentFragment.prototype.getDefinitions = function (type) {
    return this.Definitions[type] ??= new DomDefinitionsMap(this, type);
  };
  for (let Proto of [Document.prototype, DocumentFragment.prototype]) {
    for (let Type of ["Reaction", "Trigger"]) {//todo type convert to lowercase in the DefinitionsMap
      const type = Type.toLowerCase();
      Proto[`define${Type}`] = function (name, Fun) {
        return this.getDefinitions(type).setDefinition(name, Fun);
      };
      Proto[`define${Type}Rule`] = function (prefix, FunFun) {
        return this.getDefinitions(type).setRule(prefix, FunFun);
      };
      Proto[`get${Type}`] = function (name) {
        return this.getDefinitions(type).get(name);
      };
    }
  }
})();