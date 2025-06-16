const OG = {};

function monkeyPatch(path, valueOrSet, get) {
  const dots = path.split(".");
  const prop = dots.pop();
  const proto = dots.reduce((o, p) => o[p], window);
  let desc = Object.getOwnPropertyDescriptor(proto, prop);
  if (!desc)
    for (let p = Object.getPrototypeOf(proto); p; p = Object.getPrototypeOf(p))
      if (desc = Object.getOwnPropertyDescriptor(p, prop))
        break;
  const key = desc.value ? "value" : "set";
  OG[path] ??= desc[key];
  desc[key] = valueOrSet;
  get && key === "set" && (desc.get = get);
  Object.defineProperty(proto, prop, desc);
}

function nativeMethods(path) {
  return OG[path] ?? path.split(".").reduce((o, p) => o[p], window);
}

const dce = document.createElement;
const ael = EventTarget.prototype.addEventListener;
const si = setInterval;
const st = setTimeout;

async function sleep(ms) {
  return await new Promise(r => st(r, ms));
}

function nextTick(cb) {
  const a = dce.call(document, "audio");
  ael.call(a, "ratechange", cb);
  a.playbackRate = 2;
}

class AttrWeakSet extends Set {
  static #bigSet = new Set(); //wr => AttrWeakSet
  static #key;
  static GC = 10_000;

