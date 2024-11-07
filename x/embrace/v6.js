import { LoopCube } from "./LoopCube.js";
import { extractArgs } from "./Tokenizer.js";

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
  constructor(innerRoot, varName, listName, ofIn) {
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.listName = listName;
    this.ofIn = ofIn;
    this.iName = `#${varName}`;
    this.params = [listName];
  }

  run(argsDictionary, dataObject, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    const now = argsDictionary[this.listName];
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    node.before(...embraces.map(em => em.template));
    for (let i of changed) {
      dataObject[this.varName] = now[i];
      dataObject[this.iName] = i;
      embraces[i].run(Object.assign({}, argsDictionary), dataObject, undefined, ancestor);
    }
  }
}

function flatDomNodesAll(docFrag) {
  const res = [];
  const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
  for (let n = it.nextNode(); n = it.nextNode();) {
    res.push(n);
    n instanceof Element && res.push(...n.attributes);
  }
  return res;
}

function parseTextNode({textContent: txt}) {
  const segs = txt.split(/{{([^}]+)}}/);
  if (segs.length === 1)
    return;
  const params = [];
  let body = "";
  for (let i = 0; i < segs.length; i++) {
    if (i % 2)
      body += `\${((v = (${extractArgs(segs[i], params)})) === false || v === undefined ? "": v)}`;
    else
      body += segs[i].replaceAll("`", "\\`");
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
    // if(v = n.getAttribute("if"))
    //   return EmbraceCommentIf.make(v, n);
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

class EmbraceRoot {
  constructor(docFrag, nodes, expressions, paramsDict) {
    this.template = docFrag;
    this.nodes = nodes;
    this.topNodes = [...docFrag.childNodes];
    this.expressions = expressions;
    this.paramsDict = paramsDict;
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
    //2. prep and run rules
    for (let ex, n, i = 0; i < this.expressions.length; i++)
      if (ex = this.expressions[i])
        if (n = this.nodes[i])
          if (n instanceof Attr ? ancestor.contains(n.ownerElement) : ancestor.contains(n))
          //todo prep the args here??
            ex.run(argsDictionary, dataObject, n, ancestor);
  }

  static make(docFrag) {
    const nodes = flatDomNodesAll(docFrag);
    const expressions = nodes.map(parseNode);
    const paramsDict = paramDict(expressions);
    return new EmbraceRoot(docFrag, nodes, expressions, paramsDict);
  }
}

async function convert(exp) {
  return exp.cb = await DoubleDots.importBasedEval(exp.func);
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

export function embrace(templ, dataObject) {
  if (this.__embraceRoot)
    return this.__embraceRoot.run(Object.create(null), dataObject.$ = dataObject, 0, this.ownerElement);
  this.__embraceRoot = EmbraceRoot.make(templ.content);
  return Promise.all(loadAllFuncs(this.__embraceRoot)).then(_ => {
    this.ownerElement.prepend(this.__embraceRoot.template);
    return this.__embraceRoot.run(Object.create(null), dataObject.$ = dataObject, 0, this.ownerElement);
  });
}