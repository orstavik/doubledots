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
  constructor(docFrag, nodes, expressions, name) {
    this.name = name;
    this.template = docFrag;
    this.nodes = nodes;
    this.topNodes = [...docFrag.childNodes];
    this.expressions = expressions;
    this.todos = [];
    for (let i = 0; i < expressions.length; i++) {
      const exp = expressions[i];
      if (exp)
        this.todos.push({ exp, node: nodes[i] });
    }
  }

  clone() {
    const docFrag = this.template.cloneNode(true);
    const nodes = [...flatDomNodesAll(docFrag)];
    return new EmbraceRoot(docFrag, nodes, this.expressions/*, this.paramsDict*/, this.name);
  }

  run(argsDictionary, _, ancestor) {
    for (let { exp, node } of this.todos)
      if (ancestor.contains(node.ownerElement ?? node))
        exp.run(argsDictionary, node, ancestor);
  }

  prep(funcs) {
    for (let {exp} of this.todos) {
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
  constructor(exp, name) {
    this.name = name;
    this.exp = exp;
  }

  run(scope, node) {
    node.textContent = this.cb(scope);
  }
}

class EmbraceCommentFor {
  constructor(innerRoot, { varName, exp, ofIn }, name) {
    this.name = name;
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.exp = exp;
    this.cb;
    this.ofIn = ofIn;
    this.iName = `#${varName}`;
    this.dName = `$${varName}`;
  }

  run(args, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    let list = this.cb(args);
    const now = this.ofIn === "in" ? Object.keys(list) : list;
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    node.before(...embraces.map(em => em.template));
    for (let i of changed) {
      const subScope = {};
      subScope[this.varName] = now[i];
      subScope[this.iName] = i;
      if (this.ofIn === "in")
        subScope[this.dName] = list[now[i]];
      embraces[i].run(args(subScope), undefined, ancestor);
    }
  }
}

class EmbraceCommentIf {
  constructor(templateEl, emRoot, exp, name) {
    this.name = name;
    this.innerRoot = emRoot;
    this.templateEl = templateEl;
    this.exp = exp;
  }

  run(argsDict, node, ancestor) {
    const em = node.__ifEmbrace ??= this.innerRoot.clone();
    const test = !!this.cb(argsDict);
    //we are adding state to the em object. instead of the node.
    if (test && !em.state)
      node.before(...em.topNodes);
    else if (!test && em.state)
      this.templateEl.append(...em.topNodes);
    if (test)
      em.run(argsDict({}), undefined, ancestor);
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
  for (let i = 1; i < segs.length; i += 2) {
    let exp = extractArgs(segs[i]);
    segs[i] = `\${(v = ${exp}) === false || v === undefined ? "": v}`;
  }
  for (let i = 0; i < segs.length; i += 2)
    segs[i] = segs[i].replaceAll("`", "\\`");
  return "`" + segs.join("") + "`";
}

function parseFor(text) {
  const ctrlFor = text.match(/^\s*(let|const|var)\s+([^\s]+)\s+(of|in)\s+(.+)\s*$/);
  if (!ctrlFor)
    return;
  const [, , varName, ofIn, exp] = ctrlFor;
  return { varName, ofIn, exp: extractArgs(exp) };
}

function parseTemplate(template, name = "embrace") {
  const nodes = [...flatDomNodesAll(template.content)];
  const expressions = nodes.map((n, i) => parseNode(n, name + "_" + i));
  return new EmbraceRoot(template.content, nodes, expressions, name);
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
        return new EmbraceCommentIf(n, emTempl, res, name);

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
  if (this.__embrace)
    return this.__embrace.run(Object.create(null), dataObject, 0, this.ownerElement);
  this.__embrace = parseTemplate(templ, this.ownerElement.id || "embrace");
  if (DoubleDots.Embraced)
    return this.__embrace.runFirst(this.ownerElement, dataObject, DoubleDots.Embraced);
  const funcs = extractFuncs(this.__embrace.expressions);
  const script = "{" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',') + "}";
  DoubleDots.importBasedEval(script).then(funcsObj => {
    console.log(embraceTutorial(script, this.ownerElement));
    this.__embrace.runFirst(this.ownerElement, dataObject, DoubleDots.Embrace = funcsObj);
  });
}