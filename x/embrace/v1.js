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
    for (let i = 0; i < expressions.length; i++)
      if (expressions[i])
        this.todos.push({ exp: expressions[i], node: nodes[i] });
  }

  clone() {
    const docFrag = this.template.cloneNode(true);
    const nodes = [...flatDomNodesAll(docFrag)];
    return new EmbraceRoot(docFrag, nodes, this.expressions, this.name);
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
}

class EmbraceTextNode {
  constructor(name, exp) {
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

  run(scope, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    let list = this.cb(scope);
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
      embraces[i].run(scope(subScope), undefined, ancestor);
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

function parseTemplate(template, name = "embrace") {
  const nodes = [...flatDomNodesAll(template.content)];
  const expressions = nodes.map((n, i) => parseNode(n, name + "_" + i));
  return new EmbraceRoot(template.content, nodes, expressions, name);
}

function parseNode(n, name) {
  let res;
  if (n instanceof Text || n instanceof Attr) {
    if (n.textContent.match(/{{([^}]+)}}/))
      return new EmbraceTextNode(name, n.textContent);
  } else if (n instanceof HTMLTemplateElement) {
    const emTempl = parseTemplate(n, name);
    if (res = n.getAttribute("for")) {
      const ctrlFor = res.match(/^\s*(let|const|var)\s+([^\s]+)\s+(of|in)\s+(.+)\s*$/);
      if (!ctrlFor)
        throw new SyntaxError("embrace for error: " + res);
      const [, , varName, ofIn, exp] = ctrlFor;
      res = { varName, ofIn, exp };
      return new EmbraceCommentFor(emTempl, res, name);
    }
    if (res = n.getAttribute("if"))
      return new EmbraceCommentIf(n, emTempl, res, name);
    return emTempl;
  }
}

function textContentFunc(textContent) {
  return `\`${textContent.split(/{{([^}]+)}}/).map((str, i) =>
    i % 2 ?
      `\${(v = ${extractArgs(str)}) === false || v === undefined ? "": v}` :
      str.replaceAll("`", "\\`")).join("")}\``;
}

function extractFuncs(root, res = {}) {
  for (let { exp } of root.todos) {
    const code =
      exp instanceof EmbraceTextNode ? textContentFunc(exp.exp) :
        exp instanceof EmbraceCommentFor ? extractArgs(exp.exp) :
          exp instanceof EmbraceCommentIf ? extractArgs(exp.exp) :
            undefined;
    res[exp.name] = `function ${exp.name}(args, v) { return ${code}; }`;
    if (exp.innerRoot)
      extractFuncs(exp.innerRoot, res);
  }
  return res;
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
  const funcs = extractFuncs(this.__embrace);
  const script = "{" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',') + "}";
  DoubleDots.importBasedEval(script).then(funcsObj => {
    console.log(embraceTutorial(script, this.ownerElement));
    this.__embrace.runFirst(this.ownerElement, dataObject, DoubleDots.Embrace = funcsObj);
  });
}