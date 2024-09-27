(function () {
  class DefinitionError extends DoubleDots.DoubleDotsError {
    constructor(msg, fullname, rule, RuleFun) {
      super(msg);
      this.fullname = fullname;
      this.rule = rule;
      this.RuleFun = RuleFun;
    }
  }

  class TriggerNameError extends DefinitionError {
    constructor(fullname) {
      super(`Trigger name/prefix must begin with english letter or '_'.\n${fullname} begins with '${fullname[0]}'.`);
    }

    static check(name) {
      if (!name.match(/[a-z_].*/))
        throw new TriggerNameError(name);
    }
  }

  class DefinitionNameError extends DefinitionError {
    constructor(name) {
      super(`DoubleDots definition names and rule prefixes can only contain /^[a-z0-9_\.-]*$/: ${name}`);
    }
    static check(name) {
      if (!name.match(/^[a-z0-9_\.-]*$/))
        throw new DefinitionNameError(name);
    }
  }

  class AsyncDefinitionError extends DefinitionError {
    constructor(msg, fullname, rule, RuleFun) {
      super(msg, fullname, rule, RuleFun);
      //side-effect in constructor!!
      document.documentElement.dispatchEvent(new ErrorEvent(this));
    }
  }

  Object.assign(DoubleDots, {
    DefinitionError,
    TriggerNameError,
    DefinitionNameError,
    AsyncDefinitionError
  });

  class DefinitionsMap {

    #definitions = {};
    #rules = {};
    // #ruleRE = new RegExp(" ", "g");

    defineRule(prefix, FunFun) {
      //FunFun can be either a Function that given the prefix will produce either a class or a Function.
      //FunFun can also be a Promise.
      DefinitionNameError.check(prefix);
      for (let r of Object.keys(this.#rules))
        if (r.startsWith(prefix) || prefix.startsWith(r))
          throw new DefinitionError(`rule/rule conflict: trying to add '${prefix}' when '${r}' exists.`);
      for (let fullname of Object.keys(this.#definitions))
        if (fullname.startsWith(prefix))
          throw new DefinitionError(`rule/name conflict: trying to add '${prefix}' when '${fullname}' exists.`);
      // this.#ruleRE = new RegExp(`^(${Object.keys(this.#rules).join("|")}).*`, "g");
      this.#rules[prefix] = FunFun;
      FunFun instanceof Promise && FunFun
        .then(newFunFun => this.#rules[prefix] = newFunFun)
        .catch(err => this.#rules[prefix] = new AsyncDefinitionError(err, null, prefix));
    }

    define(fullname, Def) {
      //Def can be either a class or a Function.
      //Def can also be a Promise.
      DefinitionNameError.check(fullname);
      if (fullname in this.#definitions)
        throw new DefinitionError(`name/name conflict: '${fullname}' already exists.`);
      for (let r of Object.keys(this.#rules))
        if (fullname.startsWith(r))
          throw new DefinitionError(`name/rule conflict: trying to add '${fullname}' when rule '${r}' exists.`);
      this.#definitions[fullname] = Def;
      Def instanceof Promise && Def
        .then(newDef => this.#definitions[fullname] = newDef)
        .catch(err => this.#definitions[fullname] = new AsyncDefinitionError(err, fullname));
    }

    #processRule(fullname, rule, FunFun) {
      if (FunFun instanceof Promise)
        return this.#definitions[fullname] = FunFun
          .then(newFunFun => (FunFun = newFunFun)(fullname))
          .catch(err => new AsyncDefinitionError(err, null, rule, null))
          .then(newDef => this.#definitions[fullname] = newDef)
          .catch(err => this.#definitions[fullname] = new AsyncDefinitionError(err, fullname, rule, FunFun));

      try {
        if (FunFun instanceof Error)
          throw FunFun;
        const Def = this.#definitions[fullname] = FunFun(fullname);
        Def instanceof Promise && Def
          .then(newDef => this.#definitions[fullname] = newDef)
          .catch(err => this.#definitions[fullname] = new AsyncDefinitionError(err, fullname, rule, FunFun));
        return Def;
      } catch (err) {
        return this.#definitions[fullname] = new DefinitionError(err, fullname, rule, FunFun);
      }
    }

    #checkViaRule(fullname) {
      // alternative logic using a regex to match the name. Not sure this is better
      // for (let [_, prefix] of fullname.matchAll(this.#ruleRE))
      //   return this.#definitions[fullname] = this.#rules[prefix](fullname);
      for (let [rule, FunFun] of Object.entries(this.#rules))
        if (fullname.startsWith(rule))
          return this.#processRule(fullname, rule, FunFun);
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
        TriggerNameError.check(prefix);
        super.defineRule(prefix, FunFun);
      }

      define(fullname, Def) {
        TriggerNameError.check(fullname);
        super.define(fullname, Def);
      }
    };
  }

  function ReactionThisInArrowCheck(DefMap) { //todo add this to Reaction maps?
    return class ReactionMapNoThisInArrow extends DefMap {
      define(fullname, Def) {
        DoubleDots.ThisArrowFunctionError.check(Def);
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

  /**
   * ## `DoubleDots.Reference` rules.
   * 
   * 1. the resource inside the module file is identified by the value||name.
   * 2. Names starting with upCase imply Triggers `/[^a-zA-Z]*[A-Z]/`
   *    Names starting with lowCase imply Reactions `/[^a-zA-Z]*[A-Z]/`
   * 3. Names ending with `/[a-zA-Z]/` are regular definitions.
   *    Names ending with non-letters such as `/_-\./` are rules.
   * 4. The refName is a snake-case of the CamelCaseName.
   *    The first letter (in trigger references) are not `-`prefixed.
   */
  class Reference {
    constructor(url, name, value) {
      this.url = url;
      this.name = name;
      this.fullname = DoubleDots.pascalToKebab(DoubleDots.pascalToCamel(name));
      this.value = value || "";
      this.type = /^_*[A-Z]/.test(name) ? "Triggers" : "Reactions";
      this.rule = /[\._-]$/.test(name) ? "defineRule" : "define";
    }

    async getDefinition() {
      const module = await import(this.url);
      if (!module || typeof module !== "object" && !(module instanceof Object))
        return new AsyncDefinitionError(`URL is not an es6 module: ${this.url}`);
      const lookup = this.value || this.name;
      return module[lookup] ??
        module.default?.[lookup] ??
        new AsyncDefinitionError(`ES6 module doesn't contain resource: ${lookup}`);
    }

    static *parse(url) {
      const hashSearch = (url.hash || url.search).slice(1);
      if (!hashSearch)
        throw DoubleDots.SyntaxError("DoubleDots.Reference not in url: " + url);
      const refs = hashSearch.entries?.() ?? hashSearch.split("&").map(s => s.split("="));
      for (let [name, value] of refs)
        yield new Reference(url, name, value);
    }
  }

  async function define(url, root) {
    for (let ref of Reference.parse(url))
      root[ref.type][ref.rule](ref.fullname, ref.getDefinition());
  };

  Object.assign(DoubleDots, {
    DefinitionsMap,
    DefinitionsMapLock,
    DefinitionsMapDOM,
    DefinitionsMapDOMOverride,
    DefinitionsMapAttrUnknown,
    Reference,
    define,
  });
})();