  static gc() {                               //todo we can no longer rely on isConnected to determine activity..
    let active, l;                            //todo we should also have an iterator here i think. the current iterator doesn't deref?
    for (let wr of AttrWeakSet.#bigSet) {
      if (l = wr.deref())
        for (let a of l)
          a.isConnected ? (active = true) : (l.delete(a), a.remove());
      else
        AttrWeakSet.#bigSet.delete(wr);

    }
    !active && (AttrWeakSet.#key = clearInterval(AttrWeakSet.#key));
  }

  constructor(...args) {
    super(...args);
    AttrWeakSet.#bigSet.add(new WeakRef(this));
  }

  add(at) {
    AttrWeakSet.#key ??= si(AttrWeakSet.gc, AttrWeakSet.GC);
    super.add(at);
  }
}

const nativeEvents = (function () {
  function extractHandlers(obj) {
    return Object.keys(obj)
      .filter(k => k.startsWith("on"))
      .map(k => k.substring(2).toLowerCase());
  }
  const eOn = extractHandlers(Element.prototype);
  const hOn = extractHandlers(HTMLElement.prototype);
  const wOn = extractHandlers(window);
  const dOn = extractHandlers(Document.prototype);

  const e = [...eOn, ...hOn].filter((a, i, ar) => ar.indexOf(a) === i);
  const w = wOn.filter(x => !e.includes(x));
  const d = dOn.filter(x => !e.includes(x) && !w.includes(x));
  //todo should I switch the difference between window and document?
  const result = { element: e, window: w, document: d };
  result.element.push("touchstart", "touchmove", "touchend", "touchcancel");
  result.document.push("DOMContentLoaded");
  Object.values(result).forEach(Object.freeze);
  Object.freeze(result);
  return result;
})();

function kebabToPascal(str) {
  return str.replace(/-[a-z]/g, c => c[1].toUpperCase());
}

function pascalToKebab(str) {
  return str.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
}

/**
* This method is just as bad as eval. But, 
* if you use this during development, and 
* then switch to a static Reaction Trigger in production,
* then you will be fine.
* 
* @param {string} The body of the function to be created from the string.
* @returns Function 
*/
async function importBasedEval(codeString) {
  codeString = "export default " + codeString.trim();
  const blob = new Blob([codeString], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const module = await import(url);
  URL.revokeObjectURL(url);
  return module.default;
}

/**
 * todo this concept is now being replaced by more use of portals? a better structure?
 * miniQuerySelector
 * 
 * Converts miniQuerySelector given in super limited DoubleDots notation
 * into a valid css querySelector.
 * 
 * For example: 
 *     my-element.foo.bar_attr-hello.._sunshine_active
 * =>  my-element.foo.bar[attr-hello\:$="sunshine"][active]
 * 
 * @param {string} doubledot: 
 * @returns {string} querySelector
 */
function miniQuerySelector(doubledot) {
  let [q, ...attrs] = doubledot.split("_");
  for (let i = 0; i <= attrs.length - 1; i += 2) {
    const name = attrs[i].replaceAll("..", "\\:");
    const val = i <= attrs.length ? `$="${attrs[i + 1]}"` : "";
    q += `[${name}${val}]`;
  }
  return q;
};

function* up(el, q = "*") {
  for (let p = el.parentElement; p; p = p.parentElement)
    if (q === "*" || p.matches(q))
      yield p;
}
function* left(el, q = "*") {
  for (let s = el.previousElementSibling; s; s = s.previousElementSibling)
    if (q === "*" || s.matches(q))
      yield s;
}
function* right(el, q = "*") {
  for (let s = el.nextElementSibling; s; s = s.nextElementSibling)
    if (q === "*" || s.matches(q))
      yield s;
}
function* roots(el) {
  for (let r = el.getRootNode(); r; r = r.host?.getRootNode())
    yield r;
}
function* hosts(el, q = "*") {
  for (let h = el.getRootNode().host; h; h = h.getRootNode().host)
    if (q === "*" || h.matches(q))
      yield h;
}
function* downwide(el, q = "*") {
  for (let d, queue = [...el.children]; d = queue.shift(); queue.push(...el.children))
    if (q === "*" || d.matches(q))
      yield d;
}

class DoubleDotsError extends Error {
  constructor(msg, at) {
    super(msg);
    //todo handle at
  }
}

class ThisArrowFunctionError extends DoubleDotsError {
  constructor(Func) {
    super("arrow function with `this`.");
  }
  static check(Definition) {
    // if(Definition.hasOwnProperty('prototype'))  //better alternative than a
    //   return false;
    let txt = Definition.toString();
    if (!/^(async\s+|)(\(|[^([]+=)/.test(txt))  //alternative a
      return;
    txt = txt.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, ''); //remove comments
    //ATT!! `${"`"}this` only works when "" is removed before ``
    txt = txt.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '');   //remove "'-strings
    txt = txt.replace(/(`)(?:(?=(\\?))\2.)*?\1/g, '');   //remove `strings
    if (/\bthis\b/.test(txt))                      //the word this
      throw new ThisArrowFunctionError(Definition);
  }
}

function* walkAttributes(root) {
  if (root.attributes)
    yield* Array.from(root.attributes);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  for (let n; n = walker.nextNode();) {
    yield* Array.from(n.attributes);
    if (n.shadowRoot)
      yield* walkAttributes(n.shadowRoot);
  }
}

window.DoubleDots = {
  nativeMethods,
  monkeyPatch,

  DoubleDotsError,
  ThisArrowFunctionError,
  DeprecationError: class DeprecationError extends DoubleDotsError { },
  MissingReaction: class MissingReaction extends DoubleDotsError { },
  DisconnectedError: class DisconnectedError extends DoubleDotsError { },
  TriggerUpgradeError: class TriggerUpgradeError extends DoubleDotsError {
    constructor(at, error) {
      super(at);
      //todo
    }

  },
  AttrWeakSet,
  walkAttributes,
  nextTick,
  sleep,
  nativeEvents,
  kebabToPascal,
  pascalToKebab,
  up, left, right, roots, hosts, downwide,
  importBasedEval,
  miniQuerySelector
};

// Attr.prototype.remove()
(function () {
  const writable = true, configurable = true, enumerable = true;

  const removeAttribute_OG = Element.prototype.removeAttribute;
  function Attr_remove() { removeAttribute_OG.call(this.ownerElement, this.name); }
  Object.defineProperty(Attr.prototype, "remove", { value: Attr_remove, writable, configurable, enumerable });

  function removeAttribute_DD(name) { return this.getAttributeNode(name)?.remove(); }
  Object.defineProperty(Element.prototype, "removeAttribute", { value: removeAttribute_DD, writable, configurable, enumerable });

  function removeAttributeNode_DD(at) { return at?.remove(), at; }
  Object.defineProperty(Element.prototype, "removeAttributeNode", { value: removeAttributeNode_DD, writable, configurable, enumerable });
})();

let AttrCustom$1 = class AttrCustom extends Attr {

  // Interface
  // set value(newValue) { const oldValue = super.value; super.value = newValue; ... }
  // upgrade(){ super.upgrade(); ... }
  // remove(){ ...; super.remove() }

  static #makeRT(at) {
    let [trigger, ...reactions] = at.name.split(":");
    reactions.length === 1 && !reactions[0] && reactions.pop();
    Object.defineProperties(at, {
      "trigger": { value: trigger, enumerable: true },
      "reactions": { value: Object.freeze(reactions), enumerable: true },
    });
  }

  toJSON() {
    const { id, trigger, reactions, value, initDocument } = this;
    return { id, trigger, reactions, value, initDocument };
  }

  get trigger() {
    return AttrCustom.#makeRT(this), this.trigger;
  }

  get reactions() {
    return AttrCustom.#makeRT(this), this.reactions;
  }

  isConnected() {
    return this.ownerElement?.isConnected();
  }

  getRootNode(...args) {
    return this.ownerElement?.getRootNode(...args);
  }

  //todo remove this and only use eventLoop.dispatchBatch(e, attrs);
  dispatchEvent(e) {
    if (!this.isConnected)
      throw new DoubleDots.ReactionError("dispatch on disconnected attribute.");
    eventLoop.dispatch(e, this);
  }

  static upgradeBranch(...els) {
    for (let el of els) 
      for (const at of DoubleDots.walkAttributes(el))
        AttrCustom.upgrade(at);
  }

  static #ids = 0;
  static errorMap = new Map();
  static upgrade(at, Def) {
    //the single place to catch trigger errors.
    //when triggers error, we add the error in the dom, so that it is trace
    try {
      Def ??= at.ownerElement.getRootNode().Triggers?.get(at.name.split(":")[0], at);
      if (Def instanceof Promise) {
        Object.setPrototypeOf(at, AttrUnknown.prototype);
        Def.then(Def => AttrCustom.upgrade(at, Def))
          .catch(err => { AttrCustom.errorMap.set(at, err); throw err; });
        return;
      }
      Object.setPrototypeOf(at, Def.prototype);
      Object.defineProperties(at, {
        "id": { value: this.#ids++, enumerable: true },
        "initDocument": { value: at.getRootNode(), enumerable: true }
      });
      DoubleDots.cube?.("attr", at);
      at.upgrade?.();
      at.value && (at.value = at.value);
    } catch (err) {
      AttrCustom.errorMap.set(at, err);
      throw err;
    }
  }
};
class AttrImmutable extends AttrCustom$1 {
  remove() { /* cannot be removed */ }
  //set value() { /* cannot be changed */ }
  //get value() { return super.value; }
}

class AttrUnknown extends AttrCustom$1 { }

const stopProp = Event.prototype.stopImmediatePropagation;
const addEventListenerOG = EventTarget.prototype.addEventListener;
const removeEventListenerOG = EventTarget.prototype.removeEventListener;

const listenerReg = {};
Object.defineProperty(Event, "activeListeners", {
  enumerable: true,
  value: function activeListeners(name) {
    return listenerReg[name];
  }
});

class AttrListener extends AttrCustom$1 {
  upgrade() {
    Object.defineProperty(this, "__l", { value: this.run.bind(this) });
    addEventListenerOG.call(this.target, this.type, this.__l, this.options);
    listenerReg[this.type] = (listenerReg[this.type] || 0) + 1;
  }

  remove() {
    listenerReg[this.type] -= 1;
    removeEventListenerOG.call(this.target, this.type, this.__l, this.options);
    super.remove();
  }

  get target() {
    return this.ownerElement;
  }

  get type() {
    return this.trigger;
  }

  // get options(){ 
  //   return undefined; this is redundant to implement
  // }

  run(e) {
    // !this.isConnected && this.remove();
    eventLoop.dispatch(e, this);
  }
}

class AttrListenerGlobal extends AttrListener {

  // We can hide the triggers in JS space. But this makes later steps much worse.
  //
  // static #triggers = new WeakMap();
  // get register() {
  //   let dict = AttrListenerGlobal.#triggers.get(this.target);
  //   !dict && AttrListenerGlobal.#triggers.set(this.target, dict = {});
  //   return dict[this.trigger] ??= DoubleDots.AttrWeakSet();
  // }

  get register() {
    let dict = this.target.triggers;
    if (!dict)
      Object.defineProperty(this.target, "triggers", { value: dict = {} });
    return dict[this.trigger] ??= new DoubleDots.AttrWeakSet();
  }

  get target() {
    return window;
  }

  upgrade() {
    super.upgrade();
    this.register.add(this);
  }

  remove() {
    this.register.delete(this);
    super.remove();
  }

  run(e) {
    // if (!this.isConnected)
    //   return this.remove();
    stopProp.call(e);
    // eventLoop.dispatch(e, ...this.register);
    eventLoop.dispatchBatch(e, this.register);
  }
}

let AttrEmpty$1 = class AttrEmpty extends AttrCustom$1 {
  upgrade() { eventLoop.dispatch(new Event(this.trigger), this); }
};;

/**
 * AttrMutation is the only needed main base for MutationObserver.
 * With AttrMutation we can deprecate MutationObserver.
 * All other MutationObserver triggers should use AttrMutation.
 */
class AttrMutation extends AttrCustom$1 {
  upgrade() {
    const observer = new MutationObserver(this.run.bind(this));
    Object.defineProperty(this, "observer", { value: observer });
    this.observer.observe(this.target, this.settings);
  }

  remove() {
    this.observer.disconnect();
    super.remove();
  }

  get target() {
    return this.ownerElement;
  }

  get settings() {
    return { attributes: true, attributesOldValue: true };
  }

  run(mrs) {
    for (let mr of mrs)
      eventLoop.dispatch(mr, this); //one event per attribute changed.
  }
}

/**
 * works out of the box using:
 * 
 * documents.Triggers.define("content-box", AttrResize);
 * documents.Triggers.define("border-box", AttrResize);
 * documents.Triggers.define("device-pixel-content-box", AttrResize);
 */
class AttrResize extends AttrCustom$1 {
  upgrade() {
    const observer = new ResizeObserver(this.run.bind(this));
    Object.defineProperty(this, "observer", { value: observer });
    this.observer.observe(this.ownerElement, this.settings);
  }

  remove() {
    this.observer.disconnect();
    super.remove();
  }

  get settings() {
    return { box: this.trigger };
  }

  run(entries) {
    eventLoop.dispatch(entries, this);
  }
}

/**
 * AttrIntersection is the main base for IntersectionObserver.
 * With AttrIntersection we can deprecate IntersectionObserver.
 * All other IntersectionObserver triggers should use AttrIntersection.
 */
class AttrIntersection extends AttrCustom$1 {
  upgrade() {
    const observer = new IntersectionObserver(this.run.bind(this));
    Object.defineProperty(this, "observer", { value: observer });
    this.observer.observe(this.ownerElement, this.settings);
  }

  stop() {
    this.observer.disconnect();
  }

  remove() {
    this.stop();
    super.remove();
  }

  // get settings() {
  //   return { threshold: 0.0, root: null, rootMargin: '0px 0px 0px 0px' };
  // }

  run([mr]) {
    //todo add a native event listener for the DOMContentLoaded or readystatechange?
    //todo and then ensure that the inview is called on all elements that are then inview?
    //should we await sleep() on it??
    document.readyState === "complete" && eventLoop.dispatch(mr, this);
  }
}

Object.assign(window, {
  AttrCustom: AttrCustom$1,
  AttrListener,
  AttrListenerGlobal,
  AttrImmutable,
  AttrUnknown,
  AttrEmpty: AttrEmpty$1,
  AttrMutation,
  AttrIntersection,
  AttrResize
});

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
    // this.#ruleRE = new RegExp(`^(${Object.keys(this.#rules).join("|")}).*`, "g");
    this.#setRule(prefix, FunFun);
    FunFun instanceof Promise && FunFun
      .then(newFunFun => this.#setRule(prefix, newFunFun))
      .catch(err => this.#setRule(prefix, new AsyncDefinitionError(err, null, prefix)));
  }

  define(fullname, Def) {
    //Def can be either a class Attr, Function, or Promise.
    DefinitionNameError.check(fullname);
    if (fullname in this.#definitions)
      throw new DefinitionError(`name/name conflict: '${fullname}' already exists.`);
    for (let r of Object.keys(this.#rules))
      if (fullname.startsWith(r))
        throw new DefinitionError(`name/rule conflict: trying to add '${fullname}' when rule '${r}' exists.`);
    this.#setDef(fullname, Def);
    Def instanceof Promise && Def
      .then(newDef => this.#setDef(fullname, newDef))
      .catch(err => this.#setDef(fullname, new AsyncDefinitionError(err, fullname)));
  }

  #processRule(fullname, rule, FunFun) {
    if (FunFun instanceof Promise)
      return this.#definitions[fullname] = FunFun
        .then(newFunFun => (FunFun = newFunFun)(fullname))
        .catch(err => new AsyncDefinitionError(err, null, rule, null))
        .then(newDef => this.#setDef(fullname, newDef))
        .catch(err => this.#setDef(fullname, new AsyncDefinitionError(err, fullname, rule, FunFun)));

    try {
      if (FunFun instanceof Error)
        throw FunFun;
      const Def = this.#setDef(fullname, FunFun(fullname));
      Def instanceof Promise && Def
        .then(newDef => this.#setDef(fullname, newDef))
        .catch(err => this.#setDef(fullname, new AsyncDefinitionError(err, fullname, rule, FunFun)));
      return Def;
    } catch (err) {
      throw this.#setDef(fullname, new DefinitionError(err, fullname, rule, FunFun));
    }
  }

  #checkViaRule(fullname) {
    for (let [rule, FunFun] of Object.entries(this.#rules))
      if (fullname.startsWith(rule))
        return this.#processRule(fullname, rule, FunFun);
  }

  get(fullname) {
    return this.#definitions[fullname] || this.#checkViaRule(fullname);
  }
}

//No longer in use as we are shifting to declaration-before-use, always.
//Best practice is to have "static definitions" at the head of the document, for all things.
//These can be checked compile-time, by tooling.
//However, you can also dynamically define and load definitiions at run-time.
//The limitation is that the call to define them *must* come before the first call to use them.
// >> Note! The definition loaded can be async! Just make sure that you don't await before you pass the
// definition name,promise to the register(s).
// class UnknownDefinitionsMap extends DefinitionsMap {
//   #unknowns = {};
//   #resolvers = {};
//
//   define(fullname, Def) {
//     super.define(fullname, Def);
//     this.#resolvers[fullname]?.(Def);
//     delete this.#unknowns[fullname];
//     delete this.#resolvers[fullname];
//   }
//
//   defineRule(prefix, FunFun) {
//     //todo at this time, we don't know if this is a batch or not?
//     super.defineRule(prefix, FunFun);
//     for (let fullname in this.#unknowns)
//       if (fullname.startsWith(prefix)) {
//         const Def = FunFun.defs?.[fullname] ?? (FunFun.rule??FunFun)(fullname);
//         this.#resolvers[fullname]?.(Def);
//         delete this.#unknowns[fullname];
//         delete this.#resolvers[fullname];
//       }
//   }
//
//   get(fullname) {
//     return super.get(fullname) ?? (this.#unknowns[fullname] ??= new Promise(r => this.#resolvers[fullname] = r));
//   }
// }

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
      const map = new DefinitionsMap(this, "Reactions");
      Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
      return map;
    }
  },
  Triggers: {
    configurable: true,
    get: function () {
      const TriggerMap = TriggerSyntaxCheck(DefinitionsMap);
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
  // UnknownDefinitionsMap,
  // UnknownDefinition,
});

Event.data = Symbol("Event data");
class EventLoopError extends DoubleDots.DoubleDotsError { }

class MicroFrame {
  #i = 0;
  #inputs;

  constructor(event, at) {
    this.at = at;
    this.event = event;
    this.#inputs = [event[Event.data] ?? event];
  }

  toJSON() {
    return { at: this.at, event: this.event, inputs: this.#inputs, i: this.#i };
  }

  isConnected() {
    return this.at.isConnected();
  }

  getReaction() {
    return this.at.reactions[this.#i];
  }

  getReactionIndex() {
    return this.#i;
  }

  /**
   * @returns <undefined> when the task is emptied, or is awaiting in async mode, 
   * which both means that the event loop can continue.
   * @returns <this> current task when the task is not emptied 
   * and we must wait for it in sync mode.
   */
  run(threadMode = false) {
    for (let re = this.getReaction(); re !== undefined; re = this.getReaction()) {
      //1. process native reactions
      if (re === "") {
        threadMode = true;
        this.#runSuccess(this.#inputs[0]);
        continue;
      }
      //todo this one
      if (re.startsWith("catch"))
        continue;

      //2. check isConnected
      try {
        if (!this.at.isConnected)
          throw new EventLoopError("Disconnected: " + this.at);
        //todo should this be an error??

        const func = this.at.initDocument.Reactions.get(re, this.at);
        if (func instanceof Promise) {
          if (threadMode) {
            func.then(_ => __eventLoop.asyncContinue(this))
              .catch(error => this.#runError(error));
            return; //continue outside loop
          } else if (func instanceof DoubleDots.UnknownDefinition) {
            return this.#runError(new EventLoopError("Reaction not defined: " + re));
            //RulePromise, DefinitionPromise
          } else {
            func.then(_ => __eventLoop.syncContinue());
            //todo these sync delays needs to have a max timeout.
            //todo thus, we need to have some max timers
            return this; //halt outside loop
          }
        }
        const res = func.apply(this.at, this.#inputs);
        this.#inputs.unshift(res);
        if (res instanceof Promise) {
          if (threadMode) {
            res.then(oi => this.#runSuccess(oi))
              .catch(error => this.#runError(error))
              .finally(_ => __eventLoop.asyncContinue(this));
            return; //continue outside loop
          } else {
            res.then(oi => this.#runSuccess(oi))
              .catch(error => this.#runError(error))
              .finally(_ => __eventLoop.syncContinue());
            //todo these sync delays needs to have a max timeout.
            //todo thus, we need to have some max timers
            return this; //halt outside loop
          }
        }
        this.#runSuccess(res);
      } catch (error) {
        this.#runError(error);
      } finally {
        //todo update the loop and res here,
      }
      //todo or here?
    }
  }

  #runError(error) {
    console.error(error);
    this.#inputs[0] = error;
    const catchKebab = "catch_" + error.constructor.name.replace(/[A-Z]/g, '-$&').toLowerCase();
    for (this.#i++; this.#i < this.at.reactions.length; this.#i++)
      if (this.at.reactions[this.#i] === "catch" || this.at.reactions[this.#i] === catchKebab)
        return;

    // this.#i = this.at.reactions.length;
    const target = this.at.isConnected ? this.at.ownerElement : document.documentElement;
    //todo add the at + reactionIndex + self + input to the ErrorEvent, so that we know which attribute caused the error
    //todo or just the at, and then just read the data from the _eventLoop?
    target.dispatchEvent(new ErrorEvent("error", { error }));
  }

  #runSuccess(res) {
    this.#inputs[0] = res;
    this.#i = res === EventLoop.Break ? this.at.reactions.length : this.#i + 1;
  }
}

class __EventLoop {
  #stack = [];
  #syncTask;
  task;

  //todo clean the continue process. but do so after testing framework is up and running
  syncContinue() {
    this.task = this.#syncTask;
    DoubleDots.cube?.("task-sync", this.task);
    this.#syncTask = this.task.run();
    this.#loop();
  }

  //asyncContinue is allowed while we are waiting for the sync task
  asyncContinue(task) {
    DoubleDots.cube?.("task-async", task);
    (this.task = task).run(true);
    this.#loop();
  }

  #loop() {
    while (!this.#syncTask && this.#stack[0]) {
      const { event, iterator } = this.#stack[0];
      for (let attr of iterator) {
        this.task = new MicroFrame(event, attr);
        //if task.run() not emptied, abort to halt eventloop
        if (this.#syncTask = this.task.run())
          return DoubleDots.cube?.("task-sync-break", this.#syncTask);
        DoubleDots.cube?.("task", this.task);
      }
      this.#stack.shift();
    }
    return DoubleDots.cube?.("task-empty", {});
  }

  batch(event, iterable) {
    const iterator = iterable[Symbol.iterator]();
    if (this.#stack.push({ event, iterator }) === 1)
      this.#loop();
    else
      DoubleDots.cube?.("task-queued", {});
  }
}

globalThis.__eventLoop = new __EventLoop();

//external interface
class EventLoop {

  static Break = {};

  static SpreadReaction = function (fun) {
    return function SpreadReaction(oi) {
      return oi instanceof Iterable ?
        fun.call(this, ...oi) :
        fun.call(this, oi);
      // if (oi instanceof Iterable)
      //   return fun.call(this, ...oi);
      // throw new DoubleDotsSpreadReactionError("SpreadReactions must be passed a spreadable oi argument");
    };
  };

  //todo freeze the SpreadReaction, Break.
  get event() { return __eventLoop.task?.event; }
  get attribute() { return __eventLoop.task?.at; }
  get reaction() { return __eventLoop.task?.getReaction(); }
  get reactionIndex() { return __eventLoop.task?.getReactionIndex() ?? -1; }

  dispatch(event, attr) {
    __eventLoop.batch(event, [attr]);
  }

  //todo rename to propagate
  dispatchBatch(event, iterable) {
    __eventLoop.batch(event, iterable);
  }
};
Object.defineProperty(window, "eventLoop", { value: new EventLoop() });
DoubleDots.EventLoopError = EventLoopError;
window.EventLoop = EventLoop;

//shim requestIdleCallback
(function () {
  window.requestIdleCallback ??= function (cb, { timeout = Infinity } = {}) {
    const callTime = performance.now();
    return setTimeout(_ => {
      const start = performance.now();
      cb({
        didTimeout: (performance.now() - callTime) >= timeout,
        timeRemaining: () => Math.max(0, 50 - (performance.now() - start))
      });
    }, 16);
  };
  window.cancelIdleCallback ??= clearTimeout;
})();

//gc of downgraded elements
const dGrade = (function () {

  function idleCallback(options = {}) {
    return new Promise(r => { requestIdleCallback(deadline => r(deadline), options); });
  }

  function removeAttr(el) {
    for (const at of DoubleDots.walkAttributes(el)) {
      try {
        at.remove?.();
      } catch (e) {
        console.warn(`Error during garbagecollection: ${Object.getPrototypeOf(n.attributes[0]).name}.remove()`, e);
      }
    }
  }

  const dGrade = new Set();

  (async function () {
    while (true) {
      const deadline = await idleCallback();
      const ns = Array.from(dGrade);
      for (let i = 0; i < ns.length && (dGrade.size > 99 || deadline.timeRemaining() > 33); i++)
        removeAttr(ns[i]), dGrade.delete(ns[i]);
      await new Promise(r => setTimeout(r, 3000 / (dGrade.size + 1))); // i:100 => 30ms  /  i:1 => 3000ms
    }
  })();
  return dGrade;
})();

function upgradeBranch(...els) {
  for (let el of els)
    for (const at of DoubleDots.walkAttributes(el))
      AttrCustom.upgrade(at);
}

(function () {

  const Deprecations = [
    "hasAttributeNS",
    "getAttributeNS",
    "setAttributeNS",
    "removeAttributeNS",
    "getAttributeNodeNS",
    "setAttributeNodeNS",
    "setAttributeNode",
    "removeAttributeNode",
  ];

  for (const prop of Deprecations) {
    const og = Object.getOwnPropertyDescriptor(Element.prototype, prop);
    const desc = Object.assign({}, og, {
      value: function () {
        throw new Error(`Element.prototype.${prop} is deprecated in DoubleDots strict. setAttribute(name,str)/getAttribute(name) instead.`);
      }
    });
    Object.defineProperty(Element.prototype, prop, desc);
  }

  function setAttribute_DD(og, name, value) {
    if (name.startsWith("override-"))
      throw new SyntaxError("You can only set [override-xyz] attributes on elements in HTML template: " + name);
    const at = this.getAttributeNode(name);
    if (at) {
      at.value !== value && (at.value = value);
      return;
    }
    const res = og.call(this, name, value);
    this.isConnected && AttrCustom.upgrade(this.getAttributeNode(name));
    return res;
  }

  function upgradeables(parent, ...args) {
    if (dGrade.has(parent.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot get new objects. Is pointless.");

    const res = [];
    if (!parent.isConnected) {
      for (const a of args) {
        if (a.isConnected)
          throw new Error("Downgraded objects cannot be reinjected. Here, you are taking an upgraded object and trying to add it in a notYetUpgraded element branch.");
        if (dGrade.has(a.getRootNode({ composed: true })))
          throw new Error("Downgraded objects cannot be reinjected.");
      }
      return res;
    }
    const ctx = parent.getRootNode();
    for (const a of args) {
      if (a.isConnected) {
        if (a.getRootNode() !== ctx)
          throw new Error("Adoption is illegal in DD.");

      } else {
        if (dGrade.has(a.getRootNode({ composed: true })))
          throw new Error("Downgraded objects cannot be reinjected.");
        res.push(a);
      }
    }
    return res;
  }

  function insertArgs(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    const toBeUpgraded = upgradeables(this, ...args);
    const res = og.call(this, ...args);
    upgradeBranch(...toBeUpgraded);
    return res;
  }
  function insertArgs0(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    const toBeUpgraded = upgradeables(this, args[0]);
    const res = og.call(this, ...args);
    upgradeBranch(...toBeUpgraded);
    return res;
  }
  function insertArgs1(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    const toBeUpgraded = upgradeables(this, args[1]);
    const res = og.call(this, ...args);
    upgradeBranch(...toBeUpgraded);
    return res;
  }
  function removesArgs0(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const n = args[0];
    const res = og.call(this, ...args);
    n instanceof Element && !n.isConnected && dGrade.add(n);
    return res;
  }
  function removesArgs1(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const n = args[1];
    const res = og.call(this, ...args);
    n instanceof Element && !n.isConnected && dGrade.add(n);
    return res;
  }
  function range_surroundContent(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    const toBeUpgraded = upgradeables(this, args[0]); //needed to validate the args[0]
    if (!this.isConnected)
      return og.call(this, ...args);
    const removables = args[0].children.length && [...args[0].children];
    const res = og.call(this, ...args);
    removables && dGrade.add(...removables.filter(n => !n.isConnected));
    upgradeBranch(...toBeUpgraded);
    return res;
  }
  function removeThis(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const res = og.call(this, ...args);
    dGrade.add(this);
    return res;
  }
  function removeChildren() {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const removables = this.children.length && [...this.children];
    const res = og.call(this, ...args);
    removables && dGrade.add(...removables.filter(n => !n.isConnected));
    return res;
  }
  function element_replaceWith(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    const toBeUpgraded = upgradeables(this, ...args);
    const wasConnected = this.isConnected;
    const res = og.call(this, ...args);
    if (wasConnected) {
      dGrade.add(this);
      upgradeBranch(...toBeUpgraded);
    }
    return res;
  }
  function parentnode_replaceChildren(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    const toBeUpgraded = upgradeables(this, ...args);
    const removables = this.isConnected && this.children.length && [...this.children];
    const res = og.call(this, ...args);
    removables && dGrade.add(...removables.filter(n => !n.isConnected));
    upgradeBranch(...toBeUpgraded);
    return res;
  }
  function innerHTMLsetter(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const removables = this.children?.length && [...this.children];
    const res = og.call(this, ...args);
    removables && dGrade.add(...removables);
    upgradeBranch(...this.children);
    return res;
  }
  function outerHTMLsetter(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected || !this.parentNode) return og.call(this, ...args);
    const sibs = [...this.parentNode.children];
    const res = og.call(this, ...args);
    dGrade.add(this);
    const sibs2 = [...this.parentNode.children].filter(n => !sibs.includes(n));
    upgradeBranch(...sibs2);
    return res;
  }
  function innerTextSetter(og, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const removables = this.children.length && [...this.children];
    const res = og.call(this, ...args);
    removables && dGrade.add(...removables.filter(n => !n.isConnected));
    return res;
  }
  function textContentSetter(og, ...args) {
    if (this.nodeType !== Node.ELEMENT_NODE && this.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)
      return og.call(this, ...args);
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    if (!this.isConnected) return og.call(this, ...args);
    const removables = this.children.length && [...this.children];
    const res = og.call(this, ...args);
    removables && dGrade.add(...removables);
    return res;
  }
  function insertAdjacentHTML_DD(og, position, ...args) {
    if (dGrade.has(this.getRootNode({ composed: true })))
      throw new Error("Downgraded objects cannot be changed. Is pointless.");
    let root, index;
    if (position === "afterbegin")
      root = this, index = 0;
    else if (position === "beforeend")
      root = this, index = this.children.length;
    else if (position === "beforebegin")
      root = this.parentNode, index = Array.prototype.indexOf.call(root.children, this);
    else if (position === "afterend")
      root = this.parentNode, index = Array.prototype.indexOf.call(root.children, this) + 1;
    const childCount = root.children.length;
    const res = og.call(this, position, ...args);
    const addCount = root.children.length - childCount;
    const newRoots = Array.from(root.children).slice(index, index + addCount);
    upgradeBranch(...newRoots);
    return res;
  }

  const map = [
    [Element.prototype, "setAttribute", setAttribute_DD],

    [Element.prototype, "append", insertArgs],
    [Element.prototype, "prepend", insertArgs],
    [Element.prototype, "before", insertArgs],
    [Element.prototype, "after", insertArgs],
    [Document.prototype, "append", insertArgs],
    [Document.prototype, "prepend", insertArgs],
    [DocumentFragment.prototype, "append", insertArgs],
    [DocumentFragment.prototype, "prepend", insertArgs],

    [Node.prototype, "appendChild", insertArgs0],
    [Node.prototype, "insertBefore", insertArgs0],
    [Node.prototype, "replaceChild", insertArgs0],
    [Range.prototype, "insertNode", insertArgs0],

    [Element.prototype, "insertAdjacentElement", insertArgs1],

    [Node.prototype, "removeChild", removesArgs0],
    [Node.prototype, "replaceChild", removesArgs1],
    [Range.prototype, "deleteContents", removeChildren],
    [Range.prototype, "extractContents", removeChildren],
    [Element.prototype, "remove", removeThis],

    [Element.prototype, "replaceWith", element_replaceWith],
    [Element.prototype, "replaceChildren", parentnode_replaceChildren],
    [Document.prototype, "replaceChildren", parentnode_replaceChildren],
    [DocumentFragment.prototype, "replaceChildren", parentnode_replaceChildren],

    [Range.prototype, "surroundContents", range_surroundContent],

    [Element.prototype, "insertAdjacentHTML", insertAdjacentHTML_DD],

    [Element.prototype, "innerHTML", innerHTMLsetter],
    [ShadowRoot.prototype, "innerHTML", innerHTMLsetter],
    [Element.prototype, "outerHTML", outerHTMLsetter],
    [Node.prototype, "textContent", textContentSetter],
    [HTMLElement.prototype, "innerText", innerTextSetter],
  ];

  for (const [obj, prop, monkey] of map) {
    const d = Object.getOwnPropertyDescriptor(obj, prop);
    const og = d.value || d.set;
    function monkey2(...args) {
      return monkey.call(this, og, ...args);
    }
    Object.defineProperty(obj, prop,
      Object.assign({}, d, { [d.set ? "set" : "value"]: monkey2 }));
  }
})();

function loadDoubleDots(aelOG) {
  if (document.readyState !== "loading")
    return upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", _ => upgradeBranch(document.documentElement));
}

async function getModuleFunctions(url) {
  const module = await import(url);
  if (!module || typeof module !== "object" && !(module instanceof Object))
    throw new TypeError(`URL is not an es6 module: ${this.url}`);
  const moduleFunctions = {};
  for (let [k, v] of Object.entries(module))
    if (typeof v === "function")
      moduleFunctions[k] = v;
  return moduleFunctions;
}

//definitions from the attr itself first, then from the src attribute searchParams, then from the filename.
function srcAndParams(at, name, src) {
  name = typeof name === "string" ? name : at.value;
  try {
    src = src instanceof URL ? src : new URL(src, location.href);
  } finally {
    src = new URL(at.ownerElement.getAttribute("src"), location.href);
  }
  return {
    src,
    params: name ?
      new URLSearchParams(name) :
      src.searchParams ??
      new URLSearchParams(src.pathname.split("/").pop().replace(/\.m?js$/, ""))
  };
}

async function loadRuleDefs(src, name) {
  const module = await getModuleFunctions(src);
  const rule = module[name];
  const defs = Object.entries(module).filter(([k, v]) => k.startsWith(name));
  if (!rule && !defs.length)
    throw new ReferenceError(`"${src}" does not export rule "${name}".`);
  if (rule && !defs.length)
    return rule;
  return { rule, defs: Object.fromEntries(defs) };
}

async function loadDef(src, name) {
  const module = await getModuleFunctions(src);
  const def = module[name];
  if (def) return def;
  throw new ReferenceError(`"${src}" does not export "${name}".`);
}

const camelCase = str => str.replace(/-[a-z]/g, c => c[1].toUpperCase());
const PascalCase = str => str.replace(/^(_*[a-z])|-([a-z])/g, (_, a, c = a) => c.toUpperCase());

function defineReaction(name, module) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid definition name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Reactions.define(name, loadDef(src, value || camelCase(name)));
}

function defineTrigger(name, module) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid definition name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Triggers.define(name, loadDef(src, value || PascalCase(name)));
}

function defineReactionRule(name, module) {
  if (!name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/))
    throw new SyntaxError(`Invalid rule name: "${name}". name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Reactions.defineRule(name, loadRuleDefs(src, value || camelCase(name)));
}

function defineTriggerRule(name, module) {
  if (!name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/))
    throw new SyntaxError(`Invalid rule name: "${name}". name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Triggers.defineRule(name, loadRuleDefs(src, value || PascalCase(name)));
}

function definePortal(name, module) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid portal name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries()) {
    const reaction = value || camelCase(name);
    const trigger = reaction.replace(/^_*[a-z]/, c => c.toUpperCase());
    this.getRootNode().Reactions.define(name, loadDef(src, reaction));
    this.getRootNode().Triggers.define(name, loadDef(src, trigger));
    this.getRootNode().Reactions.defineRule(name + "_", loadRuleDefs(src, reaction));
    this.getRootNode().Reactions.defineRule(name + ".", loadRuleDefs(src, reaction));
    this.getRootNode().Reactions.defineRule(name + "_", loadRuleDefs(src, reaction));
    this.getRootNode().Triggers.defineRule(name + "_", loadRuleDefs(src, trigger));
    this.getRootNode().Triggers.defineRule(name + ".", loadRuleDefs(src, trigger));
    this.getRootNode().Triggers.defineRule(name + "_", loadRuleDefs(src, trigger));
  }
}

function setAttributes(el, txt) {
  const pieces = txt.split(/([_a-zA-Z][a-zA-Z0-9.:_-]*="[^"]*")/);
  pieces.forEach((unit, i) => {
    if (i % 2 === 1) {
      const [_, name, value] = unit.match(/^([_a-zA-Z][a-zA-Z0-9.:_-]*)="([^"]*)"$/);
      el.setAttribute(name, value);
    } else if (unit.trim() !== "") {
      throw new SyntaxError(`<!--<template ${txt}>-->` + ' has an incorrect name="value"');
    }
  });
}

function subsumeNodes(at) {
  const el = at.ownerElement;
  const t = document.createElement("template");
  setAttributes(t, at.value);
  const nodes = [...el.childNodes];
  t.content.append(...nodes.map(n => n.cloneNode?.(true) ?? n));
  nodes.forEach(n => n.remove());
  el.append(t);
  return t;
}

function absorbNodes({ start, nodes, txt, end }) {
  const t = document.createElement("template");
  setAttributes(t, txt);
  t.content.append(...nodes.map(n => n.cloneNode?.(true) ?? n));
  nodes.forEach(n => n.remove());
  start.after(t);
  start.remove(), end?.remove();
}

function gobble(start) {
  const txt = start.textContent.match(/^\s*<template(.*)>\s*$/)[1];
  const nodes = [];
  for (let n = start; n = n.nextSibling;) {
    if (n instanceof Comment && n.textContent.match(/^\s*<\/template\s*>\s*$/))
      return { start, nodes, txt, end: n };
    nodes.push(n);
  }
  return { start, nodes, txt };
}

function* templateTriggers(el, trigger) {
  for (let n, it = document.createNodeIterator(el, NodeFilter.SHOW_ELEMENT); n = it.nextNode();)
    for (let a of n.attributes)
      if (a.name.startsWith(trigger)) {
        yield a;
        break;
      }
}

function* templateCommentStarts(root) {
  const it = document.createNodeIterator(root, NodeFilter.SHOW_COMMENT);
  for (let n; n = it.nextNode();)
    if (n.textContent.match(/^\s*<template(.*)>\s*$/))
      yield n;
}

function hashDebug(el) {
  el = cloneNodeOG.call(el, true);
  for (let a of el.attributes)
    if (a.name.startsWith("template:"))
      el.removeAttribute(a.name);
  return `Replace the following element in your code:\n\n${el.outerHTML}`;
}

class Template extends AttrCustom {
  upgrade() {
    const el = this.ownerElement;
    if (el instanceof HTMLTemplateElement)
      throw new Error("template trigger cannot be applied to template elements.");
    if (!el.childNodes.length === 0 || el.children.length === 1 && el.children[0] instanceof HTMLTemplateElement)
      return;

    const attributes = [...templateTriggers(el, this.trigger + ":")].reverse();
    const templates = attributes.map(subsumeNodes);
    for (let t of templates)
      for (let comment of [...templateCommentStarts(t.content)].reverse())
        absorbNodes(gobble(comment));

    DoubleDots.log?.('template: production tutorial', hashDebug(el));
  }
}

function wait_(rule) {
  const [_, ms] = rule.split("_");
  return arg => new Promise(r => setTimeout(_ => r(arg), ms));
}

//todo this should probably be Wait_ too
//Wait_100:do-something:at.repeat //which would enable us to have a set timeout

document.Triggers.define("template", Template);
// document.Reactions.define("template", template);
document.Reactions.define("define", definePortal);
document.Reactions.define("define-reaction", defineReaction);
document.Reactions.define("define-trigger", defineTrigger);
document.Reactions.define("define-reaction-rule", defineReactionRule);
document.Reactions.define("define-trigger-rule", defineTriggerRule);
document.Reactions.defineRule("wait_", wait_);
document.Reactions.define("prevent-default", i => (eventLoop.event.preventDefault(), i));
document.Reactions.define("log", function (...i) { console.log(this, ...i); return i[0]; });
document.Reactions.define("debugger", function (...i) { console.log(this, ...i); debugger; return i[0]; });

loadDoubleDots(EventTarget.prototype.addEventListener);
//adding colors

function log(name, first, ...rest) {
  console.groupCollapsed(first);
  console[name](...rest);
  console.groupEnd();
}

const funcs = {};
// these two functions are defined by default in dd.js
// funcs.debugger = function (...args) { console.log(this, ...args); debugger; };
// "log",
for (let name of ["debug", "info", "warn", "error"])
  funcs[name] = log.bind(null, name);

const BooleanOG = Boolean, NumberOG = Number, StringOG = String;
const PrimitiveConstructors = {
  Boolean: function Boolean(arg) {
    if (new.target)
      throw new Error(`Replace "new Boolean(${arg})" with "Boolean(${arg})".`);
    return BooleanOG(arg);
  },
  Number: function Number(arg) {
    if (new.target)
      throw new Error(`Replace "new Number(${arg})" with "Number(${arg})".`);
    return NumberOG(arg);
  },
  String: function String(arg) {
    if (new.target)
      throw new Error(`Replace "new String(${arg})" with "String(${arg})".`);
    return StringOG(arg);
  },
};

const attachShadowOG = Element.prototype.attachShadow;
function attachShadowAlwaysOpen(...args) {
  (args[0] ??= {}).mode = "open";
  return attachShadowOG.call(this, ...args);
}

const d = function deprecated() {
  throw new Error("Deprecated in DoubleDots strict.");
};

const DoubleDotDeprecated = {
  "Element.prototype.hasAttributeNS": d,
  "Element.prototype.getAttributeNS": d,
  "Element.prototype.setAttributeNS": d,
  "Element.prototype.removeAttributeNS": d,
  "Element.prototype.setAttributeNode": d,
  "Element.prototype.removeAttributeNode": d,
  "Element.prototype.getAttributeNodeNS": d,
  "Element.prototype.setAttributeNodeNS": d,
  //     "outerHTML"
  //.setAttribute(name, value)
  //.hasAttribute(name)
  //.getAttribute(name)
  //.getAttributeNode(name)
  //.attributes
  "Event.prototype.stopPropagation": d,
  "Event.prototype.stopImmediatePropagation": d,
  "EventTarget.prototype.addEventListener": d,
  "EventTarget.prototype.removeEventListener": d,
  //.dispatchEvent
  "window.setTimeout": d,
  "window.clearTimeout": d,
  "window.setInterval": d,
  "window.clearInterval": d,
  "window.event": d,
  //must add "async sleep(ms)" first
  //MutationObserver
  //ResizeObserver
  //IntersectionObserver
  "Document.prototype.createAttribute": d,
  "Document.prototype.createComment": d,
  "Document.prototype.createDocumentFragment": d,
  // "Document.prototype.createElement": d, //maybe allow this, now that we can take elements in and out of a document, but not adopt it.
  "Document.prototype.createTextNode": d,
  "Document.prototype.importNode": d,
  "Document.prototype.currentScript": d,
  "Document.prototype.write": d,
  // "createRange" //todo research
  "Node.prototype.cloneNode": d
};
/*
"HTMLElement.prototype": {
  adoptionCallback: problematicDeprecationMethod, needs to highJack the HTMLElement constructor actually.
}
*/

console.log("DoubleDots.cubes();");
const data = [];


// cube() and STRINGIFY
let _i = 0;
function makeDocId(doc) {
  return doc === document ? "#document" : `${doc.host?.tagName}#${_i++}`;
}

const eInfo = e => `${e.type}#${e.timeStamp}`;
const dInfo = v => v.__uid ??= makeDocId(v);

function stringifyCube(k, v) {
  return (v instanceof Document || v instanceof ShadowRoot) ? dInfo(v) :
    v instanceof Event ? eInfo(v) :
      v instanceof Promise ? `Promise#${v.__uid ??= _i++}` :
        v instanceof Function ? v.name || v.toString() :
          v;
}

function cube(k, v) {
  data.push([k, JSON.parse(JSON.stringify(v, stringifyCube))]);
}


//cubes() and conversion
function cubeToHtml(data) {
  return `
<view-cube>${JSON.stringify(data)}</view-cube>
<script type="module">
import {ViewCube} from "http://localhost:3003/x/cube/v1.js";
customElements.define("view-cube", ViewCube);
</script>`;
}
//todo the link here is a problem. Only used while developing.


function cubes() {
  const url = URL.createObjectURL(new Blob([cubeToHtml(data)], { type: "text/html" }));
  //todo cleanup the objectUrl..
  window.open(url, "_blank");
}


const template = /*html*/`
<style>
  :host {
    display: block;
    border: 1px solid black;
    padding: 1em;
    margin: 1em;
  }
  pre {
    border: 1px solid black;
    padding: 1em;
    margin: 1em;
  }
</style>
<div></div>
`;


//ViewCube
class ViewCube extends HTMLElement {

  static parseCube(data) {
    return data.reduce((res, [key, pojo], I) => {
      const value = Object.assign({ I, key }, pojo);
      if (key.startsWith("task")) {
        res.task.push(value);
      } else if (key.startsWith("define")) {
        const { I, Def, root, type, key, name } = value;
        const reg = [root, type, key].reduce((o, p) => (o[p] ??= {}), res.defs);
        (reg[name] ??= []).push({ I, Def });
      }
      return res;
    }, { task: [], defs: {} });
  }

  connectedCallback() {
    const data = JSON.parse(this.textContent);
    const { task, defs } = ViewCube.parseCube(data);
    const viewCubeHtml = `
    <pre>${task.map(t => JSON.stringify(t, stringifyCube, 2)).join("\n")}</pre>
    <pre>${JSON.stringify(defs, stringifyCube, 2)}</pre>`;
    this.attachShadow({ mode: "open" }).innerHTML = viewCubeHtml;
  }
}

//adding logging
Object.assign(funcs, { cube, cubes });
Object.assign(DoubleDots, funcs);
for (let [name, func] of Object.entries(funcs))
  document.Reactions.define(name, func);

//DEPRECATIONS
for (let [path, func] of Object.entries(PrimitiveConstructors))
  monkeyPatch(path, func);
monkeyPatch("Element.prototype.attachShadow", attachShadowAlwaysOpen);
for (let [path, deprecate] of Object.entries(DoubleDotDeprecated))
  monkeyPatch(path, deprecate, deprecate);

//1. DoubleDots doesn't treat objects made using new as primitives.
//You can remove this restriction if you have a 3rd party library that
//use such objects, and these libraries will still work ok.
//But if you make stuff from scratch, 
//stay away from "new String/Number/Boolean()".
//2. DoubleDots MUST access full .composedPath for all events.
//3. Deprecate lots of the native methods
//# sourceMappingURL=dd_dev.js.map
