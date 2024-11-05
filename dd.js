var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/dd/1_DoubleDots.js
var dce = document.createElement;
var ael = EventTarget.prototype.addEventListener;
var si = setInterval;
var st = setTimeout;
async function sleep(ms) {
  return await new Promise((r) => st(r, ms));
}
function nextTick(cb) {
  const a = dce.call(document, "audio");
  ael.call(a, "ratechange", cb);
  a.playbackRate = 2;
}
var _bigSet, _key;
var _AttrWeakSet = class extends Set {
  static gc() {
    let active, l;
    for (let wr of __privateGet(_AttrWeakSet, _bigSet)) {
      if (l = wr.deref())
        for (let a of l)
          a.isConnected ? active = true : (l.delete(a), a.remove());
      else
        __privateGet(_AttrWeakSet, _bigSet).delete(wr);
    }
    !active && __privateSet(_AttrWeakSet, _key, clearInterval(__privateGet(_AttrWeakSet, _key)));
  }
  constructor(...args) {
    super(...args);
    __privateGet(_AttrWeakSet, _bigSet).add(new WeakRef(this));
  }
  add(at) {
    __privateGet(_AttrWeakSet, _key) ?? __privateSet(_AttrWeakSet, _key, si(_AttrWeakSet.gc, _AttrWeakSet.GC));
    super.add(at);
  }
};
var AttrWeakSet = _AttrWeakSet;
_bigSet = new WeakMap();
_key = new WeakMap();
__privateAdd(AttrWeakSet, _bigSet, /* @__PURE__ */ new Set());
//wr => AttrWeakSet
__privateAdd(AttrWeakSet, _key, void 0);
__publicField(AttrWeakSet, "GC", 1e4);
var nativeEvents = function() {
  function extractHandlers(obj) {
    return Object.keys(obj).filter((k) => k.startsWith("on")).map((k) => k.substring(2).toLowerCase());
  }
  const eOn = extractHandlers(Element.prototype);
  const hOn = extractHandlers(HTMLElement.prototype);
  const wOn = extractHandlers(window);
  const dOn = extractHandlers(Document.prototype);
  const e = [...eOn, ...hOn].filter((a, i, ar) => ar.indexOf(a) === i);
  const w = wOn.filter((x) => !e.includes(x));
  const d = dOn.filter((x) => !e.includes(x) && !w.includes(x));
  const result = { element: e, window: w, document: d };
  result.element.push("touchstart", "touchmove", "touchend", "touchcancel");
  result.document.push("DOMContentLoaded");
  Object.values(result).forEach(Object.freeze);
  Object.freeze(result);
  return result;
}();
function kebabToPascal(str) {
  return str.replace(/-[a-z]/g, (c) => c[1].toUpperCase());
}
function pascalToKebab(str) {
  return str.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}
