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
function triggerNavs() {
  const e2 = Object.assign(new Event("nav"), { location });
  eventLoop.dispatchBatch(e2, [...triggers]);
}
function nav(e) {
  if (typeof e === "string") {
    const url = new URL(e, location.href);
    history.pushState(null, null, url.href);
    return triggerNavs();
  }
  if (!triggers.size) {
    for (let e2 of ["click", "popstate"])
      document.htmlElement.removeAttribute(`${e2}:${eventLoop.reaction.name}`);
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
  triggerNavs();
}

// x/embrace/LoopCube.js
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

// x/embrace/Tokenizer.js
var ignore = /\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|switch|throw|true|try|typeof|var|void|while|with|yield|async|await)\b/;
var dotWords = /\.\s*[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}_$][\p{L}\p{N}_$]*)*/u;
var words = /#?[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}_$][\p{L}\p{N}_$]*)*/u;
var quote1 = /'([^'\\]*(\\.[^'\\]*)*)'/;
var quote2 = /"([^"\\]*(\\.[^"\\]*)*)"/;
var number = /0[xX][0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?/;
var regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
var linecomment = /\/\/[^\n]*/;
var starcomment = /\/\*[^]*?\*\//;
var tokens = [ignore, words, dotWords, quote1, quote2, number, linecomment, starcomment, regex];
var tokenizer = new RegExp(tokens.map((r) => `(${r.source})`).join("|"), "gu");
function extractArgs(txt, params = []) {
  txt = txt.replaceAll(tokenizer, (o, _, prop) => {
    if (!prop)
      return o;
    prop = prop.replaceAll(/\s+/g, "");
    let i = params.indexOf(prop);
    if (i < 0)
      i = params.push(prop) - 1;
    return `args[${i}]`;
  });
  return txt;
}
;
var tsts = [
  [
    `//the word are all references. They will *all* be replaced with arg[i]
  const word = / #something.else */u;
  const quote = / name /;
  const number = /n . a . m . e/;
  const regex = //[^/\\]*(?:\\.[^/\\]*)*/[gimyu]*/;
  const starcomment = //*[^]*?*//;`,
    `//the word are all references. They will *all* be replaced with arg[i]
  const args[0] = / #something.else */u;
  const args[1] = / name /;
  const args[2] = /n . a . m . e/;
  const args[3] = //[^/\\]*(?:\\.[^/\\]*)*/[gimyu]*/;
  const args[4] = //*[^]*?*//;`
  ],
  [
    `name hello . sunshine #hello.world bob123 _123`,
    `args[0] args[1] args[2] args[3] args[4]`
  ],
  [
    `name.hello["bob"].sunshine  . bob`,
    `args[0]["bob"].sunshine  . bob`
  ]
];
function test() {
  for (let [before, after] of tsts) {
    const res = extractArgs(before).trim();
    if (res !== after)
      console.log(res);
  }
}

// x/embrace/v1.js
var EmbraceTextNode = class {
  constructor({ params, cb, func }) {
    this.cb = cb;
    this.params = params;
    this.func = func;
  }
  run(argsDict, dataIn, node, ancestor) {
    const args = this.params.map((p) => argsDict[p]);
    node.textContent = this.cb(...args);
  }
};
var EmbraceCommentFor = class {
  constructor(innerRoot, varName, listName, ofIn) {
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.listName = listName;
    this.ofIn = ofIn;
    this.iName = `#${varName}`;
    this.params = [listName];
    this.dName = `$${varName}`;
  }
  run(argsDictionary, dataObject, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    let now = argsDictionary[this.listName];
    if (this.ofIn === "in") {
      now = Object.keys(now);
      now.splice(now.indexOf("$"), 1);
    }
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    node.before(...embraces.map((em) => em.template));
    for (let i of changed) {
      dataObject[this.varName] = now[i];
      dataObject[this.iName] = i;
      if (this.ofIn === "in")
        dataObject[this.dName] = dataObject[now[i]];
      embraces[i].run(Object.assign({}, argsDictionary), dataObject, void 0, ancestor);
    }
  }
};
function flatDomNodesAll(docFrag) {
  const res = [];
  const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
  for (let n = it.nextNode(); n = it.nextNode(); ) {
    res.push(n);
    n instanceof Element && res.push(...n.attributes);
  }
  return res;
}
function parseTextNode({ textContent: txt }) {
  const segs = txt.split(/{{([^}]+)}}/);
  if (segs.length === 1)
    return;
  const params = [];
  let body = "";
  for (let i = 0; i < segs.length; i++) {
    body += i % 2 ? `\${((v = (${extractArgs(segs[i], params)})) === false || v === undefined ? "": v)}` : segs[i].replaceAll("`", "\\`");
  }
  const func = `(...args) => {let v; return \`${body}\`;}`;
  return { func, params };
}
function parseNode(n) {
  let res;
  if (n instanceof Text || n instanceof Attr) {
    if (res = parseTextNode(n))
      return new EmbraceTextNode(res);
  } else if (n instanceof HTMLTemplateElement) {
    const emTempl = EmbraceRoot.make(n.content);
    let txt;
    if (txt = n.getAttribute("for")) {
      const ctrlFor = txt.match(/^\s*(let|const|var)\s+([^\s]+)\s+(of|in)\s+(.+)\s*$/);
      if (ctrlFor) {
        const [_, constLetVar, varName, ofIn, listName] = ctrlFor;
        return new EmbraceCommentFor(emTempl, varName, listName, ofIn);
      }
    }
    if (v = n.getAttribute("if"))
      throw new Error("todo implement it mrDoubleDots!!");
    return emTempl;
  }
}
function paramDict(listOfExpressions) {
  const params = {};
  for (let e of listOfExpressions.filter(Boolean))
    if (e.params?.length)
      for (let p of e.params)
        params[p] ??= p.split(".");
  return params;
}
var EmbraceRoot = class {
  constructor(docFrag, nodes, expressions, paramsDict) {
    this.template = docFrag;
    this.nodes = nodes;
    this.topNodes = [...docFrag.childNodes];
    this.expressions = expressions;
    this.paramsDict = paramsDict;
    this.todos = expressions.reduce((res, e, i) => (e && res.push(i), res), []);
  }
  clone() {
    const docFrag = this.template.cloneNode(true);
    const nodes = flatDomNodesAll(docFrag);
    return new EmbraceRoot(docFrag, nodes, this.expressions, this.paramsDict);
  }
  run(argsDictionary, dataObject, _, ancestor) {
    for (let param in this.paramsDict)
      argsDictionary[param] ??= this.paramsDict[param].reduce((o, p) => o?.[p], dataObject);
    for (let i of this.todos) {
      const ex = this.expressions[i];
      const n = this.nodes[i];
      if (!ancestor.contains(n.ownerElement ?? n))
        return;
      ex.run(argsDictionary, dataObject, n, ancestor);
    }
  }
  static make(docFrag) {
    const nodes = flatDomNodesAll(docFrag);
    const expressions = nodes.map(parseNode);
    const paramsDict = paramDict(expressions);
    return new EmbraceRoot(docFrag, nodes, expressions, paramsDict);
  }
};
async function convert(exp) {
  exp.cb = await DoubleDots.importBasedEval(exp.func);
}
function loadAllFuncs(root, promises = []) {
  for (let exp of root.expressions) {
    if (exp instanceof EmbraceTextNode)
      promises.push(convert(exp));
    if (exp instanceof EmbraceCommentFor)
      loadAllFuncs(exp.innerRoot, promises);
  }
  return promises;
}
function embrace(templ, dataObject) {
  if (this.__embrace)
    return this.__embrace.run(/* @__PURE__ */ Object.create(null), dataObject.$ = dataObject, 0, this.ownerElement);
  this.__embrace = EmbraceRoot.make(templ.content);
  return Promise.all(loadAllFuncs(this.__embrace)).then((_) => {
    this.ownerElement.prepend(this.__embrace.template);
    return this.__embrace.run(/* @__PURE__ */ Object.create(null), dataObject.$ = dataObject, 0, this.ownerElement);
  });
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
    for (let [k, v2] of Object.entries(this.posts))
      if (!type || k.startsWith(type)) {
        if (prop && Array.isArray(v2[prop]) && v2[prop].includes(ref))
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
