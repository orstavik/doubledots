// x/e/v1.js
function e_() {
  const e = window.eventLoop.event;
  return e.preventDefault(), e;
}
function eDot(name) {
  const [, ...props] = name.split(".");
  return function eDot2() {
    return props.reduce((acc, prop) => acc[prop], window.eventLoop.event);
  };
}

// x/at/v1.js
function gatRule(name) {
  name = name.split(".")[1];
  return function gat() {
    return this.ownerElement.getAttribute(name);
  };
}
function sat_Rule(name) {
  name = name.split(".")[1];
  if (!name)
    return function sat_(input) {
      return this.value = parseStringValue(input);
    };
  return function sat_(input) {
    return this.ownerElement.setAttribute(name, parseStringValue(input));
  };
}
function tat_Rule(name) {
  name = name.split(".")[1];
  if (!name)
    throw new SyntaxError("In :DD you can't do tat_ on the current attribute.");
  return function tat_(input) {
    return this.ownerElement.toggleAttribute(name);
  };
}
function rat_Rule(name) {
  name = name.split(".")[1];
  return function rat_(input) {
    return this.ownerElement.removeAttribute(name);
  };
}

// x/class/v1.js
function classList() {
  return this.ownerElement.classList;
}
function clazz() {
  return this.ownerElement.getAttribute("class");
}
function classDot(name) {
  name = name.split(".")[1];
  if (!name) throw new SyntaxError("'class.' needs a name such as 'class.cssClassName'.");
  return function classDot2() {
    return this.ownerElement.classList.contains(name) ? name : void 0;
  };
}
function class_(name) {
  name = name.split("_")[1];
  if (!name)
    return function class_2(input) {
      return this.ownerElement.classList.add(input), input;
    };
  return function class_name() {
    return this.ownerElement.classList.add(name), name;
  };
}
function toggleClass_(name) {
  const segs = name.split("_")[1];
  const name2 = segs[1];
  let previous;
  if (!name2) {
    return function toggleClass_input(input) {
      if (previous)
        this.ownerElement.classList.remove(previous);
      previous = input;
      return this.ownerElement.classList.toggle(input), input;
    };
  }
  if (segs.length === 3)
    return function toggleClass_onOff(input) {
      return this.ownerElement.classList.toggle(name2, !!input), !!input ? name2 : void 0;
    };
  return function toggleClass_name() {
    return this.ownerElement.classList.toggle(name2), name2;
  };
}

// x/state/v1.js
function matchesPath(observedPaths, path) {
  for (let observedPath of observedPaths)
    if (path.startsWith(observedPath))
      return true;
}
function pathsAllSet(observedPaths, state2) {
  for (let path of observedPaths) {
    let obj = state2;
    for (let p of path) {
      if (!(p in obj))
        return false;
      obj = obj[p];
    }
  }
  return true;
}
function makeIterator(attrs2, state2, pathString) {
  if (!pathString)
    return attrs2[Symbol.iterator]();
  const matches = [];
  for (let at of attrs2) {
    if (!at.constructor.paths)
      matches.push(at);
    else if (matchesPath(at.constructor.branches, pathString)) {
      if (pathsAllSet(at.constructor.paths, state2))
        matches.push(at);
    }
  }
  return matches[Symbol.iterator]();
}
var attrs = {};
function addAttr(at, name) {
  (attrs[name] ??= new DoubleDots.AttrWeakSet()).add(at);
}
var states = {};
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
    addAttr(this, this.trigger);
  }
};
function state(value) {
  const name = eventLoop.reaction;
  if (JSON.stringify(states[name]) === JSON.stringify(value))
    return;
  const e = new Event("state");
  e[Event.data] = states[name] = value;
  const it = makeIterator(attrs[name], states[name]);
  eventLoop.dispatchBatch(e, it);
}
function State_(rule) {
  const [name, ...branches] = rule.split("_");
  const paths = branches.map((b) => b.split("."));
  return class State extends AttrCustom {
    upgrade() {
      addAttr(this, name);
    }
    static get branches() {
      return branches;
    }
    static get paths() {
      return paths;
    }
  };
}
function state_(rule) {
  let [name, branch] = rule.split("_");
  const path = branch.split(".");
  const key = path.pop();
  return function(value) {
    const change = setInObjectIfDifferent(states[name] ??= {}, path, key, value);
    if (!change)
      return;
    const e = new Event(name);
    e[Event.data] = states[name];
    const it = makeIterator(attrs[name], states[name], branch);
    eventLoop.dispatchBatch(e, it);
  };
}