async function importBasedEval(codeString) {
  codeString = "export default " + codeString.trim();
  const blob = new Blob([codeString], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const module = await import(url);
  URL.revokeObjectURL(url);
  return module.default;
}
function miniQuerySelector(doubledot) {
  let [q, ...attrs] = doubledot.split("_");
  for (let i = 0; i <= attrs.length - 1; i += 2) {
    const name = attrs[i].replaceAll("..", "\\:");
    const val = i <= attrs.length ? `$="${attrs[i + 1]}"` : "";
    q += `[${name}${val}]`;
  }
  return q;
}
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
var DoubleDotsError = class extends Error {
  constructor(msg, at) {
    super(msg);
  }
};
var ThisArrowFunctionError = class extends DoubleDotsError {
  constructor(Func) {
    super("arrow function with `this`.");
  }
  static check(Definition) {
    let txt = Definition.toString();
    if (!/^(async\s+|)(\(|[^([]+=)/.test(txt))
      return;
    txt = txt.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "");
    txt = txt.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, "");
    txt = txt.replace(/(`)(?:(?=(\\?))\2.)*?\1/g, "");
    if (/\bthis\b/.test(txt))
      throw new ThisArrowFunctionError(Definition);
  }
};
window.DoubleDots = {
  nativeMethods: {},
  DoubleDotsError,
  ThisArrowFunctionError,
  DeprecationError: class DeprecationError extends DoubleDotsError {
  },
  MissingReaction: class MissingReaction extends DoubleDotsError {
  },
  DisconnectedError: class DisconnectedError extends DoubleDotsError {
  },
  TriggerUpgradeError: class TriggerUpgradeError extends DoubleDotsError {
    constructor(at, error) {
      super(at);
    }
  },
  AttrWeakSet,
  nextTick,
  sleep,
  nativeEvents,
  kebabToPascal,
  pascalToKebab,
  up,
  left,
  right,
  roots,
  hosts,
  downwide,
  importBasedEval,
  miniQuerySelector
};

// src/dd/2_AttrCustom.js
var _makeRT, makeRT_fn;
var _AttrCustom = class extends Attr {
  get trigger() {
    var _a2;
    return __privateMethod(_a2 = _AttrCustom, _makeRT, makeRT_fn).call(_a2, this), this.trigger;
  }
  get reactions() {
    var _a2;
    return __privateMethod(_a2 = _AttrCustom, _makeRT, makeRT_fn).call(_a2, this), this.reactions;
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
  }
  static upgradeElementRoot(el) {
    for (let at of el.attributes)
      if (at.name.includes(":"))
        _AttrCustom.upgrade(at);
    for (let c of el.children)
      this.upgradeElementRoot(c);
  }
  static upgrade(at, Def) {
    Def ??= at.ownerElement.getRootNode().Triggers.get(at.name.split(":")[0], at);
    if (Def instanceof Error)
      throw Def;
    if (Def instanceof Promise) {
      Object.setPrototypeOf(at, AttrUnknown.prototype);
      Def.then((Def2) => _AttrCustom.upgrade(at, Def2));
      return;
    }
    try {
      Object.setPrototypeOf(at, Def.prototype);
      at.upgrade?.();
      at.value && (at.value = at.value);
    } catch (err) {
      throw new DoubleDots.TriggerUpgradeError(Def.name + ".upgrade() caused an error. Triggers shouldn't cause errors.");
    }
  }
};
var AttrCustom2 = _AttrCustom;
_makeRT = new WeakSet();
makeRT_fn = function(at) {
  let [trigger, ...reactions] = at.name.split(":");
  reactions.length === 1 && !reactions[0] && reactions.pop();
  Object.defineProperties(at, {
    "trigger": { value: trigger, enumerable: true },
    "reactions": { value: reactions, enumerable: true }
  });
};
// Interface
// set value(newValue) { const oldValue = super.value; super.value = newValue; ... }
// upgrade(){ super.upgrade(); ... }
// remove(){ ...; super.remove() }
__privateAdd(AttrCustom2, _makeRT);
var AttrImmutable = class extends AttrCustom2 {
  remove() {
  }
  //set value() { /* cannot be changed */ }
  //get value() { return super.value; }
};
var AttrUnknown = class extends AttrCustom2 {
};
var stopProp = Event.prototype.stopImmediatePropagation;
var addEventListenerOG = EventTarget.prototype.addEventListener;
var removeEventListenerOG = EventTarget.prototype.removeEventListener;
var listenerReg = {};
Object.defineProperty(Event, "activeListeners", {
  enumerable: true,
  value: function activeListeners(name) {
    return listenerReg[name];
  }
});
var AttrListener = class extends AttrCustom2 {
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
    eventLoop.dispatch(e, this);
  }
};
var AttrListenerGlobal = class extends AttrListener {
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
    return dict[this.trigger] ??= DoubleDots.AttrWeakSet();
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
    stopProp.call(e);
    eventLoop.dispatchBatch(e, this.register);
  }
};
var AttrEmpty2 = class extends AttrCustom2 {
  upgrade() {
    eventLoop.dispatch(new Event(this.trigger), this);
  }
};
var AttrMutation = class extends AttrCustom2 {
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
      eventLoop.dispatch(mr, this);
  }
};
var AttrResize = class extends AttrCustom2 {
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
};
var AttrIntersection = class extends AttrCustom2 {
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
    document.readyState === "complete" && eventLoop.dispatch(mr, this);
  }
};
Object.assign(window, {
  AttrListener,
  AttrListenerGlobal,
  AttrCustom: AttrCustom2,
  AttrImmutable,
  AttrUnknown,
  AttrEmpty: AttrEmpty2,
  AttrMutation,
  AttrIntersection,
  AttrResize
});

// src/dd/3_definition_registers_v4.js
var DefinitionError = class extends DoubleDots.DoubleDotsError {
  constructor(msg, fullname2, rule, RuleFun) {
    super(msg);
    this.fullname = fullname2;
    this.rule = rule;
    this.RuleFun = RuleFun;
  }
};
var TriggerNameError = class extends DefinitionError {
  constructor(fullname2) {
    super(`Trigger name/prefix must begin with english letter or '_'.
${fullname2} begins with '${fullname2[0]}'.`);
  }
  static check(name) {
    if (!name.match(/[a-z_].*/))
      throw new TriggerNameError(name);
  }
};
var DefinitionNameError = class extends DefinitionError {
  constructor(name) {
    super(`DoubleDots definition names and rule prefixes can only contain /^[a-z0-9_.-]*$/: ${name}`);
  }
  static check(name) {
    if (!name.match(/^[a-z0-9_\.-]*$/))
      throw new DefinitionNameError(name);
  }
};
var AsyncDefinitionError = class extends DefinitionError {
  constructor(msg, fullname2, rule, RuleFun) {
    super(msg, fullname2, rule, RuleFun);
    document.documentElement.dispatchEvent(new ErrorEvent(this));
  }
};
Object.assign(DoubleDots, {
  DefinitionError,
  TriggerNameError,
  DefinitionNameError,
  AsyncDefinitionError
});
var DefinitionsMap = class {
  #definitions = {};
  #rules = {};
  // #ruleRE = new RegExp(" ", "g");
  defineRule(prefix, FunFun) {
    DefinitionNameError.check(prefix);
    for (let r of Object.keys(this.#rules))
      if (r.startsWith(prefix) || prefix.startsWith(r))
        throw new DefinitionError(`rule/rule conflict: trying to add '${prefix}' when '${r}' exists.`);
    for (let fullname2 of Object.keys(this.#definitions))
      if (fullname2.startsWith(prefix))
        throw new DefinitionError(`rule/name conflict: trying to add '${prefix}' when '${fullname2}' exists.`);
    this.#rules[prefix] = FunFun;
    FunFun instanceof Promise && FunFun.then((newFunFun) => this.#rules[prefix] = newFunFun).catch((err) => this.#rules[prefix] = new AsyncDefinitionError(err, null, prefix));
  }
  define(fullname2, Def) {
    DefinitionNameError.check(fullname2);
    if (fullname2 in this.#definitions)
      throw new DefinitionError(`name/name conflict: '${fullname2}' already exists.`);
    for (let r of Object.keys(this.#rules))
      if (fullname2.startsWith(r))
        throw new DefinitionError(`name/rule conflict: trying to add '${fullname2}' when rule '${r}' exists.`);
    this.#definitions[fullname2] = Def;
    Def instanceof Promise && Def.then((newDef) => this.#definitions[fullname2] = newDef).catch((err) => this.#definitions[fullname2] = new AsyncDefinitionError(err, fullname2));
  }
  #processRule(fullname2, rule, FunFun) {
    if (FunFun instanceof Promise)
      return this.#definitions[fullname2] = FunFun.then((newFunFun) => (FunFun = newFunFun)(fullname2)).catch((err) => new AsyncDefinitionError(err, null, rule, null)).then((newDef) => this.#definitions[fullname2] = newDef).catch((err) => this.#definitions[fullname2] = new AsyncDefinitionError(err, fullname2, rule, FunFun));
    try {
      if (FunFun instanceof Error)
        throw FunFun;
      const Def = this.#definitions[fullname2] = FunFun(fullname2);
      Def instanceof Promise && Def.then((newDef) => this.#definitions[fullname2] = newDef).catch((err) => this.#definitions[fullname2] = new AsyncDefinitionError(err, fullname2, rule, FunFun));
      return Def;
    } catch (err) {
      return this.#definitions[fullname2] = new DefinitionError(err, fullname2, rule, FunFun);
    }
  }
  #checkViaRule(fullname2) {
    for (let [rule, FunFun] of Object.entries(this.#rules))
      if (fullname2.startsWith(rule))
        return this.#processRule(fullname2, rule, FunFun);
  }
  get(fullname2) {
    return this.#definitions[fullname2] || this.#checkViaRule(fullname2);
  }
};
var UnknownDefinition = class extends Promise {
  static make(attr) {
    let resolve, reject;
    const promise = new UnknownDefinition((a, b) => {
      resolve = a;
      reject = b;
    });
    return Object.assign(promise, { resolve, reject, attr });
  }
};
var PromiseMap = class {
  unknowns = {};
  #interval;
  make(fullname2, attr) {
    const p = UnknownDefinition.make(attr);
    (this.unknowns[fullname2] ??= []).push(p);
    p.catch((_) => this.remove(fullname2, p));
    this.#interval || this.#cleanLoop();
    return p;
  }
  async #cleanLoop() {
    this.#interval = true;
    while (true) {
      await new Promise((r) => setTimeout(r, 1e4));
      const all = Object.entries(this.unknowns);
      if (!all.length)
        return this.#interval = false;
      for (let [fullname2, promises] of all)
        for (let p of promises.filter((p2) => !p2.attr.isConnected))
          this.remove(fullname2, p);
    }
  }
  remove(fullname2, p) {
    const promises = this.unknowns[fullname2];
    if (!promises)
      return;
    const i = promises.indexOf(p);
    if (i < 0)
      return;
    promises.splice(i, 1);
    !promises.length && delete this.unknowns[fullname2];
  }
  complete(fullname2) {
    const promises = this.unknowns[fullname2];
    delete this.unknowns[fullname2];
    for (let p of promises || [])
      try {
        p.resolve();
      } catch (_) {
      }
  }
  completeRule(rule) {
    for (let fullname2 in this.unknowns)
      if (fullname2.startsWith(rule))
        this.complete(fullname2);
  }
};
var UnknownDefinitionsMap = class extends DefinitionsMap {
  #unknowns = new PromiseMap();
  define(fullname2, Def) {
    super.define(fullname2, Def);
    this.#unknowns.complete(fullname2);
  }
  defineRule(rule, FunClass) {
    super.defineRule(rule, FunClass);
    this.#unknowns.completeRule(rule);
  }
  //todo add attr
  get(fullname2, attr) {
    return super.get(fullname2) ?? this.#unknowns.make(fullname2, attr);
  }
};
var DefinitionsMapLock = class extends UnknownDefinitionsMap {
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
};
var DefinitionsMapDOM = class extends DefinitionsMapLock {
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
};
var DefinitionsMapDOMOverride = class extends DefinitionsMapDOM {
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
};
function TriggerSyntaxCheck(DefMap) {
  return class TriggerMap extends DefMap {
    defineRule(prefix, FunFun) {
      TriggerNameError.check(prefix);
      super.defineRule(prefix, FunFun);
    }
    define(fullname2, Def) {
      TriggerNameError.check(fullname2);
      super.define(fullname2, Def);
    }
  };
}
Object.defineProperties(Document.prototype, {
  Reactions: {
    get: function() {
      const map = new UnknownDefinitionsMap();
      Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
      return map;
    }
  },
  Triggers: {
    configurable: true,
    get: function() {
      const TriggerMap = TriggerSyntaxCheck(UnknownDefinitionsMap);
      const map = new TriggerMap();
      Object.defineProperty(this, "Triggers", { value: map, enumerable: true });
      return map;
    }
  }
});
Object.defineProperties(ShadowRoot.prototype, {
  Reactions: {
    configurable: true,
    get: function() {
      const map = new DefinitionsMapDOMOverride(this, "Reactions");
      Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
      return map;
    }
  },
  Triggers: {
    configurable: true,
    get: function() {
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
  UnknownDefinition
});

// src/dd/4_eventLoop_v2.js
var attachShadowOG = HTMLElement.prototype.attachShadow;
HTMLElement.prototype.attachShadow = function attachShadowforceModeOpen(...args) {
  (args[0] ??= {}).mode = "open";
  return attachShadowOG.apply(this, args);
};
Event.data = Symbol("Event data");
var EventLoopError = class extends DoubleDots.DoubleDotsError {
};
DoubleDots.EventLoopError = EventLoopError;
var MicroFrame = class {
  #i = 0;
  #names;
  #inputs;
  #outputs;
  constructor(event, at) {
    this.at = at;
    this.event = event;
    this.#names = this.at.reactions;
    this.#inputs = [event[Event.data] ?? event];
    this.#outputs = [];
  }
  isConnected() {
    return this.at.isConnected();
  }
  getReaction() {
    return this.#i < this.#names.length ? this.#names[this.#i] : void 0;
  }
  getReactionIndex() {
    return this.#i < this.#names.length ? this.#i : -1;
  }
  nextReaction() {
    return this.getReaction();
  }
  /**
   * @returns <undefined> when the task is emptied, or is awaiting in async mode, 
   * which both means that the event loop can continue.
   * @returns <this> current task when the task is not emptied 
   * and we must wait for it in sync mode.
   */
  run(threadMode = false) {
    for (let re = this.getReaction(); re !== void 0; re = this.nextReaction()) {
      if (re === "") {
        threadMode = true;
        this.#runSuccess(this.#inputs[this.#i]);
        continue;
      }
      if (re.startsWith("catch"))
        continue;
      try {
        if (!this.at.isConnected)
          throw new EventLoopError("Disconnected: " + this.at);
        const func = this.at.getRootNode().Reactions.get(re, this.at);
        if (func instanceof Error)
          throw func;
        if (func instanceof Promise) {
          if (threadMode) {
            func.then((_) => __eventLoop.asyncContinue(this));
            return;
          } else if (func instanceof DoubleDots.UnknownDefinition) {
            return this.#runError(new EventLoopError("Reaction not found: " + re));
          } else {
            func.then((_) => __eventLoop.syncContinue());
            return this;
          }
        }
        const res = this.#outputs[this.#i] = func.apply(this.at, this.#inputs.slice().reverse());
        if (res instanceof Promise) {
          if (threadMode) {
            res.then((oi) => this.#runSuccess(oi)).catch((error) => this.#runError(error)).finally((_) => __eventLoop.asyncContinue(this));
            return;
          } else {
            res.then((oi) => this.#runSuccess(oi)).catch((error) => this.#runError(error)).finally((_) => __eventLoop.syncContinue());
            return this;
          }
        }
        this.#runSuccess(res);
      } catch (error) {
        this.#runError(error);
      }
    }
  }
  #runError(error) {
    console.error(error);
    this.#outputs[this.#i] = error;
    const catchKebab = "catch_" + error.constructor.name.replace(/[A-Z]/g, "-$&").toLowerCase();
    for (this.#i++; this.#i < this.#names.length; this.#i++)
      if (this.#names[this.#i] === "catch" || this.#names[this.#i] === catchKebab)
        return;
    const target = this.at.isConnected ? this.at.ownerElement : document.documentElement;
    target.dispatchEvent(new ErrorEvent("error", { error }));
  }
  #runSuccess(res) {
    this.#outputs[this.#i] = res;
    if (res === EventLoop.Break) {
      this.#i = this.#names.length;
    } else if (res instanceof EventLoop.ReactionJump) {
      const next = this.#i + res.value;
      this.#inputs[next] = this.#inputs[this.#i];
      this.#i = next;
    } else {
      const next = this.#i + 1;
      this.#inputs[next] = res;
      this.#i = next;
    }
  }
};
var __EventLoop = class {
  #stack = [];
  #started = [];
  task;
  syncContinue() {
    if (!(this.task = this.task.run()))
      this.loop();
  }
  asyncContinue(task) {
    (this.task = task).run(true);
  }
  loop() {
    while (this.#stack[0]) {
      const { event, iterator } = this.#stack[0];
      for (let attr of iterator) {
        this.task = new MicroFrame(event, attr);
        this.#started.push(this.task);
        if (this.task = this.task.run())
          return;
      }
      this.#stack.shift();
    }
  }
  batch(event, iterable) {
    const iterator = iterable[Symbol.iterator]();
    if (this.#stack.push({ event, iterator }) === 1)
      this.loop();
  }
};
__eventLoop = new __EventLoop();
var _a;
window.EventLoop = (_a = class {
  //todo freeze the ReactionOrigin, SpreadReaction, ReactionJump, Break.
  get event() {
    return __eventLoop.task?.event;
  }
  get attribute() {
    return __eventLoop.task?.at;
  }
  get reaction() {
    return __eventLoop.task?.getReaction();
  }
  get reactionIndex() {
    return __eventLoop.task?.getReactionIndex();
  }
  dispatch(event, attr) {
    __eventLoop.batch(event, [attr]);
  }
  //todo rename to propagate
  dispatchBatch(event, iterable) {
    __eventLoop.batch(event, iterable);
  }
}, __publicField(_a, "ReactionJump", class ReactionJump {
  constructor(n) {
    n = parseInt(n);
    if (!n || isNaN(n))
      throw new DoubleDotsErrorEvent("ReactionJump must be done using a positive or negative integer.");
    this.value = n;
  }
}), __publicField(_a, "Break", {}), __publicField(_a, "ReactionOrigin", class ReactionOrigin {
  constructor(obj) {
    if (!obj || !(obj instanceof Object))
      throw new DoubleDotsErrorEvent("ReactionOrigin must be an object not null.");
    this.value = obj;
  }
}), __publicField(_a, "SpreadReaction", function(fun) {
  return function SpreadReaction(oi) {
    return oi instanceof Iterable ? fun.call(this, ...oi) : fun.call(this, oi);
  };
}), _a);
Object.defineProperty(window, "eventLoop", { value: new EventLoop() });

// src/dd/5_load_DoubleDots.js
var Specializers = {
  cloneNode: [Node.prototype, DocumentFragment.prototype],
  innerHTML: [Element.prototype, HTMLTemplateElement.prototype],
  insertAdjacentHTML: [Element.prototype, HTMLTemplateElement.prototype]
};
for (let [m, [TOP, DOWN]] of Object.entries(Specializers))
  Object.defineProperty(DOWN, m, Object.getOwnPropertyDescriptor(TOP, m));
function monkeyPatchSetter(proto, prop, fun) {
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  desc.set = fun;
  Object.defineProperty(proto, prop, desc);
}
function monkeyPatch(proto, prop, fun) {
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  desc.value = fun;
  Object.defineProperty(proto, prop, desc);
}
(function(Element_p, ShadowRoot_p) {
  const Element_innerHTML_OG = Object.getOwnPropertyDescriptor(Element_p, "innerHTML").set;
  const innerHTML_DD_el = function innerHTML_DD(val) {
    Element_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(...this.children);
  };
  const ShadowRoot_innerHTML_OG = Object.getOwnPropertyDescriptor(ShadowRoot_p, "innerHTML").set;
  const innerHTML_DD_sr = function innerHTML_DD(val) {
    ShadowRoot_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(...this.children);
  };
  const insertAdjacentHTMLOG = Element_p.insertAdjacentHTML;
  function insertAdjacentHTML_DD(position, ...args) {
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
    if (name.startsWith("override-"))
      throw new SyntaxError("You can only set [override-xyz] attributes on elements in HTML template: " + name);
    if (!name.includes(":"))
      return setAttributeOG.call(this, name, value);
    let at = getAttributeNodeOG.call(this, name);
    if (at) {
      at.value !== value && (at.value = value);
      return;
    }
    setAttributeOG.call(this, name, value);
    at = getAttributeNodeOG.call(this, name);
    AttrCustom.upgrade(at);
  }
  monkeyPatchSetter(Element_p, "innerHTML", innerHTML_DD_el);
  monkeyPatchSetter(ShadowRoot_p, "innerHTML", innerHTML_DD_sr);
  monkeyPatch(Element_p, "insertAdjacentHTML", insertAdjacentHTML_DD);
  monkeyPatch(Element_p, "setAttribute", setAttribute_DD);
})(Element.prototype, ShadowRoot.prototype);
(function() {
  function checkRoot(root, child, r = root.getRootNode(), cr = child?.getRootNode()) {
    if (!(child instanceof Element) || cr === r || cr instanceof DocumentFragment && r instanceof DocumentFragment)
      return false;
    if (root.isConnected && cr instanceof DocumentFragment)
      return true;
    throw new DoubleDots.InsertElementFromJSError(root, child);
  }
  const EMPTY = [];
  function sameRootFirstArg(child) {
    return checkRoot(this, child) ? [child] : EMPTY;
  }
  function sameRootSecond(_, child) {
    return checkRoot(this, child) ? [child] : EMPTY;
  }
  function sameRootSpreadArg(...args) {
    const r = this.getRootNode();
    return args.filter((child) => checkRoot(this, child, r));
  }
  const Mask = {
    "Comment.prototype": {
      after: sameRootSpreadArg,
      before: sameRootSpreadArg,
      insertBefore: sameRootFirstArg
    },
    "Text.prototype": {
      after: sameRootSpreadArg,
      before: sameRootSpreadArg,
      insertBefore: sameRootFirstArg
    },
    "Element.prototype": {
      //replaceChild
      after: sameRootSpreadArg,
      before: sameRootSpreadArg,
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,
      insertAdjacentElement: sameRootSecond
    },
    "Document.prototype": {
      //replaceChild
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg
    },
    "DocumentFragment.prototype": {
      //replaceChild
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg
    }
  };
  function monkeyPatch2(proto, prop, value) {
    Object.defineProperty(proto, prop, {
      ...Object.getOwnPropertyDescriptor(proto, prop),
      value
    });
  }
  function verifyAndUpgrade(OG, verify) {
    return function(...args) {
      const upgrades = verify.call(this, ...args);
      const res = OG.apply(this, args);
      upgrades.length && AttrCustom.upgradeBranch(...upgrades);
      return res;
    };
  }
  for (let [path, objMask] of Object.entries(Mask)) {
    path = path.split(".");
    const obj = path.reduce((o, p) => o[p], window);
    const nativeObj = path.reduce((o, p) => o[p] ??= {}, DoubleDots.nativeMethods);
    for (let [prop, verifyMethod] of Object.entries(objMask)) {
      const OG = nativeObj[prop] = obj[prop];
      const newFunc = verifyAndUpgrade(OG, verifyMethod);
      monkeyPatch2(obj, prop, newFunc);
    }
  }
})();

// x/define/v1.js
async function loadDef(url, lookup) {
  const module = await import(url);
  if (!module || typeof module !== "object" && !(module instanceof Object))
    throw new TypeError(`URL is not an es6 module: ${this.url}`);
  const def = module[lookup];
  if (def)
    return def;
  for (let [k, v] of Object.entries(module))
    if (k.startsWith("dynamic")) {
      if (v[lookup])
        return v[lookup];
    }
  throw new TypeError(`ES6 module doesn't contain resource: ${lookup}`);
}
function* parse(url) {
  const hashSearch = (url.hash || url.search).slice(1);
  if (!hashSearch)
    throw DoubleDots.SyntaxError("Missing DoubleDots.Reference in url: " + url);
  const refs = hashSearch.entries?.() ?? hashSearch.split("&").map((s) => s.split("="));
  for (let [name, value] of refs)
    yield* parseEntities(name, value);
}
function* parseEntities(key, value) {
  const m = key.match(
    /^([_.-]*)(?:([A-Z]{2}[A-Z0-9_.-]*)|([a-z][a-zA-Z0-9_.-]*)|([A-Z][a-zA-Z0-9_.-]*))(~)?(~)?([_.-])?$/
  );
  if (!m)
    throw new SyntaxError("bad name in doubleDots url definition: " + key + "=" + value);
  let [, pFix, portal, reaction, trigger, rule, square, _] = m;
  rule = rule ? "defineRule" : "define";
  if (reaction || trigger) {
    const type = trigger ? "Triggers" : "Reactions";
    fullname = pFix + DoubleDots.pascalToKebab(reaction || trigger.replace(/[A-Z]/, (c) => c.toLowerCase()));
    value ||= reaction || trigger;
    yield { type, fullname, rule, value };
  } else if (portal) {
    portal = portal.toLowerCase().replaceAll(/_[a-z]/g, (m2) => m2[1].toUpperCase());
    reaction = pFix + portal;
    let rValue = value ? value[0].toLowerCase() + value.slice(1) : reaction;
    fullname = pFix + DoubleDots.pascalToKebab(reaction.replace(/[A-Z]/, (c) => c.toLowerCase()));
    portal = portal.replace(/[a-z]/, (m2) => m2.toUpperCase());
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
}
function define() {
  const src = this.ownerElement.getAttribute("src");
  const base = src ? new URL(src, location) : location;
  defineImpl(new URL(this.value, base), this.ownerDocument);
}
document.Reactions.define("define", define);

// x/template/v1.js
(function() {
  const ElAppendOG = DoubleDots.nativeMethods.Element.prototype.append;
  const DocfragAppendOG = DoubleDots.nativeMethods.DocumentFragment.prototype.append;
  const CommentAfterOG = DoubleDots.nativeMethods.Comment.prototype.after;
  function subsumeNodes(el) {
    const t = document.createElement("template");
    DocfragAppendOG.call(t.content, ...el.childNodes);
    ElAppendOG.call(el, t);
    return t;
  }
  function subsumeHtml(el) {
    el.innerHTML = `<template>${el.innerHTML}</template>`;
    return el.children[0];
  }
  function absorbNodes(before, nodes) {
    const t = document.createElement("template");
    DocfragAppendOG.call(t.content, ...nodes);
    CommentAfterOG.call(before, t);
  }
  function absorbHtml(before, nodes) {
    const txt = nodes.map((n) => n.outerHTML ?? n instanceof Comment ? `<!--${n.textContent}-->` : n.textContent);
    nodes.forEach((n) => n.remove());
    before.insertAdjacentHTML("afterend", `<template>${txt.join("")}</template>`);
  }
  const usedEnds = /* @__PURE__ */ new WeakSet();
  function gobble(n) {
    let txt = n.textContent.trim();
    if (!txt.match(/^template(\s|)/))
      return;
    const res = [];
    while (n = n.nextSibling) {
      if (n instanceof Comment && !usedEnds.has(n)) {
        if ((txt = n.textContent.trim()).match(/^\/template(\s|)/)) {
          usedEnds.add(n);
          break;
        }
      }
      res.push(n);
    }
    return res;
  }
  function descendantsReverse(root, trigger) {
    const it = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
    const elements = [], attributes = [];
    for (let n; n = it.nextNode(); ) {
      for (let a of n.attributes)
        if (a.name.startsWith(trigger)) {
          attributes.push(a);
          elements.unshift(n);
          break;
        }
    }
    return { elements, attributes };
  }
  function commentsRightToLeft(docFrag) {
    const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_COMMENT);
    let res = [];
    for (let n; n = it.nextNode(); )
      res.unshift(n);
    return res;
  }
  class Template extends AttrCustom {
    upgrade(dynamic) {
      const el = this.ownerElement;
      if (el.childNodes.length === 0 || el.children.length === 1 && el.children[0] instanceof HTMLTemplateElement)
        return;
      if (el instanceof HTMLTemplateElement)
        throw new Error("template trigger cannot be applied to template elements.");
      const subsume = dynamic ? subsumeHtml : subsumeNodes;
      const absorb = dynamic ? absorbHtml : absorbNodes;
      const { elements, attributes } = descendantsReverse(el, this.trigger + ":");
      const templates = elements.map(subsume);
      let gobbledNodes;
      for (let t of templates)
        for (let comment of commentsRightToLeft(t.content))
          if (gobbledNodes = gobble(comment))
            absorb(comment, gobbledNodes);
    }
  }
  document.Triggers.define("template", Template);
  function template() {
    return this.ownerElement.children[0];
  }
  document.Reactions.define("template", template);
})();

// src/dd/6_run_DoubleDots.js
(function(aelOG) {
  if (document.readyState !== "loading")
    return AttrCustom.upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", (_) => AttrCustom.upgradeBranch(document.documentElement));
})(EventTarget.prototype.addEventListener);
//# sourceMappingURL=dd.js.map
