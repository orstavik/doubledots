(function () {

  const DefinitionError = DoubleDots.DefinitionError;

  class DefinitionsMap {

    #definitions = {};
    #rules = {};
    // #ruleRE = new RegExp(" ", "g");

    defineRule(prefix, FunFun) {
      //FunFun can be either a Function that given the prefix will produce either a class or a Function.
      //FunFun can also be a Promise.
      if (!prefix.match(/^[a-z0-9_\.-]*$/))
        throw new DefinitionError(`Definition rule prefixes can only contain /^[a-z0-9_\.-]*$/: ${prefix}`);
      for (let r of Object.keys(this.#rules))
        if (r.startsWith(prefix) || prefix.startsWith(r))
          throw new DefinitionError(`rule/rule conflict: trying to add '${prefix}' when '${r}' exists.`);
      for (let fullname of Object.keys(this.#definitions))
        if (fullname.startsWith(prefix))
          throw new DefinitionError(`rule/name conflict: trying to add '${prefix}' when '${fullname}' exists.`);
      // this.#ruleRE = new RegExp(`^(${Object.keys(this.#rules).join("|")}).*`, "g");
      this.#rules[prefix] = FunFun;
    }

    define(fullname, Def) {
      //Def can be either a class or a Function.
      //Def can also be a Promise.
      if (!fullname.match(/^[a-z0-9_\.-]*$/))
        throw new DefinitionError(`Definition names can only contain /^[a-z0-9_\.-]*$/: ${fullname}`);
      if (fullname in this.#definitions)
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
      // alternative logic using a regex to match the name. Not sure this is better
      // for (let [_, prefix] of fullname.matchAll(this.#ruleRE))
      //   return this.#definitions[fullname] = this.#rules[prefix](fullname);
    }

    get(fullname) {
      return this.#definitions[fullname] || this.#checkViaRule(fullname);
    }
  }

  class DefinitionsMapAttrUnknown extends DefinitionsMap {

    define(fullname, Def) {
      super.define(fullname, Def);
      for (let at of AttrUnknown.matchesDefinition(fullname))
        at.upgradeUpgrade(Def);
    }

    defineRule(rule, FunClass) {
      super.defineRule(rule, FunClass);
      for (let at of AttrUnknown.matchesRule(rule))
        at.upgradeUpgrade(this.get(fullname));
    }
  }

  class DefinitionsMapLock extends DefinitionsMap {
    #lock;
    defineRule(rule, FunFun) {
      if (this.#lock)
        throw new DefinitionError("ShadowRoot too-late definition error for rule: " + rule);
      return super.defineRule(rule, FunFun);
    }

    define(name, Def) {
      if (this.#lock)
        throw new DefinitionError("ShadowRoot too-late definition error for definition: " + name);
      return super.define(name, Def);
    }

    get(name) {
      this.#lock = true;
      return super.get(name);
    }
  }

  //this map inherits
  class DefinitionsMapDOM extends DefinitionsMapLock {
    #root;
    #type;
    constructor(root, type) {
      super();
      this.#root = root;
      this.#type = type;
    }

    get root() {
      return this.#root;
    }

    get type() {
      return this.#type;
    }

    get parentMap() {
      return this.root.host?.getRootNode()?.[this.type];
    }

    get(name) {
      return super.get(name) || this.parentMap.get(name);
    }
  }

  class DefinitionsMapDOMOverride extends DefinitionsMapDOM {

    #cache = {};
    #rule;

    /**
     * "name|prefix.*|another-name|prefix2_.*"
     * and is simply wrapped in ^(...) to complete the regex query.
     */
    get rule() {
      return this.#rule ??= `^(${this.root.host.getAttribute("override-" + this.type.toLowercase())})`;
    }

    /**
     * @param {string} name 
     * @returns {DefinitionsMap|false} if the name has been overridden above.
     */
    overrides(name) {
      return this.#cache[name] ??= this.parentMap?.overrides?.(name) || this.rule.matches(name) && this.parentMap;
    }

    /**
     * First, we check if there is an override root. If there is, we redirect the query directly to that root instead.
     * Second, we try to use our own definitions, and then inherited definitions.
     * @param {string} name 
     * @returns DefinitionsMap from the document that overrides the definition name 
     */
    get(name) {
      const overrider = this.overrides(name);
      return overrider ? overrider.get(name) : super.get(name);
    }
  }

  function TriggerSyntaxCheck(DefMap) {
    return class TriggerMap extends DefMap {
      defineRule(prefix, FunFun) {
        if (!prefix[0].match(/[a-z_]/))
          throw new DefinitionError(`Trigger rule prefixes must begin with /a-z_/: ${prefix} starts with '${prefix[0]}'.`);
        super.defineRule(prefix, FunFun);
      }

      define(fullname, Def) {
        if (!fullname[0].match(/[a-z_]/))
          throw new DefinitionError(`Trigger definition names must begin with /a-z_/: ${fullname} starts with '${fullname[0]}'.`);
        super.define(fullname, Def);
      }
    };
  }


  Object.defineProperties(Document.prototype, {
    Reactions: {
      get: function () {
        const map = new DefinitionsMap();
        Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
        return map;
      }
    },
    Triggers: {
      configurable: true,
      get: function () {
        const TriggerMap = TriggerSyntaxCheck(DefinitionsMapAttrUnknown);
        const map = new TriggerMap();
        Object.defineProperty(this, "Triggers", { value: map, enumerable: true });
        return map;
      }
    }
  });
  Object.defineProperties(ShadowRoot.prototype, {
    Reactions: {
      configurable: true,
      get: function () {
        const map = new DefinitionsMapDOMOverride(this, "Reactions");
        Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
        return map;
      }
    },
    Triggers: {
      configurable: true,
      get: function () {
        const TriggerMap = TriggerSyntaxCheck(DefinitionsMapDOMOverride);
        const map = new TriggerMap(this, "Triggers");
        Object.defineProperty(this, "Triggers", { value: map, enumerable: true });
        return map;
      }
    }
  });
  Object.assign(DoubleDots, {
    DefinitionsMap,
    DefinitionsMapLock,
    DefinitionsMapDOM,
    DefinitionsMapDOMOverride,
    DefinitionsMapAttrUnknown
  });
})();