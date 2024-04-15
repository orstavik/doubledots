(function () {

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
  }

  class LockedDefinitionsMap extends DefinitionsMap {
    #lock;
    setRule(rule, FunFun) {
      if (this.#lock)
        throw new DefinitionError("ShadowRoot too-late definition error for rule: " + rule);
      return super.setRule(rule, FunFun);
    }

    setDefinition(name, Def) {
      if (this.#lock)
        throw new DefinitionError("ShadowRoot too-late definition error for definition: " + name);
      return super.setDefinition(name, Def);
    }

    get(name) {
      this.#lock = true;
      return super.get(name);
    }
  }

  //this map inherits
  class DOMDefinitionsMap extends LockedDefinitionsMap {
    #root;
    #type;
    constructor(root, type) {
      this.#root = root;
      this.#type = type;
    }

    get root() {
      return this.#root;
    }

    get type() {

    }

    get parentMap() {
      return this.root.host?.getRootNode()?.Definitions[this.type];
    }

    get(name) {
      return super.get(name) || this.parentMap.get(name);
    }
  }

  class OverrideDOMDefinitionsMap extends DOMDefinitionsMap {

    #nameToRoot = {};
    #rule;

    /**
     * "name|prefix.*|another-name|prefix2_.*"
     * and is simply wrapped in ^(...) to complete the regex query.
     */
    get rule() {
      return this.#rule ??= `^(${this.root.host.getAttribute("override-" + this.type)})`;
    }

    overrides(name) {
      return this.#nameToRoot[name] ??= this.parentMap?.overrides?.(name) || this.rule.matches(name) && this.parentMap;
    }

    get(name) {
      return this.overrides(name)?.get(name) || super.get(name);
    }
  }

  class DomDefinitionsMap extends LockedDefinitionsMap {
    #type;
    #root;
    #map;
    #overridden = {};

    constructor(root, type) {
      this.#root = root;
      this.#type = type;
    }

    setRule(rule, FunFun) {
      //1. first time only
      if (!(rule in this.#overridden))
        this.#overridden[rule] = this.#getOverrider(rule);
      //2. subsequent requests
      this.#overridden[rule] || super.setRule(rule, FunFun);
    }

    setDefinition(name, Def) {
      const overrider = this.#getOverrider(rule);
      return overrider ?
        !(this.#overridden[rule] = overrider) :
        super.setDefinition(name, Def);
    }

    static makeOverrideMap(r, type) {
      const topDownHosts = [];
      for (let host = r.host; host; host = host.getRootNode()?.host)     //todo check isConnected??
        topDownHosts.unshift(host);
      const res = new Map();
      for (let host of topDownHosts)
        res.set(host.getAttribute("override-" + type), host.getRootNode().Definitions[type]);
      return res;
    }

    get map() {
      return this.#map ??= DomDefinitionsMap.makeOverrideMap(this.#root, this.#type);
    }

    #getOverrider(name) {
      for (let [override, map] of this.map)
        if (override.matches(name))
          return map;
    }

    get(name) {
      const overrider = this.#ownerMaps[name] ??= this.#getOverrider(name) || this;
      if (overrider !== this) {

      }
      return this.#ownerMaps[name] ??= this.#getCheckOverride(name) || super.get(name);
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