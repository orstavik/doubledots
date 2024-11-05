// x/state/v1.js
var StateAttrIterator = class {
  constructor(event, attrs2, dotPath, state2) {
    this.event = event;
    this.it = attrs2[Symbol.iterator]();
    this.branchChanged = dotPath;
    this.state = state2;
  }
  next() {
    for (let n = this.it.next(); !n.done; n = this.it.next()) {
      const at = n.value;
      const branches = at.constructor.branches;
      for (let observedBranch of branches)
        if (observedBranch.every((b, i) => b === this.branchChanged[i])) {
          this.event.state = branches.length > 1 ? this.state : observedBranch.reduce((o, p) => o?.[p], this.state);
          return { value: at, done: false };
        }
    }
    return { done: true };
  }
  [Symbol.iterator]() {
    return this;
  }
};
var attrs = new DoubleDots.AttrWeakSet();
var stateObj = {};
function setInObjectCreatePaths(obj, path, key, value) {
  for (let p of path)
    obj = obj[p] ??= {};
  obj[key] = value;
}
function setInObjectIfDifferent(obj, path, key, value) {
  const parent = path.reduce((o, p) => o?.[p], obj);
  if (JSON.stringify(parent?.[key]) === JSON.stringify(value))
    return false;
  setInObjectCreatePaths(obj, path, key, value);
  return true;
}
var State = class extends AttrCustom {
  upgrade() {
    attrs.add(this);
  }
  static get branches() {
    return [[]];
  }
};
function state(value) {
  if (JSON.stringify(state) === JSON.stringify(value))
    return;
  state = value;
  const e = new Event("state");
  const it = new StateAttrIterator(e, attrs, [], state);
  eventLoop.dispatchBatch(e, it);
}
function State_(rule) {
  let [name, ...branches] = rule.split("_");
  branches = branches.map((b) => b.split("."));
  return class State extends AttrCustom {
    upgrade() {
      attrs.add(this);
    }
    static get branches() {
      return branches;
    }
  };
}
function state_(rule) {
  let [name, branch] = rule.split("_");
  branch = branch.split(".");
  const key = branch[branch.length - 1];
  const path = branch.slice(0, -1);
  return function(value) {
    const change = setInObjectIfDifferent(stateObj, path, key, value);
    if (!change)
      return;
    const e = new Event(name);
    const it = new StateAttrIterator(e, attrs, branch, stateObj);
    eventLoop.dispatchBatch(e, it);
  };
}

// x/nav/v1.js
var triggers = new DoubleDots.AttrWeakSet();
var active;
var Nav = class extends AttrCustom {
  upgrade() {
    if (!active) {
      for (let e2 of ["click", "popstate"])
        document.documentElement.setAttribute(`${e2}:${this.trigger}`);
      active = true;
    }
    triggers.add(this);
    const e = Object.assign(new Event("nav"), { location });
    this.dispatchEvent(e);
  }
  remove() {
    triggers.delete(this);
  }
};
function nav(e) {
  if (!triggers.size) {
    for (let e3 of ["click", "popstate"])
      document.htmlElement.removeAttribute(`${e3}:${this.trigger}`);
    active = false;
    return;
  }
  if (e.defaultPrevented)
    return;
  if (e.type === "popstate") {
    e.preventDefault();
  } else if (e.type === "click") {
    const a = e.target.closest("a[href]");
    if (!a)
      return;
    history.pushState(null, null, a.href);
    e.preventDefault();
  }
  const e2 = Object.assign(new Event("nav"), { location });
  eventLoop.dispatchBatch(e2, [...triggers]);
}

