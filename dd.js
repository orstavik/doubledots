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

  get isConnected() {
    return this.ownerElement?.isConnected;
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
    //the registers getters can never throw.
    Def ??= at.ownerElement.getRootNode().getTrigger(at.name.split(":")[0]);
    if (!Def) //assumes this is a regular attribute.
      return;
    if (Def instanceof Error)
      throw Def;
    if (Def.prototype instanceof Attr) {
      try {
        Object.setPrototypeOf(at, Def.prototype);
        Object.defineProperties(at, {
          "id": { value: this.#ids++, enumerable: true, configurable: false, writable: false },
          "initDocument": { value: at.getRootNode(), enumerable: true, configurable: false, writable: false }
        });
        DoubleDots.cube?.("attr", at);
        at.upgrade?.();
        at.value && (at.value = at.value);
      } catch (err) {
        AttrCustom.errorMap.set(at, err);
        throw err;
      }
    } else if (Def instanceof Promise) {
      Object.setPrototypeOf(at, AttrCustom.prototype);
      Def.then(Def => AttrCustom.upgrade(at, Def))
        .catch(err => AttrCustom.upgrade(at, err));
    }
  }
};
class AttrImmutable extends AttrCustom$1 {
  remove() { /* cannot be removed */ }
  //set value() { /* cannot be changed */ }
  //get value() { return super.value; }
}

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
  AttrImmutable,
  AttrMutation,
  AttrIntersection,
  AttrResize
});

function ddToJs(n) {
  return n.replace(/-[a-z]/g, m => m[1].toUpperCase()).replace(".", "$$").replace("-", "$_");
}

class DefinitionsMap {

  static checkName(name) {
    const portal = name.match(/^([a-z][a-z0-9]*)([a-z0-9_.-]*[^_.-])?$/);
    if (!portal)
      throw new SyntaxError(`Illegal reaction/trigger name: '${name}'.`);
    return portal[1];
  }

