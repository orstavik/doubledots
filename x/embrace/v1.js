import { LoopCube } from "./LoopCube.js";
import { extractArgs } from "./Tokenizer.js";

//Template engine

class EmbraceRoot {
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
    //1. make the argumentsDictionary
    for (let param in this.paramsDict)
      argsDictionary[param] ??= this.paramsDict[param].reduce((o, p) => o?.[p], dataObject);
    //2. run rules
    for (let i of this.todos) {
      const ex = this.expressions[i], n = this.nodes[i];
      if (ancestor.contains(n.ownerElement ?? n))
        ex.run(argsDictionary, dataObject, n, ancestor);
    }
  }

  prep(funcs) {
    for (let i of this.todos) {
      const exp = this.expressions[i];
      exp.cb = funcs[exp.func];
      exp.innerRoot?.prep(funcs);
    }
    return this;
  }
}

class EmbraceTextNode {
  constructor({ params, cb, func }) {
    this.cb = cb;
    this.params = params;
    this.func = func;
  }

  run(argsDict, dataIn, node, ancestor) {
    const args = this.params.map(p => argsDict[p]);
    node.textContent = this.cb(...args);
  }
}

class EmbraceCommentFor {
  constructor(innerRoot, varName, func, params, ofIn) {
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.func = func;
    this.cb;
    this.ofIn = ofIn;
    this.iName = `#${varName}`;
    this.params = params;
    this.dName = `$${varName}`;
  }

  run(argsDict, dataObject, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    const args = this.params.map(p => argsDict[p]);
    let list = this.cb(...args);
    let now = list;
    if (this.ofIn === "in") {
      now = Object.keys(list);
      let i = now.indexOf("$");
      i >= 0 && now.splice(i, 1);
    }
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    node.before(...embraces.map(em => em.template));
    for (let i of changed) {
      dataObject[this.varName] = now[i];
      dataObject[this.iName] = i;
      if (this.ofIn === "in")
        dataObject[this.dName] = list[now[i]];
      embraces[i].run(Object.assign({}, argsDict), dataObject, undefined, ancestor);
    }
  }
}

class EmbraceCommentIf {
  constructor(templateEl, emRoot, func, params) {
    this.innerRoot = emRoot;
    this.templateEl = templateEl;
    this.func = func;
    this.cb;
    this.params = params;
    this.state = false;
  }

  run(argsDict, dataObject, node, ancestor) {
    const args = this.params.map(p => argsDict[p]);
    const test = !!this.cb(...args);
    if (test && !this.state)
      node.before(...this.innerRoot.topNodes);
    else if (this.state)
      this.templateEl.append(...this.innerRoot.topNodes);
    if (test)
      this.innerRoot.run(Object.assign({}, argsDict), dataObject, undefined, ancestor);
    this.state = test;
  }
}
//PARSER

function flatDomNodesAll(docFrag) {
  const res = [];
  const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
  for (let n = it.nextNode(); n = it.nextNode();) {
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
    body += i % 2 ?
      `\${((v = (${extractArgs(segs[i], params)})) === false || v === undefined ? "": v)}` :
      segs[i].replaceAll("`", "\\`");
  }
  const func = `(...args) => {let v; return \`${body}\`;}`;
  return { func, params };
}

function parseFor(txt) {
  const ctrlFor = txt.match(/^\s*(let|const|var)\s+([^\s]+)\s+(of|in)\s+(.+)\s*$/);
  if (!ctrlFor)
    return;
  const [, , varName, ofIn, listName] = ctrlFor;
  const params = [];
  const body = extractArgs(listName, params);
  const func = `(...args) => (${body})`;
  return { params, func, varName, ofIn };
}

function paramDict(listOfExpressions) {
  const params = {};
  for (let e of listOfExpressions.filter(Boolean))
    if (e.params?.length)
      for (let p of e.params)
        params[p] ??= p.split(".");
  return params;
}

function parseTemplate(template) {
  const nodes = flatDomNodesAll(template.content);
  const expressions = nodes.map(parseNode);
  const paramsDict = paramDict(expressions);
  return new EmbraceRoot(template.content, nodes, expressions, paramsDict);
}

function parseNode(n) {
  let res;
  if (n instanceof Text || n instanceof Attr) {
    if (res = parseTextNode(n))
      return new EmbraceTextNode(res);
  } else if (n instanceof HTMLTemplateElement) {
    const emTempl = parseTemplate(n);
    let txt;
    if (txt = n.getAttribute("for")) {
      const res = parseFor(txt);
      if (res) {
        const { params, func, varName, ofIn } = res;
        return new EmbraceCommentFor(emTempl, varName, func, params, ofIn);
      }
    }
    if (txt = n.getAttribute("if")) {
      const params = [];
      const func = `(...args) => (${extractArgs(txt, params)})`;
      return new EmbraceCommentIf(n, emTempl, func, params);
    }
    return emTempl;
  }
}

function extractFuncs(expressions, name = "embrace") {
  const funcs = {};
  for (let i = 0; i < expressions.length; i++) {
    const id = name + "_" + i;
    const exp = expressions[i];
    if (exp?.func) {
      funcs[id] = exp.func;
      exp.func = id;
    }
    if (exp?.innerRoot)
      Object.assign(funcs, extractFuncs(exp.innerRoot.expressions, id));
  }
  return funcs;
}

function setCbs(root, funcs) {
  for (let exp of root.expressions) {
    if (exp?.func)
      exp.cb = funcs[exp.func];
    if (exp?.innerRoot)
      setCbs(exp.innerRoot, funcs);
  }
}

async function loadEmbraces(funcs) {
  const body = Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',');
  return await DoubleDots.importBasedEval("{" + body + "}");
}

export function embrace(templ, dataObject) {
  //todo I think that embrace should work only with the child class... maybe..
  dataObject = Object.assign({ $: dataObject }, dataObject);
  if (this.__embrace)
    return this.__embrace.run(Object.create(null), dataObject, 0, this.ownerElement);
  this.__embrace = parseTemplate(templ);//todo we need to name the functions properly during parsing
  const funcs = extractFuncs(this.__embrace.expressions);
  //todo once we have he engine, then we can prepend it.
  this.ownerElement.prepend(this.__embrace.template);

  //todo The embrace ID. It should be the name of the template and the embraced=[script]
  //todo and the name of the functions...^...
  //check against an id for the ownerElement..
  if (DoubleDots.Embraced) {
    return this.__embrace.prep(DoubleDots.Embraced)
      .run(Object.create(null), dataObject, 0, this.ownerElement);
  }
  const script = "{" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',') + "}";
  this.ownerElement.insertAdjacentHTML("beforebegin",
    `<script embraced>DoubleDots.Embrace = ${script}</script>`);
  //the browser doesn't allow this to run
  console.log(`Embrace is:
${this.ownerElement.previousElementSibling.outerHTML}
${this.ownerElement.outerHTML}    
`);
  DoubleDots.importBasedEval(script).then(funcsObj => {
    this.__embrace.prep(DoubleDots.Embrace = funcsObj)
      .run(Object.create(null), dataObject, 0, this.ownerElement);
  });
}