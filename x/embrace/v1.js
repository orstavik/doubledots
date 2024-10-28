class LoopCube {
  static compareSmall(old, now) {
    const exact = new Array(now.length);
    const unused = [];
    if (!old?.length)
      return { exact, unused };
    main: for (let o = 0; o < old.length; o++) {
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

  constructor(embrace) {
    this.embrace = embrace;
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
    const removes = unused.map(o => oldEmbraces[o]);
    return { embraces, removes, changed };
  }
}

class EmbraceGet {
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
}

class EmbraceTextNode {
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
    //split the segment
    const segs = txt.split(/{{([^}]+)}}/);
    if (segs.length === 1)
      return;
    //convert splits to bigEs
    for (let i = 1; i < segs.length; i += 2) {
      segs[i] = EmbraceGet.make(segs[i].trim()) ?? `{{${segs[i]}}}`;
      if (!(segs[i] instanceof EmbraceGet))
        console.error(`invalid embrace expression: ${segs[i]}`);//todo throw error in the EmbraceExp
    }
    return new EmbraceTextNode(segs);
  }
}

class EmbraceCommentFor {
  constructor(templ, varName, listName) {
    this.listName = listName;
    this.varName = varName;
    this.iName = `#${varName}`;
    // this.dd = `$$${dollarName}`;
    this.template = templ; 
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
  static make(txt, tmpl) {
    const ctrlFor = txt.match(/{{\s*for\s*\(\s*(let|const|var)\s+([^\s]+)\s+of\s+([^\s)]+)\)\s*}}/);
    if (ctrlFor) {
      const [_, constLetVar, varName, listName] = ctrlFor;
      return new EmbraceCommentFor(tmpl, varName, listName);
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
      for (let p in e.params)
        params[p] ??= p.split(".");
    return params;
  }

  static listOfExpressions(listOfNodes) {
    return listOfNodes.map(n => {
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

  static make(template) {
    const e = new EmbraceRoot(template.content);
    e.expressions = EmbraceRoot.listOfExpressions(e.nodes);
    e.paramsDict = EmbraceRoot.paramDict(e.expressions);
    return e;
  }
}

export function embrace(templ, dataObject) {
  if (!this.__embraceRoot) {
    this.__embraceRoot = EmbraceRoot.make(templ);
    this.ownerElement.append(this.__embraceRoot.template);
  }
  this.__embraceRoot.run({}, dataObject, 0, this.ownerElement);
}