  #portals = {};
  #define(name, Def) {
    this.#portals[name] = Def;
    DoubleDots.cube?.("define", { name, Def });
    if (Def instanceof Promise)
      return Def.then(Def => this.#define(name, Def))
        .catch(err => this.#define(name, err));
  }

  define(name, Portal) {
    if (name in this.#portals)
      throw new ReferenceError(`Trying to redefine portal: ${name}.`);
    this.#define(name, Portal);
  }

  #cache = {};
  #tryPortal(fullname, portalName) {
    const Portal = this.#portals[portalName];
    if (!Portal) //accessed before definition will set as blank.
      return this.#cache[fullname] = this.#portals[portalName] = undefined;
    if (Portal instanceof Error)
      return this.#cache[fullname] = Portal;
    if (Portal instanceof Promise)
      return this.#cache[fullname] = (async _ => (await Portal, this.#tryPortal(fullname, portalName)))();

    //at this point we should have a working portal.
    //First, direct definition
    const jsName = ddToJs(fullname);
    let Def = Portal[jsName];
    if (Def instanceof Promise)
      return this.#cache[fullname] = (async _ => (await Portal, this.#tryPortal(fullname, portalName)))();
    if (Def)
      return this.#cache[fullname] = Def;

    //Second, try rule
    let ruleName = jsName.match(/^[a-z0-9]+(_|$$|$_)/);
    if (!ruleName)
      throw new ReferenceError(`Reaction/trigger '${fullname}' has no matching definition.`);
    ruleName = ruleName[0];
    const Rule = Portal[ruleName];
    if (!Rule)
      throw new ReferenceError(`Reaction/trigger '${fullname}' has no matching definition.`);
    if (Rule instanceof Error)
      return this.#cache[fullname] = Rule;
    if (Rule instanceof Promise)
      return this.#cache[fullname] = (async _ => (await Rule, this.#tryPortal(fullname, portalName)))();
    if (typeof Rule != "function")
      return this.#cache[fullname] = new TypeError(`Rule '${ruleName}' did not produce a function/Attr. typeof Rule: ${typeof Rule}. Portal: ${portalName}.`);
    try {
      Def = Rule(fullname);
      if (Def instanceof Promise)
        return this.#cache[fullname] =
          Def.then(Def => this.#cache[fullname] = Def)
            .catch(err => this.#cache[fullname] = err);
      return this.#cache[fullname] = Def;
    } catch (err) {
      return this.#cache[fullname] = err;
    }
  }

  getReaction(name) {
    if (name in this.#cache) return this.#cache[name];
    const portalName = DefinitionsMap.checkName(name);
    return this.#tryPortal(name, portalName);
  }

  getTrigger(name) {
    const trigger = "-" + name;
    if (trigger in this.#cache) return this.#cache[trigger];
    const portalName = DefinitionsMap.checkName(name);
    return this.#tryPortal(trigger, portalName);
  }
}

function ReactionThisInArrowCheck(DefMap) { //todo add this to Reaction maps?
  return class ReactionMapNoThisInArrow extends DefMap {
    define(fullname, Def) {
      DoubleDots.ThisArrowFunctionError.check(Def);
      super.define(fullname, Def);
    }
  };
}

const definitionsMap = new DefinitionsMap();
const dp = definitionsMap.define.bind(definitionsMap);
const gr = definitionsMap.getReaction.bind(definitionsMap);
const gt = definitionsMap.getTrigger.bind(definitionsMap);

Object.defineProperty(Document.prototype, "definePortal", { value: dp });
Object.defineProperty(Document.prototype, "getReaction", { value: gr });
Object.defineProperty(Document.prototype, "getTrigger", { value: gt });
Object.defineProperty(ShadowRoot.prototype, "definePortal", { value: dp });
Object.defineProperty(ShadowRoot.prototype, "getReaction", { value: gr });
Object.defineProperty(ShadowRoot.prototype, "getTrigger", { value: gt });

DoubleDots.DefinitionsMap = DefinitionsMap;

//Best practice: define before use. The limitation is that the call to define them *must* come before the first call to use them.
//1. For static defintions and use, just define all functions on top of the document, before use.
//   This can be checked by tooling up front.
//2. You can also dynamically define and use defintions and rules.
//   You only need to define the dynamically created methods before you add them as triggers in the document, 
//   or access them as reactions.
//
//* Note! Definitions can be loaded async! So you only need to specify from where you are going to get the definition,
//   you don't need the ready definition for it to work.

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

        const func = this.at.initDocument.getReaction(re, this.at);
        if (func instanceof Promise) {
          // if (threadMode) {
          //   func.then(_ => __eventLoop.asyncContinue(this))
          //     .catch(error => this.#runError(error));
          //   return; //continue outside loop
          // } else if (func instanceof DoubleDots.UnknownDefinition) {
          //   return this.#runError(new EventLoopError("Reaction not defined: " + re));
          //   //RulePromise, DefinitionPromise
          // } else {
          //   func.then(_ => __eventLoop.syncContinue());
          //   //todo these sync delays needs to have a max timeout.
          //   //todo thus, we need to have some max timers
          //   return this; //halt outside loop
          // }
          if (threadMode) {
            func.finally(_ => __eventLoop.asyncContinue(this));
            return;
          } else {
            func.finally(_ => __eventLoop.syncContinue());
            return this;
          }
        }

        if (func instanceof Error)
          throw func;

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

const setTimeoutOG = window.setTimeout;
//shim requestIdleCallback
(function () {
  window.requestIdleCallback ??= function (cb, { timeout = Infinity } = {}) {
    const callTime = performance.now();
    return setTimeoutOG(_ => {
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
      await new Promise(r => setTimeoutOG(r, 3000 / (dGrade.size + 1))); // i:100 => 30ms  /  i:1 => 3000ms
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

  function setAttribute_DD(og, name, value) {
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

function flipNV(dict, value, name) {
  const res = {};
  for (let [n, D] of Object.entries(dict))
    if (n.startsWith(value))
      res[name + value.slice(value.length)] = D;
  return res;
}

async function flipNameValue(module, name, value) {
  const { reactions, triggers } = await module;
  return {
    reactions: flipNV(reactions, value, name),
    triggers: flipNV(triggers, value, name)
  };
}

function define(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  module = import(src);
  for (let [name, value] of params.entries()) {
    const m = value ? flipNameValue(name, value, module) : module;
    try {
      this.ownerElement.getRootNode().definePortal(name, m);
    } catch (error) {
      console.warn(error);
    }
  }
}

async function makeRawModule(params, module) {
  const { reactions, triggers } = await module;
  const res = { reactions: {}, triggers: {} };
  for (let [name, value] of params.entries())
    name[0] === "~" ?
      res.triggers[name.slice(1)] = triggers[value] :
      res.reactions[name] = reactions[value];
  return res;
}

function defineRaw(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  module = import(src);
  this.ownerElement.getRootNode().definePortal(name, makeRawModule(params, module));
}

var define$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  define: define,
  defineRaw: defineRaw
});

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

var template = /*#__PURE__*/Object.freeze({
  __proto__: null,
  Template: Template
});

function wait_(rule) {
  const [_, ms] = rule.split("_");
  return arg => new Promise(r => setTimeout(_ => r(arg), ms));
}

var wait = /*#__PURE__*/Object.freeze({
  __proto__: null,
  wait_: wait_
});

//todo this should probably be Wait_ too
//Wait_100:do-something:at.repeat //which would enable us to have a set timeout

document.definePortal("i", {
  "I": class AttrEmpty extends AttrCustom {
    upgrade() { eventLoop.dispatch(new Event(this.trigger), this); }
  }
});

document.definePortal("template", template);
document.definePortal("define", define$1);
document.definePortal("wait", wait);
// document.definePortal("prevent-default", { reactions: {i => (eventLoop.event.preventDefault(), i)] });
document.definePortal("log", { log: function (...i) { console.log(this, ...i); return i[0]; } });
document.definePortal("debugger", { debugger: function (...i) { console.log(this, ...i); debugger; return i[0]; } });

loadDoubleDots(EventTarget.prototype.addEventListener);
//adding colors
//# sourceMappingURL=dd.js.map