// x/nav/v1.js
var triggers = new DoubleDots.AttrWeakSet();
var active;
var LocationEvent = (_) => Object.assign(new Event("location"), { [Event.data]: new URL(location) });
var Nav = class extends AttrCustom {
  upgrade() {
    if (!active) {
      for (let e of ["click", "popstate"])
        document.documentElement.setAttribute(`${e}:${this.trigger}`);
      active = true;
    }
    triggers.add(this);
    this.dispatchEvent(LocationEvent());
  }
  remove() {
    triggers.delete(this);
  }
};
function nav(e) {
  if (typeof e === "string") {
    const url = new URL(e, location.href);
    history.pushState(null, null, url.href);
    return eventLoop.dispatchBatch(LocationEvent(), triggers);
  }
  if (!triggers.size) {
    for (let e2 of ["click", "popstate", "hashchange"])
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
    const link = new URL(a.href, location.href);
    if (link.origin !== window.location.origin)
      return;
    history.pushState(null, null, link);
    e.preventDefault();
  }
  eventLoop.dispatchBatch(LocationEvent(), triggers);
}

// x/embrace/LoopCube.js
var LoopCube = class _LoopCube {
  static compareSmall(compare, old, now) {
    const exact = new Array(now.length);
    const unused = [];
    if (!old?.length)
      return { exact, unused };
    main: for (let o = 0; o < old.length; o++) {
      for (let n = 0; n < now.length; n++) {
        if (!exact[n] && compare(old[o], now[n])) {
          exact[n] = o;
          continue main;
        }
      }
      unused.push(o);
    }
    return { exact, unused };
  }
  constructor(embrace2, compare = (a, b) => a === b) {
    this.embrace = embrace2;
    this.now = [];
    this.nowEmbraces = [];
    this.comparator = _LoopCube.compareSmall.bind(null, compare);
  }
  step(now = []) {
    const old = this.now;
    const oldEmbraces = this.nowEmbraces;
    this.now = now;
    const { exact, unused } = this.comparator(old, now);
    const embraces = new Array(now.length);
    const changed = [];
    for (let n = 0; n < exact.length; n++) {
      const o = exact[n];
      if (o != null) {
        embraces[n] = oldEmbraces[o];
      } else {
        changed.push(n);
        embraces[n] = unused.length ? oldEmbraces[unused.shift()] : this.embrace.clone();
      }
    }
    this.nowEmbraces = embraces;
    const removes = unused.map((o) => oldEmbraces[o]);
    return { embraces, removes, changed };
  }
};

