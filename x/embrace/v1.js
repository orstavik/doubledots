import { LoopCube } from "./LoopCube.js";
import { extractArgs } from "./Tokenizer.js";

//Template engine

function dotScope(data, superior, cache = {}) {
  const me = function scope(path) {
    return path.constructor === Object ? dotScope(data, me, path) :
      path === "$" ? data : cache[path] ??=
        path.split('.').reduce((o, p) => o?.[p], cache) ??
        superior?.(path) ??
        path.split('.').reduce((o, p) => o?.[p], data);
  };
  return me;
}

class EmbraceRoot {
  constructor(docFrag, nodes, expressions, /*paramsDict,*/ name) {
    this.name = name;
    this.template = docFrag;
    this.nodes = nodes;
    this.topNodes = [...docFrag.childNodes];
    this.expressions = expressions;
    // this.paramsDict = paramsDict;
    this.todos = expressions.reduce((res, e, i) => (e && res.push(i), res), []);
  }

  clone() {
    const docFrag = this.template.cloneNode(true);
    const nodes = [...flatDomNodesAll(docFrag)];
    return new EmbraceRoot(docFrag, nodes, this.expressions/*, this.paramsDict*/, this.name);
  }

  run(argsDictionary, _, ancestor) {
    //1. make the argumentsDictionary
    // for (let param in this.paramsDict)
    //   argsDictionary[param] ??= this.paramsDict[param].reduce((o, p) => o?.[p], dataObject);
    //2. run rules
    for (let i of this.todos) {
      const ex = this.expressions[i], n = this.nodes[i];
      if (ancestor.contains(n.ownerElement ?? n))
        ex.run(argsDictionary, n, ancestor);
    }
  }

  prep(funcs) {
    for (let i of this.todos) {
      const exp = this.expressions[i];
      exp.cb = funcs[exp.name];
      exp.innerRoot?.prep(funcs);
    }
  }

  runFirst(el, dataObject, funcs) {
    this.prep(funcs);
    el.prepend(...this.topNodes);
    this.run(dotScope(dataObject), 0, el);
  }
}

class EmbraceTextNode {
  constructor({ /*params,*/ exp }, name) {
    this.name = name;
    // this.params = params;
    this.exp = exp;
    this.cb;
  }

  run(argsDict, /*dataIn,*/ node, ancestor) {
    node.textContent = this.cb(argsDict);
  }
}

class EmbraceCommentFor {
  constructor(innerRoot, { varName, exp, /*params,*/ ofIn }, name) {
    this.name = name;
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.exp = exp;
    this.cb;
    this.ofIn = ofIn;
    this.iName = `#${varName}`;
    // this.params = params;
    this.dName = `$${varName}`;
  }

  run(args, /*data,*/ node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    let list = this.cb(args);
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
    // const a = data[this.varName], b = data[this.iName], c = data[this.dName];
    for (let i of changed) {
      const subScope = {};
      subScope[this.varName] = now[i];
      subScope[this.iName] = i;
      if (this.ofIn === "in")
        subScope[this.dName] = list[now[i]];
      embraces[i].run(args(subScope)/*, data*/, undefined, ancestor);
    }
    // data[this.varName] = a, data[this.iName] = b, data[this.dName] = c;
  }
}

class EmbraceCommentIf {
  constructor(templateEl, emRoot, { exp/*, params*/ }, name) {
    this.name = name;
    this.innerRoot = emRoot;
    this.templateEl = templateEl;
    this.exp = exp;
    this.cb;
    // this.params = params;
  }

  run(argsDict, /*dataObject,*/ node, ancestor) {
    const em = node.__ifEmbrace ??= this.innerRoot.clone();
    const test = !!this.cb(argsDict);
    //we are adding state to the em object. instead of the node.
    if (test && !em.state)
      node.before(...em.topNodes);
    else if (!test && em.state)
      this.templateEl.append(...em.topNodes);
    if (test)
      em.run(argsDict({}),/* dataObject,*/ undefined, ancestor);
    em.state = test;
  }
}

