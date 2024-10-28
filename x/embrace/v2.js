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
  constructor(templ, dollarName, listName) {
    this.listName = listName;
    this.dollarName = dollarName;
    this.d = `$${dollarName}`;
    this.dd = `$$${dollarName}`;
    this.templ = templ.content;
    templ.remove(); //remove the template from the Dom.
    this.cube = new LoopCube(EmbraceRoot.make(this.templ));
  }

  get params() {
    return { [this.listName]: this.listName };
  }

  run(argsDictionary, dataObject, node, ancestor) {
    const now = argsDictionary[this.listName];
    const { embraces, removes, changed } = this.cube.step(now);
    for (let n of removes)
      for (let c of n.nodes) //todo make a prop list on the EmbraceRoot to get all the childNodes only.
        if (!(c instanceof Attr))
          c.remove();
    node.after(...embraces.map(e => e.template));
    for (let i of changed) {
      dataObject[this.d] = now[i];
      dataObject[this.dd] = i;
      embraces[i].run(Object.assign({}, argsDictionary), dataObject, undefined, ancestor);
    }
  }

  //naive, no nested control structures yet. no if. no switch. etc. , untested against errors.
  //startUpTime
  static make(txt, tmpl) {
    const ctrlFor = txt.match(/{{\s*for\s*\(\s*([^\s]+)\s+of\s+([^\s)]+)\)\s*}}/);
    if (ctrlFor) {
      const [_, dollarName, listName] = ctrlFor;
      return new EmbraceCommentFor(tmpl, dollarName, listName);
    }
  }
}

class DomBranch {

  static gobble(n) {
    let txt = n.textContent.trim();
    if (!txt.endsWith("{"))
      return;
    const res = document.createElement("template");
    res.setAttribute("start", txt);
    n.parentNode.replaceChild(n, res);
    for (let n = res.nextSibling; n;) {
      if (n instanceof Comment) {
        txt = n.textContent.trim();
        if (txt[0] === "}") {
          res.setAttribute("end", txt);
          n.remove();
          break;
        }
        DomBranch.gobble(n);  //try to gobble recursively
      }
      const m = n.nextSibling;
      res.content.append(n);
      n = m;
    }
    DomBranch.subsume(res.content);
  }

  static nextUp(n) {
    while (n = n.parentNode)
      if (n.nextSibling)
        return n.nextSibling;
  }

  static subsume(n) {
    for (; n; n = n.firstChild ?? n.nextSibling ?? DomBranch.nextUp(n))
      if (n instanceof Comment)
        DomBranch.gobble(n);
  }
}

class EmbraceRoot {

  static flatDomNodesAll(docFrag) {
    const res = [];
    const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
    for (let n; n = it.nextNode();) {
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

  static make(docFrag) {
    const e = new EmbraceRoot(docFrag);
    e.expressions = EmbraceRoot.listOfExpressions(e.nodes);
    e.paramsDict = EmbraceRoot.paramDict(e.expressions);
    return e;
  }
}

export function embrace(templ, dataObject) {
  if (!this.__embraceRoot) {
    DomBranch.subsume(templ); //recursive once. Move into _t:
    this.__embraceRoot = EmbraceRoot.make(templ);
    this.ownerElement.append(this.__embraceRoot.template);
  }
  this.__embraceRoot.run({}, dataObject, 0, this.ownerElement);
}