// x/embrace/Tokenizer.js
var loophole = /\b(?:JSON.stringify|Object.values|Object.keys|Object.entries|(?:instanceof\s+(?:[\p{L}\p{N}_$]+)))\b/;
var ignore = /\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|interface|let|new|null|package|private|protected|public|return|static|switch|throw|true|try|typeof|var|void|while|with|yield|async|await|\s+)\b/;
var dotWords = /\.\s*[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}\p{N}_$]+)*/u;
var words = /#?[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}\p{N}_$]+)*/u;
var quote1 = /'([^'\\]*(\\.[^'\\]*)*)'/;
var quote2 = /"([^"\\]*(\\.[^"\\]*)*)"/;
var number = /0[xX][0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?/;
var regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
var linecomment = /\/\/[^\n]*/;
var starcomment = /\/\*[^]*?\*\//;
var tokens = [loophole, ignore, words, dotWords, quote1, quote2, number, linecomment, starcomment, regex];
var tokenizer = new RegExp(tokens.map((r) => `(${r.source})`).join("|"), "gu");
function extractArgs(txt) {
  return txt.replaceAll(tokenizer, (o, l, i, p) => p ? `args("${p.replace(/\s+/g, "")}")` : o);
}
function interpretTemplateString(txt) {
  return `\`${txt.split(/{{([^}]+)}}/).map((str, i) => i % 2 ? `\${(v = ${extractArgs(str)}) === false || v === undefined ? "": v}` : str.replaceAll("`", "\\`")).join("")}\``;
}
var tsts = [
  [
    `series instanceof Array`,
    `args("series") instanceof Array`
  ],
  [
    `//the word are all references. They will *all* be replaced with arg[i]
  const word = / #something.else */u;
  const quote = / name /;
  const number = /n . a . m . e/;
  const regex = //[^/\\]*(?:\\.[^/\\]*)*/[gimyu]*/;
  const starcomment = //*[^]*?*//;`,
    `//the word are all references. They will *all* be replaced with arg[i]
  const args("word") = / #something.else */u;
  const args("quote") = / name /;
  const args("number") = /n . a . m . e/;
  const args("regex") = //[^/\\]*(?:\\.[^/\\]*)*/[gimyu]*/;
  const args("starcomment") = //*[^]*?*//;`
  ],
  [
    `name hello . sunshine #hello.world bob123 _123`,
    `args("name") args("hello.sunshine") args("#hello.world") args("bob123") args("_123")`
  ],
  [
    `name.hello["bob"].sunshine  . bob`,
    `args("name.hello")["bob"].sunshine  . bob`
  ]
  //todo this last test.. it should actually turn this into args("name.hello.bob.sunshine.bob"), right? We should disallow property names with space in them? " "
];
function test() {
  for (let [before, after] of tsts) {
    const exp = extractArgs(before).trim();
    if (exp !== after)
      console.log(exp);
  }
}

// x/embrace/v1.js
function dotScope(data, superior, cache = {}) {
  const me = function scope(path) {
    return path.constructor === Object ? dotScope(data, me, path) : path === "$" ? data : cache[path] ??= path.split(".").reduce((o, p) => o?.[p], cache) ?? superior?.(path) ?? path.split(".").reduce((o, p) => o?.[p], data);
  };
  return me;
}
var EmbraceRoot = class _EmbraceRoot {
  constructor(name, docFrag, nodes, expressions) {
    this.name = name;
    this.template = docFrag;
    this.nodes = nodes;
    this.topNodes = [...docFrag.childNodes];
    this.expressions = expressions;
    this.todos = [];
    for (let i = 0; i < expressions.length; i++)
      if (expressions[i])
        this.todos.push({ exp: expressions[i], node: nodes[i] });
  }
  clone() {
    const docFrag = this.template.cloneNode(true);
    const nodes = [...flatDomNodesAll(docFrag)];
    return new _EmbraceRoot(this.name, docFrag, nodes, this.expressions);
  }
  run(scope, _, ancestor) {
    for (let { exp, node } of this.todos)
      if (ancestor.contains(node.ownerElement ?? node))
        exp.run(scope, node, ancestor);
  }
  prep(funcs) {
    for (let { exp } of this.todos) {
      exp.cb = funcs[exp.name];
      exp.innerRoot?.prep(funcs);
    }
  }
  runFirst(el, dataObject, funcs) {
    this.prep(funcs);
    el.prepend(...this.topNodes);
    this.run(dotScope(dataObject), 0, el);
  }
};
var EmbraceTextNode = class {
  constructor(name, exp) {
    this.name = name;
    this.exp = exp;
  }
  run(scope, node) {
    node.textContent = this.cb(scope);
  }
};
var EmbraceCommentFor = class {
  constructor(name, innerRoot, varName, exp) {
    this.name = name;
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.exp = exp;
    this.cb;
    this.iName = `#${varName}`;
    this.dName = `$${varName}`;
  }
  run(scope, node, ancestor) {
    let list = this.cb(scope) ?? [];
    const inMode = !(Symbol.iterator in list);
    const cube = node.__cube ??= new LoopCube(this.innerRoot, inMode ? (a, b) => JSON.stringify(a) === JSON.stringify(b) : void 0);
    const now = inMode ? Object.entries(list) : list;
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    for (let em of embraces)
      node.before(...em.topNodes);
    for (let i of changed) {
      const subScope = { [this.iName]: i };
      if (inMode) {
        subScope[this.varName] = now[i][1];
        subScope[this.dName] = now[i][0];
      } else {
        subScope[this.varName] = now[i];
      }
      embraces[i].run(scope(subScope), void 0, ancestor);
    }
  }
};
var EmbraceCommentIf = class {
  constructor(name, emRoot, exp) {
    this.name = name;
    this.innerRoot = emRoot;
    this.exp = exp;
  }
  run(argsDict, node, ancestor) {
    const em = node.__ifEmbrace ??= this.innerRoot.clone();
    const test2 = !!this.cb(argsDict);
    if (test2 && !em.state)
      node.before(...em.topNodes);
    else if (!test2 && em.state)
      node.append(...em.topNodes);
    if (test2)
      em.run(argsDict({}), void 0, ancestor);
    em.state = test2;
  }
};
function* flatDomNodesAll(docFrag) {
  const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
  for (let n = it.nextNode(); n = it.nextNode(); ) {
    yield n;
    if (n instanceof Element) yield* n.attributes;
  }
}
function parseTemplate(template, name = "embrace") {
  const nodes = [...flatDomNodesAll(template.content)];
  const expressions = nodes.map((n, i) => parseNode(n, name + "_" + i));
  return new EmbraceRoot(name, template.content, nodes, expressions);
}
function parseNode(n, name) {
  if (n instanceof Text || n instanceof Attr || n instanceof Comment) {
    if (n.textContent.match(/{{([^}]+)}}/))
      return new EmbraceTextNode(name, n.textContent);
  } else if (n instanceof HTMLTemplateElement) {
    const emTempl = parseTemplate(n, name);
    let res;
    if (res = n.getAttribute("for")) {
      const ctrlFor = res.match(/^\s*([^\s]+)\s+(?:of)\s+(.+)\s*$/);
      if (!ctrlFor)
        throw new SyntaxError("embrace for error: " + res);
      const [, varName, exp] = ctrlFor;
      return new EmbraceCommentFor(name, emTempl, varName, exp);
    }
    if (res = n.getAttribute("if"))
      return new EmbraceCommentIf(name, emTempl, res);
    return emTempl;
  }
}
function extractFuncs(root, res = {}) {
  for (let { exp } of root.todos) {
    const code = exp instanceof EmbraceTextNode ? interpretTemplateString(exp.exp) : exp instanceof EmbraceCommentFor ? extractArgs(exp.exp) : exp instanceof EmbraceCommentIf ? extractArgs(exp.exp) : void 0;
    res[exp.name] = `(args, v) => ${code}`;
    if (exp.innerRoot)
      extractFuncs(exp.innerRoot, res);
  }
  return res;
}
function hashDebug(script, id) {
  return `Add the following script in the <head> element:

<script embrace="${id}">
  (window.Embrace ??= {})["${id}"] = ${script};
<\/script>`;
}
function embrace(dataObject) {
  let em = this.ownerElement.__embrace;
  if (em)
    return em.run(dotScope(dataObject), 0, this.ownerElement);
  const id = this.ownerElement.id || "embrace";
  const templ = this.ownerElement.firstElementChild;
  if (!(templ instanceof HTMLTemplateElement))
    throw new Error("This first element child of :embrace ownerElement must be a template");
  em = this.ownerElement.__embrace = parseTemplate(templ, id);
  if (window.Embrace?.[id])
    return em.runFirst(this.ownerElement, dataObject, window.Embrace[id]);
  const funcs = extractFuncs(em);
  const script = "{\n" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(",\n") + "\n}";
  DoubleDots.importBasedEval(script).then((funcs2) => {
    DoubleDots.log?.(":embrace production", hashDebug(script, id));
    (window.Embrace ??= {})[id] = funcs2;
    em.runFirst(this.ownerElement, dataObject, funcs2);
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
var dynamicDots = {};
for (let prefix in scopes)
  dynamicDots[prefix] = DotReactionRule;
dynamicDots["x."] = BreakOnFalseReactionRule;
dynamicDots["y."] = BreakOnTrueReactionRule;

// x/er/ErAnalysis.js
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
var ErAnalysis = class _ErAnalysis extends ER {
  //step 1
  static entitiesToTypeValue(posts) {
    const res = {};
    for (let id in posts) {
      const post = posts[id];
      const type = post.type;
      const entityType = res[type] ??= {};
      for (let prop in post) {
        const values = entityType[prop] ??= [];
        values.push(post[prop]);
      }
    }
    return res;
  }
  //step 2
  static extractTypeList(list) {
    const types = [...new Set(list.map(_ErAnalysis.extractType))].sort();
    if (types.includes("text") && types.includes("textmd"))
      types.splice(types.indexOf("text"), 1);
    if (types.includes("int") && types.includes("float"))
      types.splice(types.indexOf("int"), 1);
    if (types[0].startsWith("list: ")) {
      let refs = types.map((t) => t.slice(6).split(","));
      return [...new Set(refs.flat().filter(Boolean))];
    }
    if (types.length === 1)
      return types[0];
    debugger;
    throw new Error("should be fixed..");
  }
  static isMarkDown(value) {
    if (!/[#*_~`]/.test(value))
      return;
    const markdownPatterns = [
      /\*\*.*?\*\*/,
      // bold (**text**)
      /\*.*?\*/,
      // italics (*text*)
      /~~.*?~~/,
      // strikethrough (~~text~~)
      /`.*?`/,
      // inline code (`code`)
      /#+\s+.+/,
      // headings (# heading, ## subheading, etc.)
      /\[.*?\]\(.*?\)/,
      // links ([text](url))
      /!\[.*?\]\(.*?\)/,
      // images (![alt](url))
      /^>\s+.+/m
      // blockquotes (> quote)
    ];
    for (const pattern of markdownPatterns)
      if (pattern.test(value))
        return "textmd";
  }
  static extractType(value) {
    if (Array.isArray(value))
      return "list: " + [...new Set(value.map((str) => str.split("/")[0]))].join(",");
    try {
      if (decodeURI(new URL(value).href) === decodeURI(value)) return "url";
    } catch (_) {
    }
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value))
      return "color";
    if (Number(value) + "" === value)
      return "number";
    return _ErAnalysis.isMarkDown(value) ?? "text";
  }
  static valuesToTypes(typeValueSchema) {
    const res = {};
    for (let type in typeValueSchema) {
      const entityType = res[type] = {};
      const propValues = typeValueSchema[type];
      for (let prop in propValues)
        entityType[prop] = _ErAnalysis.extractTypeList(propValues[prop]);
    }
    return res;
  }
  //step 3 relations
  static topologicalSort(schemas, cp) {
    const sortedSchemas = [];
    const visited = /* @__PURE__ */ new Set();
    const tempMarked = /* @__PURE__ */ new Set();
    function visit(schema) {
      if (tempMarked.has(schema))
        throw new Error("Cycle detected, schema relationships form a loop.");
      if (!visited.has(schema)) {
        tempMarked.add(schema);
        const referencedSchemas = cp[schema] || /* @__PURE__ */ new Set();
        for (const referred of referencedSchemas)
          visit(referred);
        tempMarked.delete(schema);
        visited.add(schema);
        sortedSchemas.push(schema);
      }
    }
    for (const schema in schemas)
      visit(schema);
    return sortedSchemas;
  }
  static bottomUpRelations(schemaType) {
    const res = {};
    for (let type in schemaType)
      for (let prop in schemaType[type])
        if (schemaType[type][prop] instanceof Array)
          for (let referred of schemaType[type][prop])
            (res[referred] ??= /* @__PURE__ */ new Set()).add(type);
    return res;
  }
  static analyze(posts) {
    const schemaTypeValues = _ErAnalysis.entitiesToTypeValue(posts);
    const schemaTypedUnsorted = _ErAnalysis.valuesToTypes(schemaTypeValues);
    const relationsUp = _ErAnalysis.bottomUpRelations(schemaTypedUnsorted);
    const entitySequence = _ErAnalysis.topologicalSort(schemaTypedUnsorted, relationsUp);
    return entitySequence.map((type) => [type, schemaTypedUnsorted[type]]);
  }
  #schema;
  #schemaSorted;
  get schema() {
    return this.#schema ??= Object.fromEntries(this.schemaSorted);
  }
  get schemaSorted() {
    return this.#schemaSorted ??= _ErAnalysis.analyze(this.posts);
  }
};

// x/fetch/v2.js
var RESPONSE_TYPES = {
  json: "json",
  text: "text",
  blob: "blob",
  form: "formData",
  formdata: "formData",
  bytes: "bytes",
  uint8array: "bytes",
  uint8: "bytes",
  clone: "clone",
  arraybuffer: "arrayBuffer",
  buffer: "arrayBuffer"
};
function parseResponseType(tail) {
  if (!tail) return "json";
  if (RESPONSE_TYPES[tail]) return RESPONSE_TYPES[tail];
  throw new SyntaxError("Unknown fetch- response type: " + tail);
}
var METHOD = {
  post: "POST",
  put: "PUT",
  delete: "DELETE",
  patch: "PATCH"
};
var dotMETHOD = {
  get: "GET",
  head: "HEAD"
};
var HEADERS = {
  auth: ["credentials", "include"],
  omit: ["credentials", "omit"],
  nocache: ["cache", "no-cache"],
  nostore: ["cache", "no-store"],
  reload: ["cache", "reload"],
  forcecache: ["cache", "force-cache"],
  onlyifcached: ["cache", "only-if-cached"],
  cors: ["mode", "cors"],
  nocors: ["mode", "no-cors"],
  sameorigin: ["mode", "same-origin"],
  noreferrer: ["referrerPolicy", "no-referrer"],
  origin: ["referrerPolicy", "origin"],
  originwhencross: ["referrerPolicy", "origin-when-cross-origin"],
  strictorigin: ["referrerPolicy", "strict-origin"],
  strictorigincross: ["referrerPolicy", "strict-origin-when-cross-origin"],
  unsafe: ["referrerPolicy", "unsafe-url"],
  refsameorigin: ["referrerPolicy", "same-origin"]
};
function parseSegments(name, splitter, methodMap) {
  const [, ...segments] = name.toLowerCase().split(splitter);
  let method;
  let responseType;
  const headers = {};
  for (let seg of segments) {
    if (methodMap[seg]) {
      if (method)
        throw new SyntaxError("multiple fetch methods: " + methodMap[seg] + ", " + seg);
      method = methodMap[seg];
    } else if (HEADERS[seg]) {
      const [type, value] = HEADERS[seg];
      if (type in headers)
        throw new SyntaxError("multiple fetch headers of same type: " + type + ", " + seg);
      headers[type] = value;
    } else {
      throw new SyntaxError("unknown fetch segment: " + seg);
    }
  }
  return { method, responseType, headers };
}
async function basicFetch() {
  return (await fetch(this.value)).json();
}
function fetchDashRule(name) {
  const [head, type, tail] = name.split(/([._])/);
  const responseType = parseResponseType(tail);
  const m = type === "." ? "GET" : "POST";
  const { headers, method = m } = parseSegments(head, "-", type === "." ? dotMETHOD : METHOD);
  return type === "." ? async function fetchDash() {
    return (await fetch(this.value, { method, headers }))[responseType]();
  } : async function fetchDash_(body) {
    return (await fetch(this.value, { method, headers, body }))[responseType]();
  };
}
function fetchDotRule(name) {
  const [, tail] = name.split(".");
  const responseType = parseResponseType(tail);
  return async function fetchDash() {
    return (await fetch(this.value, { method: "GET" }))[responseType]();
  };
}
function fetch_Rule(name) {
  const [, tail] = name.split("_");
  const responseType = parseResponseType(tail);
  return async function fetch_(body) {
    return (await fetch(this.value, { method: "POST", body }))[responseType]();
  };
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

// x/formdata/v1.js
function formdata_(rule) {
  const [, type] = rule.split("_");
  if (type === "json")
    return function formdata_json(form) {
      const obj = /* @__PURE__ */ Object.create(null);
      for (const [key, value] of new FormData(form))
        !(key in obj) ? obj[key] = value : Array.isArray(obj[key]) ? obj[key].push(value) : obj[key] = [obj[key], value];
      return obj;
    };
  if (type === "urlencoded")
    return (form) => new URLSearchParams(new FormData(form));
  if (type === "multipart")
    return (form) => new FormData(form);
  if (type === "blob")
    return (form) => new Blob([new URLSearchParams(new FormData(form))], { type: "application/x-www-form-urlencoded" });
  throw new SyntaxError(`Invalid formdata type: ${type}. Must be "json" or "urlencoded".`);
}

// x/css/v1.js
import { SheetWrapper } from "https://cdn.jsdelivr.net/gh/orstavik/csss@1.0.8/src/engine.js";
var sheetWrapper;
function makeSheetWrapper() {
  let style = document.querySelector("style[csss]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("csss", "");
    document.head.appendChild(style);
  }
  return sheetWrapper = new SheetWrapper(style.sheet);
}
var active2;
function updateTextContent() {
  active2 ||= setTimeout(() => (sheetWrapper.cleanup(), active2 = void 0), 500);
}
var Class = class extends AttrCustom {
  upgrade() {
    this.__previousClasses = {};
  }
  set value(v) {
    super.value = v;
    sheetWrapper ??= makeSheetWrapper();
    let positions = [], last = -1;
    for (let clz of this.ownerElement.classList) {
      if (clz.includes("$")) {
        const ruleAndPos = sheetWrapper.addRule(clz);
        const { pos, rule } = ruleAndPos;
        positions[pos] = ruleAndPos;
        if (pos < last) {
          const potentialErrors = positions.filter((_, i) => i > pos);
          for (let potential of potentialErrors) {
            const doubleKey = overlap(ruleAndPos, potential);
            if (doubleKey)
              console.warn(`Wrong sequence!! ${clz} should be positioned before ${potential}.`);
          }
        } else
          last = pos;
      }
      updateTextContent();
    }
  }
  get value() {
    return super.value;
  }
};
export {
  Class,
  DCLTrigger,
  DocumentTrigger,
  ER,
  ErAnalysis,
  Nav,
  PostPropTrigger,
  PrePropTrigger,
  State,
  State_,
  WindowTrigger,
  basicFetch,
  classDot,
  classList,
  class_,
  clazz,
  dynamicSimpleProp,
  dynamicDots as dynamicsDots,
  eDot,
  e_,
  embrace,
  fetchDashRule,
  fetchDotRule,
  fetch_Rule,
  formdata_,
  gatRule,
  nav,
  rat_Rule,
  sat_Rule,
  state,
  state_,
  tat_Rule,
  toggleClass_
};
//# sourceMappingURL=ddx.js.map
