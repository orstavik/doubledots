import { LoopCube } from "./LoopCube.js";
import { extractArgs } from "./Tokenizer.js";

//todo implement
function parseSingle(txt) {
  const params = [];
  const body = extractArgs(txt, params);
  `((v = (${extractArgs(txt, params)})) === false || v === undefined ? "": v)`;
  const func = `(...args) => {let v; return ${body};}`;
  return { func, params };
}

function parseMultiple(txt) {
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

async function makeTxtCb(txt) {
  const res = parseMultiple(txt);
  if (!res)
    return;
  const { func, params } = res;
  const cb = await DoubleDots.importBasedEval(func);
  return { cb, params };
}



class EmbraceTextNode {
  constructor({ params, cb }) {
    this.cb = cb;
    this.params = params;
  }

  run(argsDict, dataIn, node, ancestor) {
    const args = this.params.map(p => argsDict[p]);
    node.textContent = this.cb(...args);
  }

  static async make(txt) {
    const res = await makeTxtCb(txt);
    if (res)
      return new EmbraceTextNode(res);
  }
}

class EmbraceCommentIf {
  constructor(templ, condition) {
    this.template = templ;
    this.condition = condition;
    this.params = condition.params;
  }

  run(argsDictionary, dataObject, node, ancestor) {
    node.__root ??= EmbraceRoot.make(this.template.content);
    const fi = this.condition.run(argsDictionary, dataObject, node, ancestor);
    if (!fi) {
      //todo move the childNodes to the <head>.
      this.template.childNodes.remove();
      return;
    }
    //todo how to not remove the template, just hide it? just do something else?
    //todo I can't take things in and out all the time, cause we have restrictions for that.
    node.after(node.__root.template);
    node.__root.run(argsDictionary, dataObject, node, ancestor);
  }

  static make(txt, templ) {
    const ctrlIf = txt.match(/{{\s*if\s*\(\s*([^)]+)\s*\)\s*}}/);
    if (!ctrlIf)
      return;
    const condition = EmbraceCondition.make(ctrlIf[1]);
    if (!condition)
      throw new SyntaxError("The condition is not parseable");
    return new EmbraceCommentIf(templ, condition);
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
    for (let n of removes)
      for (let c of n.nodes) //todo make a prop list on the EmbraceRoot to get all the childNodes only.
        if (!(c instanceof Attr))
          c.remove();
    node.after(...embraces.map(e => e.template));
    for (let i of changed) {
      dataObject[this.varName] = now[i];
      dataObject[this.iName] = i;
      embraces[i].run(Object.assign({}, argsDictionary), dataObject, undefined, ancestor);
    }
  }

  //naive, no nested control structures yet. no if. no switch. etc. , untested against errors.
  //startUpTime
  static async make(txt, tmpl) {
    // const ctrlIf = txt.match(/{{\s*if\s*\(\s*([^)]+)\s*\)\s*}}/);
    const ctrlFor = txt.match(/{{\s*for\s*\(\s*(let|const|var)\s+([^\s]+)\s+(of|in)\s+([^\s)]+)\)\s*}}/);
    if (ctrlFor) {
      const [_, constLetVar, varName, ofIn, listName] = ctrlFor;
      const root = await EmbraceRoot.make(tmpl.content);
      tmpl.remove();
      //here we need to parse the tmpl..
      return new EmbraceCommentFor(root, varName, listName, ofIn);
    }
  }
}

class EmbraceRoot {

  static flatDomNodesAll(docFrag) {
    const res = [];
    const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
    for (let n = it.nextNode(); n = it.nextNode();) {
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
      for (let p of e.params)
        params[p] ??= p.split(".");
    return params;
  }

  static listOfExpressions(listOfNodes) {
    return Promise.all(listOfNodes.map(async n => {
      if (n instanceof Text || n instanceof Attr)
        return await EmbraceTextNode.make(n.textContent);
      if (n instanceof Comment) {
        const embrace = await EmbraceCommentFor.make(n.textContent, n.nextSibling) ??
          EmbraceCommentIf.make(n.textContent, n.nextSibling);
        return embrace;
      }
    }));
  }

  constructor(docFrag, expressions, paramsDict) {
    this.template = docFrag;
    this.nodes = EmbraceRoot.flatDomNodesAll(docFrag);
    this.expressions = expressions;
    this.paramsDict = paramsDict;
  }

  clone() {
    return new EmbraceRoot(this.template.cloneNode(true), this.expressions, this.paramsDict);
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
            ex.run(argsDictionary, dataObject, n, ancestor);
  }

  static async make(template) {
    const e = new EmbraceRoot(template);
    e.expressions = await EmbraceRoot.listOfExpressions(e.nodes);
    e.paramsDict = EmbraceRoot.paramDict(e.expressions);
    return e;
  }
}

export function embrace(templ, dataObject) {
  if (this.__embraceRoot)
    return this.__embraceRoot.run({}, dataObject.$ = dataObject, 0, this.ownerElement);
  return EmbraceRoot.make(templ.content).then(e => {
    this.__embraceRoot = e;
    this.ownerElement.append(e.template);
    return this.__embraceRoot.run({}, dataObject.$ = dataObject, 0, this.ownerElement);
  });
}