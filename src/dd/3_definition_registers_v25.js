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

// class AsyncDefinitionError extends DefinitionError {
//   constructor(msg, fullname, rule, RuleFun) {
//     super(msg, fullname, rule, RuleFun);
//     //side-effect in constructor!!
//     document.documentElement.dispatchEvent(new ErrorEvent(this));
//   }
// }

Object.assign(DoubleDots, {
  DefinitionError,
  TriggerNameError,
  DefinitionNameError,
  // AsyncDefinitionError
});

class DefinitionsMap {

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
    return this.#type;
  }

  #definitions = {};
  #rules = {};

  /**
   * @param {*} name 
   * @param {Promise => {HOFunction => {Promise => {Attr, Function}} } || {rule, defs }} Def
   */
  #setRule(name, Def) {
    DoubleDots.cube?.("defineRule", { type: this.#type, root: this.#root, name, Def });
    this.#rules[name] = Def.rule ?? Def;
    if (!Def.defs)
      return;
    const defs = Object.entries(Def.defs);
    for (let [fullname] of defs)
      if (!fullname.startsWith(name))
        throw new DefinitionError(`defineRule(name, {defs}) naming mismatch: !"${fullname}".startsWith("${name}")`);
    for (let [fullname, def] of defs)
      this.#setDef(fullname, def);
  }

  #setDef(name, Def) {
    DoubleDots.cube?.("define", { type: this.#type, root: this.#root, name, Def });
    return this.#definitions[name] = Def;
  }

  defineRule(prefix, FunFun) {
    DefinitionNameError.check(prefix);
    for (let r of Object.keys(this.#rules))
      if (r.startsWith(prefix) || prefix.startsWith(r))
        throw new DefinitionError(`rule/rule conflict: trying to add '${prefix}' when '${r}' exists.`);
    for (let fullname of Object.keys(this.#definitions))
      if (fullname.startsWith(prefix))
        throw new DefinitionError(`rule/name conflict: trying to add '${prefix}' when '${fullname}' exists.`);
    this.#setRule(prefix, FunFun);
    FunFun instanceof Promise && FunFun
      .then(newFunFun => this.#setRule(prefix, newFunFun))
      .catch(err => this.#setRule(prefix, err));
    //todo should we throw here inside the catch?
  }

  //Def can be either a class Attr, Function, or Promise.
  define(fullname, Def) {
    DefinitionNameError.check(fullname);
    if (fullname in this.#definitions)
      throw new DefinitionError(`name/name conflict: '${fullname}' already exists.`);
    for (let r of Object.keys(this.#rules))
      if (fullname.startsWith(r))
        throw new DefinitionError(`name/rule conflict: trying to add '${fullname}' when rule '${r}' exists.`);
    this.#setDef(fullname, Def);
    Def instanceof Promise && Def
      .then(newDef => this.#setDef(fullname, newDef))
      .catch(err => this.#setDef(fullname, err));
    //todo should we throw here inside the catch?
  }

  #checkViaRule(fullname) {
    for (let [rule, FunFun] of Object.entries(this.#rules))
      if (fullname.startsWith(rule)) {
        return FunFun instanceof Error ? FunFun :
          typeof FunFun == "function" ? FunFun(fullname) :
            (async _ => (await FunFun)(fullname))();
      }
  }

  get(fullname) {
    if (fullname in this.#definitions)
      return this.#definitions[fullname];
    const Def = this.#definitions[fullname] = this.#checkViaRule(fullname);
    if (Def instanceof Promise)
      Def.then(newDef => this.#setDef(fullname, newDef))
        .catch(err => this.#setDef(fullname, err));
    return Def;
  }
}

//No longer in use as we are shifting to declaration-before-use, always.
//Best practice is to have "static definitions" at the head of the document, for all things.
//These can be checked compile-time, by tooling.
//However, you can also dynamically define and load definitiions at run-time.
//The limitation is that the call to define them *must* come before the first call to use them.
// >> Note! The definition loaded can be async! Just make sure that you don't await before you pass the
// definition name,promise to the register(s).
class UnknownDefinitionsMap extends DefinitionsMap {
  #unknowns = {};
  #resolvers = {};

  define(fullname, Def) {
    super.define(fullname, Def);
    this.#resolvers[fullname]?.(Def);
    delete this.#unknowns[fullname];
    delete this.#resolvers[fullname];
  }

  defineRule(prefix, FunFun) {
    //todo at this time, we don't know if this is a batch or not?
    super.defineRule(prefix, FunFun);
    for (let fullname in this.#unknowns)
      if (fullname.startsWith(prefix)) {
        const Def = FunFun.defs?.[fullname] ?? (FunFun.rule ?? FunFun)(fullname);
        this.#resolvers[fullname]?.(Def);
        delete this.#unknowns[fullname];
        delete this.#resolvers[fullname];
      }
  }

  get(fullname) {
    return super.get(fullname) ?? (this.#unknowns[fullname] ??= new Promise(r => this.#resolvers[fullname] = r));
  }
}

class DefinitionsMapLock extends DefinitionsMap {  //these can never be unknown, right? because the shadowRoot can never start running upgrade inside before the defintions above are loaded?
  #lock;
  defineRule(prefix, FunFun) {
    if (this.#lock)
      throw new DefinitionError("ShadowRoot too-late definition error for rule: " + prefix);
    return super.defineRule(prefix, FunFun);
  }

  define(name, Def) {
    if (this.#lock)
      throw new DefinitionError("ShadowRoot too-late definition error for definition: " + name);
    return super.define(name, Def);
  }

  get(name, attr) {
    this.#lock = true;
    return super.get(name, attr);
  }
}

//this map inherits
class DefinitionsMapDOM extends DefinitionsMapLock {
  get parentMap() {
    return this.root.host?.getRootNode()?.[this.type];
  }

  get(name, attr) {
    return super.get(name, attr) ?? this.parentMap.get(name, attr);
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
    if (this.#rule !== undefined)
      return this.#rule;
    const rider = this.root.host.getAttribute("override-" + this.type.toLowerCase());
    return this.#rule = rider && new RegExp(`^(${rider})$`);
  }

  /**
   * @param {string} name 
   * @returns {Definition} if the name has been overridden above.
   */
  overrides(name, attr) {
    return this.#cache[name] ??= this.parentMap?.overrides?.(name, attr) || this.rule?.exec(name) && super.get(name, attr);
  }

  /**
   * First, we check if there is an override root. If there is, we redirect the query directly to that root instead.
   * Second, we try to use our own definitions, and then inherited definitions.
   * @param {string} name 
   * @returns DefinitionsMap from the document that overrides the definition name 
   */
  get(name, attr) {
    return this.overrides(name, attr) || super.get(name, attr);
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
      const map = new UnknownDefinitionsMap(this, "Reactions");
      Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
      return map;
    }
  },
  Triggers: {
    configurable: true,
    get: function () {
      const TriggerMap = TriggerSyntaxCheck(UnknownDefinitionsMap);
      const map = new TriggerMap(this, "Triggers");
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

document.Triggers.define("_", AttrEmpty);

Object.assign(DoubleDots, {
  DefinitionsMap,
  DefinitionsMapLock,
  DefinitionsMapDOM,
  DefinitionsMapDOMOverride,
  UnknownDefinitionsMap,
  // UnknownDefinition,
});
