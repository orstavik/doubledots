// src/dd/1_DoubleDots.js
var OG = {};
function monkeyPatch(path, valueOrSet, get) {
  const dots = path.split(".");
  const prop = dots.pop();
  const proto = dots.reduce((o, p) => o[p], window);
  let desc = Object.getOwnPropertyDescriptor(proto, prop);
  if (!desc) {
    for (let p = Object.getPrototypeOf(proto); p; p = Object.getPrototypeOf(p))
      if (desc = Object.getOwnPropertyDescriptor(p, prop))
        break;
  }
  const key = desc.value ? "value" : "set";
  OG[path] ??= desc[key];
  desc[key] = valueOrSet;
  get && key === "set" && (desc.get = get);
  Object.defineProperty(proto, prop, desc);
}
function nativeMethods(path) {
  return OG[path] ?? path.split(".").reduce((o, p) => o[p], window);
}
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
var AttrWeakSet = class _AttrWeakSet extends Set {
  static #bigSet = /* @__PURE__ */ new Set();
  //wr => AttrWeakSet
  static #key;
  static GC = 1e4;
  static gc() {
    let active, l;
    for (let wr of _AttrWeakSet.#bigSet) {
      if (l = wr.deref())
        for (let a of l)
          a.isConnected ? active = true : (l.delete(a), a.remove());
      else
        _AttrWeakSet.#bigSet.delete(wr);
    }
    !active && (_AttrWeakSet.#key = clearInterval(_AttrWeakSet.#key));
  }
  constructor(...args) {
    super(...args);
    _AttrWeakSet.#bigSet.add(new WeakRef(this));
  }
  add(at) {
    _AttrWeakSet.#key ??= si(_AttrWeakSet.gc, _AttrWeakSet.GC);
    super.add(at);
  }
};
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
var ThisArrowFunctionError = class _ThisArrowFunctionError extends DoubleDotsError {
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
      throw new _ThisArrowFunctionError(Definition);
  }
};
window.DoubleDots = {
  nativeMethods,
  monkeyPatch,
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
var AttrCustom2 = class _AttrCustom extends Attr {
  // Interface
  // set value(newValue) { const oldValue = super.value; super.value = newValue; ... }
  // upgrade(){ super.upgrade(); ... }
  // remove(){ ...; super.remove() }
  static #makeRT(at) {
    let [trigger, ...reactions] = at.name.split(":");
    reactions.length === 1 && !reactions[0] && reactions.pop();
    Object.defineProperties(at, {
      "trigger": { value: trigger, enumerable: true },
      "reactions": { value: Object.freeze(reactions), enumerable: true }
    });
  }
  toJSON() {
    const { id, trigger, reactions, value, initDocument } = this;
    return { id, trigger, reactions, value, initDocument };
  }
  get trigger() {
    return _AttrCustom.#makeRT(this), this.trigger;
  }
  get reactions() {
    return _AttrCustom.#makeRT(this), this.reactions;
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
      _AttrCustom.upgrade(at);
    for (let c of el.children)
      this.upgradeElementRoot(c);
  }
  static #ids = 0;
  static errorMap = /* @__PURE__ */ new Map();
  static upgrade(at, Def) {
    try {
      Def ??= at.ownerElement.getRootNode().Triggers?.get(at.name.split(":")[0], at);
      if (Def instanceof Promise) {
        Object.setPrototypeOf(at, AttrUnknown.prototype);
        Def.then((Def2) => _AttrCustom.upgrade(at, Def2)).catch((err) => {
          _AttrCustom.errorMap.set(at, err);
          throw err;
        });
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
      _AttrCustom.errorMap.set(at, err);
      throw err;
    }
  }
};
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
var TriggerNameError = class _TriggerNameError extends DefinitionError {
  constructor(fullname2) {
    super(`Trigger name/prefix must begin with english letter or '_'.
${fullname2} begins with '${fullname2[0]}'.`);
  }
  static check(name) {
    if (!name.match(/[a-z_].*/))
      throw new _TriggerNameError(name);
  }
};
var DefinitionNameError = class _DefinitionNameError extends DefinitionError {
  constructor(name) {
    super(`DoubleDots definition names and rule prefixes can only contain /^[a-z0-9_.-]*$/: ${name}`);
  }
  static check(name) {
    if (!name.match(/^[a-z0-9_\.-]*$/))
      throw new _DefinitionNameError(name);
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
    DefinitionNameError.check(prefix);
    for (let r of Object.keys(this.#rules))
      if (r.startsWith(prefix) || prefix.startsWith(r))
        throw new DefinitionError(`rule/rule conflict: trying to add '${prefix}' when '${r}' exists.`);
    for (let fullname2 of Object.keys(this.#definitions))
      if (fullname2.startsWith(prefix))
        throw new DefinitionError(`rule/name conflict: trying to add '${prefix}' when '${fullname2}' exists.`);
    this.#setRule(prefix, FunFun);
    FunFun instanceof Promise && FunFun.then((newFunFun) => this.#setRule(prefix, newFunFun)).catch((err) => this.#setRule(prefix, new AsyncDefinitionError(err, null, prefix)));
  }
  define(fullname2, Def) {
    DefinitionNameError.check(fullname2);
    if (fullname2 in this.#definitions)
      throw new DefinitionError(`name/name conflict: '${fullname2}' already exists.`);
    for (let r of Object.keys(this.#rules))
      if (fullname2.startsWith(r))
        throw new DefinitionError(`name/rule conflict: trying to add '${fullname2}' when rule '${r}' exists.`);
    this.#setDef(fullname2, Def);
    Def instanceof Promise && Def.then((newDef) => this.#setDef(fullname2, newDef)).catch((err) => this.#setDef(fullname2, new AsyncDefinitionError(err, fullname2)));
  }
  #processRule(fullname2, rule, FunFun) {
    if (FunFun instanceof Promise)
      return this.#definitions[fullname2] = FunFun.then((newFunFun) => (FunFun = newFunFun)(fullname2)).catch((err) => new AsyncDefinitionError(err, null, rule, null)).then((newDef) => this.#setDef(fullname2, newDef)).catch((err) => this.#setDef(fullname2, new AsyncDefinitionError(err, fullname2, rule, FunFun)));
    try {
      if (FunFun instanceof Error)
        throw FunFun;
      const Def = this.#setDef(fullname2, FunFun(fullname2));
      Def instanceof Promise && Def.then((newDef) => this.#setDef(fullname2, newDef)).catch((err) => this.#setDef(fullname2, new AsyncDefinitionError(err, fullname2, rule, FunFun)));
      return Def;
    } catch (err) {
      throw this.#setDef(fullname2, new DefinitionError(err, fullname2, rule, FunFun));
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
var UnknownDefinition = class _UnknownDefinition extends Promise {
  static make(attr) {
    let resolve, reject;
    const promise = new _UnknownDefinition((a, b) => {
      resolve = a;
      reject = b;
    });
    return Object.assign(promise, { resolve, reject, attr });
  }
};
var setTimeoutOG = setTimeout;
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
      await new Promise((r) => setTimeoutOG(r, 1e4));
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
var DefinitionsMapLock = class extends DefinitionsMap {
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
};
var DefinitionsMapDOM = class extends DefinitionsMapLock {
  get parentMap() {
    return this.root.host?.getRootNode()?.[this.type];
  }
  get(name, attr) {
    return super.get(name, attr) ?? this.parentMap.get(name, attr);
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
    if (this.#rule !== void 0)
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
      const map = new UnknownDefinitionsMap(this, "Reactions");
      Object.defineProperty(this, "Reactions", { value: map, enumerable: true });
      return map;
    }
  },
  Triggers: {
    configurable: true,
    get: function() {
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
Event.data = Symbol("Event data");
var EventLoopError = class extends DoubleDots.DoubleDotsError {
};
var MicroFrame = class {
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
    for (let re = this.getReaction(); re !== void 0; re = this.getReaction()) {
      if (re === "") {
        threadMode = true;
        this.#runSuccess(this.#inputs[0]);
        continue;
      }
      if (re.startsWith("catch"))
        continue;
      try {
        if (!this.at.isConnected)
          throw new EventLoopError("Disconnected: " + this.at);
        const func = this.at.initDocument.Reactions.get(re, this.at);
        if (func instanceof Promise) {
          if (threadMode) {
            func.then((_) => __eventLoop.asyncContinue(this)).catch((error) => this.#runError(error));
            return;
          } else if (func instanceof DoubleDots.UnknownDefinition) {
            return this.#runError(new EventLoopError("Reaction not defined: " + re));
          } else {
            func.then((_) => __eventLoop.syncContinue());
            return this;
          }
        }
        const res = func.apply(this.at, this.#inputs);
        this.#inputs.unshift(res);
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
      } finally {
      }
    }
  }
  #runError(error) {
    console.error(error);
    this.#inputs[0] = error;
    const catchKebab = "catch_" + error.constructor.name.replace(/[A-Z]/g, "-$&").toLowerCase();
    for (this.#i++; this.#i < this.at.reactions.length; this.#i++)
      if (this.at.reactions[this.#i] === "catch" || this.at.reactions[this.#i] === catchKebab)
        return;
    const target = this.at.isConnected ? this.at.ownerElement : document.documentElement;
    target.dispatchEvent(new ErrorEvent("error", { error }));
  }
  #runSuccess(res) {
    this.#inputs[0] = res;
    this.#i = res === EventLoop.Break ? this.at.reactions.length : this.#i + 1;
  }
};
var __EventLoop = class {
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
};
globalThis.__eventLoop = new __EventLoop();
var EventLoop = class {
  static Break = {};
  static SpreadReaction = function(fun) {
    return function SpreadReaction(oi) {
      return oi instanceof Iterable ? fun.call(this, ...oi) : fun.call(this, oi);
    };
  };
  //todo freeze the SpreadReaction, Break.
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
    return __eventLoop.task?.getReactionIndex() ?? -1;
  }
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

// src/dd/5_load_DoubleDots.js
var Specializers = {
  "DocumentFragment.prototype.cloneNode": Node.prototype.cloneNode,
  "HTMLTemplateElement.prototype.insertAdjacentHTML": Element.prototype.insertAdjacentHTML,
  "HTMLTemplateElement.prototype.innerHTML": Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML").set
};
for (let [path, superior] of Object.entries(Specializers))
  monkeyPatch(path, superior);
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
  const setAttributeOG2 = Element_p.setAttribute;
  const getAttributeNodeOG = Element_p.getAttributeNode;
  function setAttribute_DD(name, value) {
    if (name.startsWith("override-"))
      throw new SyntaxError("You can only set [override-xyz] attributes on elements in HTML template: " + name);
    let at = getAttributeNodeOG.call(this, name);
    if (at) {
      at.value !== value && (at.value = value);
      return;
    }
    setAttributeOG2.call(this, name, value);
    at = getAttributeNodeOG.call(this, name);
    AttrCustom.upgrade(at);
  }
  const mainOverrides = {
    "Element.prototype.innerHTML": innerHTML_DD_el,
    "ShadowRoot.prototype.innerHTML": innerHTML_DD_sr,
    "Element.prototype.insertAdjacentHTML": insertAdjacentHTML_DD,
    "Element.prototype.setAttribute": setAttribute_DD
  };
  for (let [path, func] of Object.entries(mainOverrides))
    monkeyPatch(path, func);
})(Element.prototype, ShadowRoot.prototype);
(function() {
  const EMPTY = [];
  function checkRoot(root, child, r = root.getRootNode(), cr = child?.getRootNode()) {
    if (root.isConnected && child instanceof DocumentFragment)
      return [...child.children];
    if (root.isConnected && child instanceof Element && cr instanceof DocumentFragment)
      return [child];
    if (!(child instanceof Element) || cr === r || cr instanceof DocumentFragment && r instanceof DocumentFragment)
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
    return args.map((child) => checkRoot(this, child, r)).flat();
  }
  function verifyAndUpgrade(OG2, verify) {
    return function(...args) {
      const upgrades = verify.call(this, ...args);
      const res = OG2.apply(this, args);
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
    "DocumentFragment.prototype.prepend": sameRootSpreadArg
    //replaceChild
  };
  for (let [path, verify] of Object.entries(Mask))
    monkeyPatch(
      path,
      verifyAndUpgrade(path.split(".").reduce((o, p) => o[p], window), verify)
    );
})();
function loadDoubleDots(aelOG) {
  if (document.readyState !== "loading")
    return AttrCustom.upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", (_) => AttrCustom.upgradeBranch(document.documentElement));
}

// x/define/v1.js
async function loadDef(url, lookup) {
  const module = await import(url);
  if (!module || typeof module !== "object" && !(module instanceof Object))
    throw new TypeError(`URL is not an es6 module: ${this.url}`);
  const def = module[lookup];
  if (def) return def;
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

// x/template/v1.js
var ElAppendOG = DoubleDots.nativeMethods("Element.prototype.append");
var DocfragAppendOG = DoubleDots.nativeMethods("DocumentFragment.prototype.append");
var CommentAfterOG = DoubleDots.nativeMethods("Comment.prototype.after");
var cloneNodeOG = DoubleDots.nativeMethods("Node.prototype.cloneNode");
var docCreateElOG = DoubleDots.nativeMethods("Document.prototype.createElement");
var setAttributeOG = DoubleDots.nativeMethods("Element.prototype.setAttribute");
function setAttributes(el, txt) {
  const pieces = txt.split(/([_a-zA-Z][a-zA-Z0-9.:_-]*="[^"]*")/);
  pieces.forEach((unit, i) => {
    if (i % 2 === 1) {
      const [_, name, value] = unit.match(/^([_a-zA-Z][a-zA-Z0-9.:_-]*)="([^"]*)"$/);
      setAttributeOG.call(el, name, value);
    } else if (unit.trim() !== "") {
      throw new SyntaxError(`<!--<template ${txt}>--> has an incorrect name="value"`);
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
  for (let n = start; n = n.nextSibling; ) {
    if (n instanceof Comment && n.textContent.match(/^\s*<\/template\s*>\s*$/))
      return { start, nodes, txt, end: n };
    nodes.push(n);
  }
  return { start, nodes, txt };
}
function* templateTriggers(el, trigger) {
  for (let n, it = document.createNodeIterator(el, NodeFilter.SHOW_ELEMENT); n = it.nextNode(); )
    for (let a of n.attributes)
      if (a.name.startsWith(trigger)) {
        yield a;
        break;
      }
}
function* templateCommentStarts(root) {
  const it = document.createNodeIterator(root, NodeFilter.SHOW_COMMENT);
  for (let n; n = it.nextNode(); )
    if (n.textContent.match(/^\s*<template(.*)>\s*$/))
      yield n;
}
function hashDebug(el) {
  el = cloneNodeOG.call(el, true);
  for (let a of el.attributes)
    if (a.name.startsWith("template:"))
      el.removeAttribute(a.name);
  return `Replace the following element in your code:

${el.outerHTML}`;
}
var Template = class extends AttrCustom {
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
    DoubleDots.log?.("template: production tutorial", hashDebug(el));
  }
};
function template() {
  return this.ownerElement.children[0];
}

// x/wait/v1.js
function wait_(rule) {
  const [_, ms] = rule.split("_");
  return (arg) => new Promise((r) => setTimeout((_2) => r(arg), ms));
}

// src/dd/dd.js
document.Triggers.define("template", Template);
document.Reactions.define("template", template);
document.Reactions.define("define", define);
document.Reactions.defineRule("wait_", wait_);
document.Reactions.define(
  "prevent-default",
  (i) => (eventLoop.event.preventDefault(), i)
);
document.Reactions.define("log", function(...i) {
  console.log(this, ...i);
  return i[0];
});
document.Reactions.define("debugger", function(...i) {
  console.log(this, ...i);
  debugger;
  return i[0];
});
loadDoubleDots(EventTarget.prototype.addEventListener);
//# sourceMappingURL=dd.js.map