//PARSER
function* flatDomNodesAll(docFrag) {
  const it = document.createNodeIterator(docFrag, NodeFilter.SHOW_ALL);
  for (let n = it.nextNode(); n = it.nextNode();) {
    yield n;
    if (n instanceof Element) yield* n.attributes;
  }
}

function parseTextNode({ textContent }) {
  const segs = textContent.split(/{{([^}]+)}}/);
  if (segs.length === 1)
    return;
  // let params = {}, exp;
  for (let i = 1; i < segs.length; i += 2) {
    let exp = extractArgs(segs[i]/*, params*/);
    segs[i] = `\${(v = ${exp}) === false || v === undefined ? "": v}`;
  }
  for (let i = 0; i < segs.length; i += 2)
    segs[i] = segs[i].replaceAll("`", "\\`");
  return { /*params,*/ exp: "`" + segs.join("") + "`" };
}

function parseFor(text) {
  const ctrlFor = text.match(/^\s*(let|const|var)\s+([^\s]+)\s+(of|in)\s+(.+)\s*$/);
  if (!ctrlFor)
    return;
  const [, , varName, ofIn, exp] = ctrlFor;
  return { varName, ofIn, exp: extractArgs(exp) };
}

// function paramDict(expressions) {
//   const res = {};
//   for (let e of expressions)
//     if (e?.params)
//       for (let path in e.params)
//         res[path] = path.split(".");
//   return res;
// }

function parseTemplate(template, name = "embrace") {
  const nodes = [...flatDomNodesAll(template.content)];
  const expressions = nodes.map((n, i) => parseNode(n, name + "_" + i));
  // const paramsDict = paramDict(expressions);
  return new EmbraceRoot(template.content, nodes, expressions/*, paramsDict*/, name);
}

function parseNode(n, name) {
  let res;
  if (n instanceof Text || n instanceof Attr) {
    if (res = parseTextNode(n))
      return new EmbraceTextNode(res, name);
  } else if (n instanceof HTMLTemplateElement) {
    const emTempl = parseTemplate(n, name);
    if (res = n.getAttribute("for"))
      if (res = parseFor(res))
        return new EmbraceCommentFor(emTempl, res, name);

    if (res = n.getAttribute("if"))
      if (res = extractArgs(res))
        return new EmbraceCommentIf(n, emTempl, { exp: res }, name);

    return emTempl;
  }
}

function extractFuncs(expressions) {
  const funcs = {};
  for (let exp of expressions) {
    if (exp?.exp)
      funcs[exp.name] = `function ${exp.name}(args, v) { return ${exp.exp}; }`;
    if (exp?.innerRoot)
      Object.assign(funcs, extractFuncs(exp.innerRoot.expressions));
  }
  return funcs;
}

//TUTORIAL

function embraceTutorial(script, ownerElement) {
  return `
#################################
#  Embrace production tutorial: #
#################################

1. add the following script in the <head> element:

<script embraced="${ownerElement.id}">
  window.Embrace.${ownerElement.id} = ${script};
</script>


2. update the content of this element:

${ownerElement.outerHTML}

#################################
`;
}

// :embrace
export function embrace(templ, dataObject) {
  // dataObject = Object.assign({ $: dataObject }, dataObject);
  //1. we have already run the embrace before, we run it again.
  if (this.__embrace)
    return this.__embrace.run(Object.create(null), dataObject, 0, this.ownerElement);

  const id = this.ownerElement.id; //todo we need to turn this into a good name.
  //2. we parse the template. 
  this.__embrace = parseTemplate(templ); //todo give each node a name here..
  const funcs = extractFuncs(this.__embrace.expressions);

  if (DoubleDots.Embraced)
    return this.__embrace.runFirst(this.ownerElement, dataObject, DoubleDots.Embraced);

  const script = "{" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',') + "}";
  DoubleDots.importBasedEval(script).then(funcsObj => {
    console.log(embraceTutorial(script, this.ownerElement));
    this.__embrace.runFirst(this.ownerElement, dataObject, DoubleDots.Embrace = funcsObj);
  });
}