// x/embrace/v1.js
var LoopCube = class {
  static compareSmall(old, now) {
    const exact = new Array(now.length);
    const unused = [];
    if (!old?.length)
      return { exact, unused };
    main:
      for (let o = 0; o < old.length; o++) {
        for (let n = 0; n < now.length; n++) {
          if (!exact[n] && old[o] === now[n]) {
            exact[n] = o;
            continue main;
          }
        }
        unused.push(o);
      }
    return { exact, unused };
  }
  constructor(embrace2) {
    this.embrace = embrace2;
    this.now = [];
    this.nowEmbraces = [];
  }
  step(now = []) {
    const old = this.now;
    const oldEmbraces = this.nowEmbraces;
    this.now = now;
    const { exact, unused } = LoopCube.compareSmall(old, now);
    const embraces = new Array(now.length);
    const changed = [];
    for (let n = 0; n < exact.length; n++) {
      const o = exact[n];
      if (o != null) {
        embraces[n] = oldEmbraces[o];
      } else {
        changed.push(n);
        embraces[n] = unused.length ? oldEmbraces[unused.pop()] : this.embrace.clone();
      }
    }
    this.nowEmbraces = embraces;
    const removes = unused.map((o) => oldEmbraces[o]);
    return { embraces, removes, changed };
  }
};
var EmbraceGet = class {
  constructor(param) {
    this.param = param;
  }
  get params() {
    return { [this.param]: this.param };
  }
  run(argsDict, dataIn, node, ancestor) {
    return argsDict[this.param];
  }
  static make(str) {
    return str.indexOf(" ") === -1 && new EmbraceGet(str);
  }
};
var EmbraceTextNode = class {
  constructor(segs) {
    !segs[0] && segs.shift();
    !segs[segs.length - 1] && segs.pop();
    this.segs = segs;
  }
  get params() {
    const res = {};
    for (let E of this.segs)
      if (E instanceof EmbraceGet)
        for (let param in E.params)
          res[param] = param;
    return res;
  }
  run(argsDict, dataIn, node, ancestor) {
    let txt = "";
    for (let s of this.segs)
      txt += typeof s == "string" ? s : s.run(argsDict, dataIn, node, ancestor);
    node.textContent = txt;
  }
  static make(txt) {
    const segs = txt.split(/{{([^}]+)}}/);
    if (segs.length === 1)
      return;
    for (let i = 1; i < segs.length; i += 2) {
      segs[i] = EmbraceGet.make(segs[i].trim()) ?? `{{${segs[i]}}}`;
      if (!(segs[i] instanceof EmbraceGet))
        console.error(`invalid embrace expression: ${segs[i]}`);
    }
    return new EmbraceTextNode(segs);
  }
};
var EmbraceCommentFor = class {
  constructor(templ, varName, listName) {
    this.template = templ;
    this.varName = varName;
    this.listName = listName;
    this.iName = `#${varName}`;
    templ.remove();
  }
  get params() {
    return { [this.listName]: this.listName };
  }
  run(argsDictionary, dataObject, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(EmbraceRoot.make(this.template));
    const now = argsDictionary[this.listName];
    const { embraces, removes, changed } = cube.step(now);
    for (let n of removes)
      for (let c of n.nodes)
        if (!(c instanceof Attr))
          c.remove();
    node.after(...embraces.map((e) => e.template));
    for (let i of changed) {
      dataObject[this.varName] = now[i];
      dataObject[this.iName] = i;
      embraces[i].run(Object.assign({}, argsDictionary), dataObject, void 0, ancestor);
    }
  }
  //naive, no nested control structures yet. no if. no switch. etc. , untested against errors.
  //startUpTime
  static make(txt, tmpl) {
    const ctrlFor = txt.match(/{{\s*for\s*\(\s*(let|const|var)\s+([^\s]+)\s+of\s+([^\s)]+)\)\s*}}/);
    if (ctrlFor) {
      const [_, constLetVar, varName, listName] = ctrlFor;
      return new EmbraceCommentFor(tmpl, varName, listName);
    }
  }
};
var EmbraceRoot = class {
  static flatDomNodesAll(docFrag) {
    const res = [];
    const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
    for (let n = it.nextNode(); n = it.nextNode(); ) {
      res.push(n);
      if (n instanceof Element)
        for (let a of n.attributes)
          res.push(a);
    }
    return res;
  }
  static paramDict(listOfExpressions) {
    const params = {};
    for (let e of listOfExpressions.filter(Boolean))
      for (let p in e.params)
        params[p] ??= p.split(".");
    return params;
  }
  static listOfExpressions(listOfNodes) {
    return listOfNodes.map((n) => {
      if (n instanceof Text || n instanceof Attr)
        return EmbraceTextNode.make(n.textContent);
      if (n instanceof Comment)
        return EmbraceCommentFor.make(n.textContent, n.nextSibling);
    });
  }
  constructor(docFrag) {
    this.template = docFrag;
    this.nodes = EmbraceRoot.flatDomNodesAll(docFrag);
  }
  clone() {
    const e = new EmbraceRoot(this.template.cloneNode(true));
    e.expressions = this.expressions;
    e.paramsDict = this.paramsDict;
    return e;
  }
  run(argsDictionary, dataObject, _, ancestor) {
    for (let param in this.paramsDict)
      argsDictionary[param] ??= this.paramsDict[param].reduce((o, p) => o?.[p], dataObject);
    for (let ex, n, i = 0; i < this.expressions.length; i++)
      if (ex = this.expressions[i]) {
        if (n = this.nodes[i]) {
          if (n instanceof Attr ? ancestor.contains(n.ownerElement) : ancestor.contains(n))
            ex.run(argsDictionary, dataObject, n, ancestor);
        }
      }
  }
  static make(template) {
    const e = new EmbraceRoot(template.content);
    e.expressions = EmbraceRoot.listOfExpressions(e.nodes);
    e.paramsDict = EmbraceRoot.paramDict(e.expressions);
    return e;
  }
};
function embrace(templ, dataObject) {
  if (!this.__embraceRoot) {
    this.__embraceRoot = EmbraceRoot.make(templ);
    this.ownerElement.append(this.__embraceRoot.template);
  }
  this.__embraceRoot.run({}, dataObject, 0, this.ownerElement);
}

