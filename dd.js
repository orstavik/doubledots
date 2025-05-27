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

  static gc() {
    let active, l;
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
  nextTick,
  sleep,
  nativeEvents,
  kebabToPascal,
  pascalToKebab,
  up, left, right, roots, hosts, downwide,
  importBasedEval,
  miniQuerySelector
};

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
    return this.ownerElement.isConnected();
  }

  getRootNode(...args) {
    return this.ownerElement?.getRootNode(...args);
  }

  remove() {
    return this.ownerElement.removeAttribute(this.name);
  }

  //todo remove this and only use eventLoop.dispatchBatch(e, attrs);
  dispatchEvent(e) {
    if (!this.isConnected)
      throw new DoubleDots.ReactionError("dispatch on disconnected attribute.");
    eventLoop.dispatch(e, this);
  }

  static upgradeBranch(...els) {
    for (let el of els) {
      if (el instanceof Element)
        this.upgradeElementRoot(el);
      else if (el instanceof DocumentFragment)
        for (let c of el.children)
          this.upgradeElementRoot(c);
    }
    //todo we don't want to run the eventLoop until all the attr are upgraded.
  }

  static upgradeElementRoot(el) {
    for (let at of el.attributes)
      // if (at.name.includes(":"))
        AttrCustom.upgrade(at);
    for (let c of el.children)
      this.upgradeElementRoot(c);
    // for (let desc of el.querySelectorAll("*"))
    //   for (let at of desc.attributes)
    //     if (at.name.includes(":"))
    //       AttrCustom.upgrade(at);
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
    removeEventListenerOG(this.target, this.type, this.__l, this.options);
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
  AttrListener,
  AttrListenerGlobal,
  AttrCustom: AttrCustom$1,
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

  #setRule(name, Def) {
    DoubleDots.cube?.("defineRule", { type: this.#type, root: this.#root, name, Def });
    return this.#rules[name] = Def;
  }

  #setDef(name, Def) {
    DoubleDots.cube?.("define", { type: this.#type, root: this.#root, name, Def });
    return this.#definitions[name] = Def;
  }

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
    this.#setRule(prefix, FunFun);
    FunFun instanceof Promise && FunFun
      .then(newFunFun => this.#setRule(prefix, newFunFun))
      .catch(err => this.#setRule(prefix, new AsyncDefinitionError(err, null, prefix)));
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

/**
 * Whenever you request an unknown definition, 
 * you get an UnknownDefinition Promise.
 * When later a matching definition is added,
 * this promise will resolve with the new definition.
 * If this promise is rejected from the outside,
 * The UnknownDefinitionsMap will automatically clean
 * itself up.
 * 
 * To avoid memory leaks with !isConnected attributes,
 * a 10sec loop checks the UnknownDefinitions and removes 
 * any disconnected Promises.
 */
class UnknownDefinition extends Promise {
  static make(attr) {
    let resolve, reject;
    const promise = new UnknownDefinition((a, b) => {
      resolve = a;
      reject = b;
    });
    return Object.assign(promise, { resolve, reject, attr });
  }
}

const setTimeoutOG = setTimeout;
class PromiseMap {
  unknowns = {};
  #interval;

  make(fullname, attr) {
    const p = UnknownDefinition.make(attr);
    (this.unknowns[fullname] ??= []).push(p);
    p.catch(_ => this.remove(fullname, p));
    this.#interval || this.#cleanLoop();
    return p;
  }

  async #cleanLoop() {
    this.#interval = true;
    while (true) {
      await new Promise(r => setTimeoutOG(r, 10000));
      const all = Object.entries(this.unknowns);
      if (!all.length)
        return this.#interval = false;
      for (let [fullname, promises] of all)
        for (let p of promises.filter(p => !p.attr.isConnected))
          this.remove(fullname, p);
    }
  }

  remove(fullname, p) {
    const promises = this.unknowns[fullname];
    if (!promises)
      return;
    const i = promises.indexOf(p);
    if (i < 0)
      return;
    promises.splice(i, 1);
    !promises.length && delete this.unknowns[fullname];
  }

  complete(fullname) {
    const promises = this.unknowns[fullname];
    delete this.unknowns[fullname];
    for (let p of promises || [])
      try { p.resolve(); } catch (_) { } //Att!! handle errors outside
  }
  completeRule(rule) {
    for (let fullname in this.unknowns)
      if (fullname.startsWith(rule))
        this.complete(fullname);
  }
}

class UnknownDefinitionsMap extends DefinitionsMap {
  #unknowns = new PromiseMap();
  define(fullname, Def) {
    super.define(fullname, Def);
    this.#unknowns.complete(fullname);
  }

  defineRule(rule, FunClass) {
    super.defineRule(rule, FunClass);
    this.#unknowns.completeRule(rule);
  }

  //todo add attr
  get(fullname, attr) {
    return super.get(fullname) ?? this.#unknowns.make(fullname, attr);
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
  UnknownDefinition,
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

const Specializers = {
  "DocumentFragment.prototype.cloneNode": Node.prototype.cloneNode,
  "HTMLTemplateElement.prototype.insertAdjacentHTML": Element.prototype.insertAdjacentHTML,
  "HTMLTemplateElement.prototype.innerHTML": Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set,
};
for (let [path, superior] of Object.entries(Specializers))
  monkeyPatch(path, superior);

// const state = [...document.querySelectorAll("*")];
//1. Since the DoubleDots is the only script.
//   The DoubleDots then runs so, we can just iterate on the main document.
//   Listen for the native DCL, and then upgrade the branch of the document.
//2. the adding HTML template methods. innerHTML + insertAdjacentHTML.
//3. setAttribute.
//   remember to disallow override-x attribute names immutable. Anything that starts with `override-` is illegal from setAttribute? yes.
//4. AttrUnknown upgradeUpgrade
//   1. It can only happen when new Trigger Defs are added to the main document.Triggers. 
//      This is because the shadowRoot.Triggers are locked post register time.
//5. WaitForItAttr. Promise Definitions.

(function (Element_p, ShadowRoot_p) {
  const Element_innerHTML_OG = Object.getOwnPropertyDescriptor(Element_p, "innerHTML").set;
  const innerHTML_DD_el = function innerHTML_DD(val) {
    Element_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(...this.children); //todo untested fix from project
  };

  const ShadowRoot_innerHTML_OG = Object.getOwnPropertyDescriptor(ShadowRoot_p, "innerHTML").set;
  const innerHTML_DD_sr = function innerHTML_DD(val) {
    ShadowRoot_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(...this.children); //todo untested fix from project
  };

  const insertAdjacentHTMLOG = Element_p.insertAdjacentHTML;
  function insertAdjacentHTML_DD(position, ...args) {
    //todo test the different versions here
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
    insertAdjacentHTMLOG.call(this, position, ...args);
    const addCount = root.children.length - childCount;
    const newRoots = Array.from(root.children).slice(index, index + addCount);
    AttrCustom.upgradeBranch(...newRoots);
  }

  const setAttributeOG = Element_p.setAttribute;
  const getAttributeNodeOG = Element_p.getAttributeNode;
  function setAttribute_DD(name, value) {
    //0. syntax error for "override-"
    if (name.startsWith("override-"))
      throw new SyntaxError("You can only set [override-xyz] attributes on elements in HTML template: " + name);
    //1. treat the normal normal
    // if (!name.includes(":"))
      // return setAttributeOG.call(this, name, value);
    //2. if the name is DoubleDots
    let at = getAttributeNodeOG.call(this, name);
    if (at) {
      at.value !== value && (at.value = value);
      return;
    }
    setAttributeOG.call(this, name, value);
    at = getAttributeNodeOG.call(this, name);
    AttrCustom.upgrade(at);
  }
  const mainOverrides = {
    "Element.prototype.innerHTML": innerHTML_DD_el,
    "ShadowRoot.prototype.innerHTML": innerHTML_DD_sr,
    "Element.prototype.insertAdjacentHTML": insertAdjacentHTML_DD,
    "Element.prototype.setAttribute": setAttribute_DD,
  };
  for (let [path, func] of Object.entries(mainOverrides))
    monkeyPatch(path, func);
})(Element.prototype, ShadowRoot.prototype);

(function () {
  //todo we need the innerHTML and insertAdjacentHTML and setAttribute to be added to the nativeMethods.

  const EMPTY = [];
  //JS injections is allowed when we
  //1) move elements within the same rootNode (no upgrade of AttrCustom)
  //2) move elements from one DocumentFragment to another (no upgrade of AttrCustom)
  //3) inject elements *from* DocumentFragments to an .isConnected element (DO upgrade of AttrCustom)
  //* otherwise just fail.
  function checkRoot(root, child, r = root.getRootNode(), cr = child?.getRootNode()) {
    if (root.isConnected && child instanceof DocumentFragment)
      return [...child.children];
    if (root.isConnected && (child instanceof Element) && (cr instanceof DocumentFragment))
      return [child];
    if (!(child instanceof Element) || cr === r || (cr instanceof DocumentFragment && r instanceof DocumentFragment))
      return EMPTY;
    throw new DoubleDots.InsertElementFromJSError(root, child);
  }

  function sameRootFirstArg(child) {
    return checkRoot(this, child);
  }
  function sameRootSecond(_, child) {
    return checkRoot(this, child);
  }
  function sameRootSpreadArg(...args) {
    const r = this.getRootNode();
    return args.map(child => checkRoot(this, child, r)).flat();
  }

  function verifyAndUpgrade(OG, verify) {
    return function (...args) {
      const upgrades = verify.call(this, ...args);
      const res = OG.apply(this, args);
      upgrades.length && AttrCustom.upgradeBranch(...upgrades);
      return res;
    };
  }

  const Mask = {
    "Node.prototype.insertBefore": sameRootFirstArg,
    "Node.prototype.appendChild": sameRootFirstArg,
    "Element.prototype.after": sameRootSpreadArg,
    "Element.prototype.before": sameRootSpreadArg,
    "Element.prototype.insertAdjacentElement": sameRootSecond,
    "Element.prototype.append": sameRootSpreadArg,
    "Element.prototype.prepend": sameRootSpreadArg,
    "Document.prototype.append": sameRootSpreadArg,
    "Document.prototype.prepend": sameRootSpreadArg,
    "DocumentFragment.prototype.append": sameRootSpreadArg,
    "DocumentFragment.prototype.prepend": sameRootSpreadArg,
    //replaceChild
  };

  for (let [path, verify] of Object.entries(Mask))
    monkeyPatch(path,
      verifyAndUpgrade(path.split(".").reduce((o, p) => o[p], window), verify));
})();

function loadDoubleDots(aelOG) {
  if (document.readyState !== "loading")
    return AttrCustom.upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", _ => AttrCustom.upgradeBranch(document.documentElement));
}

async function loadDef(url, lookup) {
  const module = await import(url);
  if (!module || typeof module !== "object" && !(module instanceof Object))
    throw new TypeError(`URL is not an es6 module: ${this.url}`);
  const def = module[lookup];
  if (def) return def;
  for (let [k, v] of Object.entries(module))
    if (k.startsWith("dynamic"))
      if (v[lookup])
        return v[lookup];
  throw new TypeError(`ES6 module doesn't contain resource: ${lookup}`);
}

function* parse(url) {
  const hashSearch = (url.hash || url.search).slice(1);
  if (!hashSearch)
    throw DoubleDots.SyntaxError("Missing DoubleDots.Reference in url: " + url);
  const refs = hashSearch.entries?.() ?? hashSearch.split("&").map(s => s.split("="));
  for (let [name, value] of refs)
    yield* parseEntities(name, value);
}

function* parseEntities(key, value) {
  const m = key.match(
    /^([_.-]*)(?:([A-Z]{2}[A-Z0-9_.-]*)|([a-z][a-zA-Z0-9_.-]*)|([A-Z][a-zA-Z0-9_.-]*))(~)?(~)?([_.-])?$/);
  if (!m)
    throw new SyntaxError("bad name in doubleDots url definition: " + key + "=" + value);
  let [, pFix, portal, reaction, trigger, rule, square, _] = m;
  rule = rule ? "defineRule" : "define";
  if (reaction || trigger) {
    const type = trigger ? "Triggers" : "Reactions";
    fullname = pFix +
      DoubleDots.pascalToKebab(reaction || trigger.replace(/[A-Z]/, c => c.toLowerCase()));
    value ||= reaction || trigger;
    yield { type, fullname, rule, value };
  } else if (portal) {
    portal = portal.toLowerCase().replaceAll(/_[a-z]/g, m => m[1].toUpperCase());
    reaction = pFix + portal;
    let rValue = value ? value[0].toLowerCase() + value.slice(1) : reaction;
    fullname = pFix +
      DoubleDots.pascalToKebab(reaction.replace(/[A-Z]/, c => c.toLowerCase()));
    portal = portal.replace(/[a-z]/, m => m.toUpperCase());
    trigger = pFix + portal;
    let tValue = value || trigger;
    _ = square ? _ || "_" : "";
    if (square || rule === "define")
      yield { type: "Triggers", rule: "define", fullname, value: tValue };
    if (square || rule === "defineRule")
      yield { type: "Triggers", rule: "defineRule", fullname: fullname + _, value: tValue + _ };
    if (square || rule === "define")
      yield { type: "Reactions", rule: "define", fullname, value: rValue };
    if (square || rule === "defineRule")
      yield { type: "Reactions", rule: "defineRule", fullname: fullname + _, value: rValue + _ };
  }
}

async function defineImpl(url, root) {
  for (let r of parse(url))
    root[r.type][r.rule](r.fullname, loadDef(url, r.value));
};

//_:define  => must be installed to enable the loading of doubledots triggers and reactions.
function define() {
  const src = this.ownerElement.getAttribute("src");
  const base = src ? new URL(src, location) : location;
  defineImpl(new URL(this.value, base), this.ownerDocument);
}

// (function () {
const ElAppendOG = DoubleDots.nativeMethods("Element.prototype.append");
const DocfragAppendOG = DoubleDots.nativeMethods("DocumentFragment.prototype.append");
const CommentAfterOG = DoubleDots.nativeMethods("Comment.prototype.after");
const cloneNodeOG = DoubleDots.nativeMethods("Node.prototype.cloneNode");
const docCreateElOG = DoubleDots.nativeMethods("Document.prototype.createElement");
const setAttributeOG = DoubleDots.nativeMethods("Element.prototype.setAttribute");

function setAttributes(el, txt) {
  const pieces = txt.split(/([_a-zA-Z][a-zA-Z0-9.:_-]*="[^"]*")/);
  pieces.forEach((unit, i) => {
    if (i % 2 === 1) {
      const [_, name, value] = unit.match(/^([_a-zA-Z][a-zA-Z0-9.:_-]*)="([^"]*)"$/);
      setAttributeOG.call(el, name, value);
    } else if (unit.trim() !== "") {
      throw new SyntaxError(`<!--<template ${txt}>-->` + ' has an incorrect name="value"');
    }
  });
}

function subsumeNodes(at) {
  const el = at.ownerElement;
  const t = docCreateElOG.call(document, "template");
  setAttributes(t, at.value);
  DocfragAppendOG.call(t.content, ...el.childNodes);
  ElAppendOG.call(el, t);
  return t;
}

function subsumeHtml(at) {
  const el = at.ownerElement;
  el.innerHTML = `<template ${at.value}>${el.innerHTML}</template>`;
  return el.children[0];
}

function absorbNodes({ start, nodes, txt, end }) {
  const t = docCreateElOG.call(document, "template");
  setAttributes(t, txt);
    //todo instead of doing this, we could just add the STR = `<template {txt}></template>` and add it and then check that the outerHTML of the element added === STR ??
  DocfragAppendOG.call(t.content, ...nodes);
  CommentAfterOG.call(start, t);
  start.remove(), end?.remove();
}

function absorbHtml({ start, nodes, txt, end }) {
  let content = "";
  for (let n of nodes) {
    content += n.outerHTML ?? n instanceof Comment ? `<!--${n.textContent}-->` : n.textContent;
    n.remove();
  }
  start.insertAdjacentHTML("afterend", `<template ${txt}>${content}</template>`);
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
  upgrade(dynamic) {
    const el = this.ownerElement;
    if (el instanceof HTMLTemplateElement)
      throw new Error("template trigger cannot be applied to template elements.");
    if (!el.childNodes.length === 0 || el.children.length === 1 && el.children[0] instanceof HTMLTemplateElement)
      return;
    const subsume = dynamic ? subsumeHtml : subsumeNodes;
    const absorb = dynamic ? absorbHtml : absorbNodes;

    const attributes = [...templateTriggers(el, this.trigger + ":")].reverse();
    const templates = attributes.map(subsume);
    for (let t of templates)
      for (let comment of [...templateCommentStarts(t.content)].reverse())
        absorb(gobble(comment));

    DoubleDots.log?.('template: production tutorial', hashDebug(el));
    //todo now we don't have any events coming from the template: trigger.
    //todo below is what it looks like if we upgrade and dispatch an event using downward propagation.
    // for (let a of attributes)
    //   AttrCustom.upgrade(a);
    // eventLoop.dispatchBatch(new Event("template"), [attributes]);
  }
}


// todo this is no longer needed. We can now just use el.children.0
function template() {
  return this.ownerElement.children[0];
}
// })();

function wait_(rule) {
  const [_, ms] = rule.split("_");
  return arg => new Promise(r => setTimeout(_ => r(arg), ms));
}

//todo this should probably be Wait_ too
//Wait_100:do-something:at.repeat //which would enable us to have a set timeout

document.Triggers.define("template", Template);
document.Reactions.define("template", template);
document.Reactions.define("define", define);
document.Reactions.defineRule("wait_", wait_);
document.Reactions.define("prevent-default",
  i => (eventLoop.event.preventDefault(), i));
document.Reactions.define("log", function (...i) { console.log(this, ...i); return i[0]; });
document.Reactions.define("debugger", function (...i) { console.log(this, ...i); debugger; return i[0]; });

loadDoubleDots(EventTarget.prototype.addEventListener);
//adding colors
//# sourceMappingURL=dd.js.map
