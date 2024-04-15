(function () {
  const DefinitionError = DoubleDots.DefinitionError;

  class DefinitionsMap {

    #definitions = {};
    #rules = {};

    constructor(root, type) { }

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

  class DOMDefinitionsMap extends DefinitionsMap {
    #lock;
    #root;
    #type;

    constructor(root, type) {
      super(root, type);
      this.#root = root;
      this.#type = type;
    }

    setRule(rule, FunFun) {
      if (this.#lock)
        throw new DefinitionError(`too late rule definition error: ${rule}`);
      super.setRule(rule, FunFun);
    }

    setDefinition(name, Def) {
      if (this.#lock)
        throw new DefinitionError(`too late definition error: ${name}`);
      super.setDefinition(name, Def);
    }

    get root() {
      return this.#root;
    }

    get type() {
      return this.#type;
    }

    get parentRoot() {
      return this.#root.host?.getRootNode().Definitions[this.#type];
    }

    get parentMap() {
      return this.parentRoot?.Definitions[this.#type];
    }

    get documentMap(){
      return document.Definitions[this.#type];
    }

    get(name) {     //todo this goes upwards.
      this.#lock = true;
      let Def = super.get(name);
      if (Def)
        return Def;
      Def = this.parentMap?.get(name);
      if (Def)
        this.setDefinition(name, Def);
      return Def;
    }
  }

  class OverridableDefinitionsMap extends DOMDefinitionsMap {
    #overrides; //entries map
    #cache = {};

    get overrides() {
      if (this.#overrides)
        return this.#overrides;
      this.#overrides = this.parentMap?.overrides || new Map();
      const override = this.root.host?.getAttribute("override-" + this.type);
      !(override in this.#overrides) && this.#overrides.set(override, this);
      return this.#overrides;
    }

    get(name) {
      let res = this.#cache[name];
      if (res)
        return res;
      //was in override map, but didn't fulfill a definition? ok, but then only the main document can provide new definition post query
      if (name in this.#cache)
        return this.documentMap.get(name);

      //if override match, we MUST use the override root.
      for (let [override, root] of this.#overrides.entries())
        if (override.matches(name))
          return this.#cache[name] = root.get(name);
      for (let root = this; root; root = root.parentMap) 
        
      return this.#cache[name] = super.get(name);
    }
  }

  Object.defineProperty(document, "Definitions", { value: {}, configurable: false });
  //this doesn't really work. We need to do this the same way we do with CustomAttr.prototype.trigger and .reactions.
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