// x/dotRule/dot.js
var scopes = {
  ".": "this.",
  "e.": "window.eventLoop.event.",
  "t.": "window.eventLoop.event.target.",
  "w.": "window.",
  "d.": "window.document.",
  // "i.": "args[0].",  //todo implement this instead of .oi
  // "i(0-9)+": "args[$1].",//todo implement this instead of .oi
  "oi.": "oi.",
  "at.": "window.eventLoop.attribute.",
  //useful when dash rules have moved the origin
  "el.": "window.eventLoop.attribute.ownerElement.",
  //todo same as this.ownerElement??
  "this.": "this.",
  "window.": "window.",
  "document.": "document."
};
function processRef(prop) {
  for (let prefix in scopes)
    if (prop.startsWith(prefix))
      return DoubleDots.kebabToPascal(scopes[prefix] + prop.slice(prefix.length));
}
var primitives = /^((-?\d+(\.\d+)?([eE][-+]?\d+)?)|this|window|document|i|e|true|false|undefined|null)$/;
function textToExp(txt) {
  let [prop, ...args] = txt.split("_");
  const ref = processRef(prop);
  args = args.map((arg) => processRef(arg) || primitives.test(arg) ? arg : `"${arg}"`);
  const sargs = args.join(", ");
  const setter = !args.length ? "" : args.length === 1 ? `=${sargs}` : `=[${sargs}]`;
  return `(${ref} instanceof Function ? ${ref}(${sargs}) : (${ref}${setter}))`;
}
function DotReactionRule(fullname) {
  const exp = textToExp(fullname);
  const code = `function dotReaction(oi) { return ${exp}; }`;
  return DoubleDots.importBasedEval(code);
}
function BreakOnFalseReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `function dotReaction(oi) { return ${exp} || EventLoop.break; }`;
  return DoubleDots.importBasedEval(code);
}
function BreakOnTrueReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `function dotReaction(oi) { return ${exp} && EventLoop.break; }`;
  return DoubleDots.importBasedEval(code);
}
function JumpReactionRule(fullname) {
  const n = parseInt(fullname.slice(2));
  if (!n || isNaN(n))
    throw new DoubleDots.SyntaxError("ReactionJump only accept positive and negative integers: " + fullname.slice(2));
  return DoubleDots.importBasedEval(`_ => new EventLoop.ReactionJump(${n})`);
}
var dynamicDots = {};
for (let prefix in scopes)
  dynamicDots[prefix] = DotReactionRule;
dynamicDots["x."] = BreakOnFalseReactionRule;
dynamicDots["y."] = BreakOnTrueReactionRule;
dynamicDots["j."] = JumpReactionRule;

// x/er/v1.js
var ER = class {
  constructor(posts) {
    this.posts = posts;
  }
  *parents(ref, type, prop) {
    for (let [k, v] of Object.entries(this.posts))
      if (!type || k.startsWith(type)) {
        if (prop && Array.isArray(v[prop]) && v[prop].includes(ref))
          yield k;
      }
  }
  parent(ref, type, prop) {
    return this.parents(ref, type, prop).next().value;
  }
  //todo this can loop forever, when we have a person with a friend 
  //     that has a friend that is the first person. This won't work.
  //
  //todo 1. we need to go width first.
  //todo 2. we need to check the path. If we are going from:
  //        person / [friends] / person / [friends]
  //        then we need to stop at the 2nd [friends].
  //        we should only resolve person[friends] relationship *once*.
  //        when we meet person[friends] 2nd time, we should just skip it.
  //        this means that when we meet "person" the second time, 
  //        we should skip all the arrays.
  resolve(key, vars) {
    const res = Object.assign({}, vars, this.posts[key]);
    for (let p in res)
      if (res[p] instanceof Array)
        res[p] = res[p].map((k) => this.resolve(k, vars));
    return res;
  }
};
var triggers2 = new DoubleDots.AttrWeakSet();
var Er = class extends AttrCustom {
  upgrade() {
    triggers2.add(this);
  }
};
var ErEvent = class extends Event {
  constructor(type, er2) {
    super(type);
    this.er = new ER(er2);
  }
};
function er(posts) {
  eventLoop.dispatchBatch(new ErEvent("er", posts), triggers2);
}

// x/fetch/v1.js
async function fetch_json() {
  return (await fetch(this.value)).json();
}
async function fetch_text() {
  return (await fetch(this.value)).text();
}

// x/PropagationSimple/prop.js
var WindowTrigger = class extends AttrListener {
  get target() {
    return window;
  }
};
var DocumentTrigger = class extends AttrListener {
  get target() {
    return document;
  }
};
var DCLTrigger = class extends DocumentTrigger {
  get type() {
    return "DOMContentLoaded";
  }
};
var PrePropTrigger = class extends WindowTrigger {
  //global _click
  get type() {
    return this.trigger.slice(1);
  }
  //remove prefix so returns "click"
  get options() {
    return true;
  }
};
var PostPropTrigger = class extends WindowTrigger {
  //global click_
  get type() {
    return this.trigger.slice(-1);
  }
  //remove postfix so returns "click"
};
function makeAll() {
  const upCase = (s) => s[0].toUpperCase() + s.slice(1);
  const res = {};
  for (let type of DoubleDots.nativeEvents.element) {
    type = upCase(type);
    res[type] = AttrListener;
    res["_" + type] = PrePropTrigger;
    res[type + "_"] = PostPropTrigger;
  }
  for (let type of DoubleDots.nativeEvents.window)
    res[upCase(type)] = WindowTrigger;
  for (let type of DoubleDots.nativeEvents.document)
    res[upCase(type)] = DocumentTrigger;
  delete res["DOMContentLoaded"];
  res["Domcontentloaded"] = DCLTrigger;
  return res;
}
var dynamicSimpleProp = makeAll();
export {
  DCLTrigger,
  DocumentTrigger,
  Er,
  Nav,
  PostPropTrigger,
  PrePropTrigger,
  State,
  State_,
  WindowTrigger,
  dynamicSimpleProp,
  dynamicDots as dynamicsDots,
  embrace,
  er,
  fetch_json,
  fetch_text,
  nav,
  state,
  state_
};
//# sourceMappingURL=ddx.js.map
