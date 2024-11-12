import { LoopCube } from "./LoopCube.js";
import { extractArgs, interpretTemplateString } from "./Tokenizer.js";

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
    return new EmbraceRoot(this.name, docFrag, nodes, this.expressions);
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
  constructor(name, innerRoot, varName, ofIn, exp) {
    this.name = name;
    this.innerRoot = innerRoot;
    this.varName = varName;
    this.exp = exp;
    this.cb;
    this.ofIn = ofIn;
    this.iName = `#${varName}`;
    this.dName = `$${varName}`;
  }

  //todo 1. remove the let/const/var part of the expression
  //todo 2. fix the key+value check for dictionary looping
  //todo 3. remove the in. If the entity being looped doesn't have an @iterator,
  //todo    then we need to iterate it as an entry set
  //todo 4. the reverse the ref/$ref set for the values in the dict iterator.
  //        the plain ref => the value
  //        the $ref => the key in the dictionary. Like #0 is the number.
  run(scope, node, ancestor) {
    const cube = node.__cube ??= new LoopCube(this.innerRoot);
    let list = this.cb(scope) ?? [];
    //todo When we are iterating a dictionary, we are iterating entry sets, not just keys.
    //todo We must check that both [key, value] are unchanged, not just key.
    //todo The cube.step() should therefore check against an array[k,v]
    const now = this.ofIn === "in" ? Object.keys(list) : list;
    const { embraces, removes, changed } = cube.step(now);
    for (let em of removes)
      for (let n of em.topNodes)
        n.remove();
    node.before(...embraces.map(em => em.template));
    //todo update the number and then update the value.
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
  constructor(name, templateEl, emRoot, exp) {
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
      const ctrlFor = res.match(/^\s*([^\s]+)\s+(of|in)\s+(.+)\s*$/);
      if (!ctrlFor)
        throw new SyntaxError("embrace for error: " + res);
      const [, varName, ofIn, exp] = ctrlFor;
      return new EmbraceCommentFor(name, emTempl, varName, ofIn, exp);
    }
    if (res = n.getAttribute("if"))
      return new EmbraceCommentIf(name, n, emTempl, res);
    return emTempl;
  }
}

function extractFuncs(root, res = {}) {
  for (let { exp } of root.todos) {
    const code =
      exp instanceof EmbraceTextNode ? interpretTemplateString(exp.exp) :
        exp instanceof EmbraceCommentFor ? extractArgs(exp.exp) :
          exp instanceof EmbraceCommentIf ? extractArgs(exp.exp) :
            undefined;
    res[exp.name] = `(args, v) => ${code}`;
    if (exp.innerRoot)
      extractFuncs(exp.innerRoot, res);
  }
  return res;
}

//TUTORIAL

function hashDebug(script, id) {
  return `Add the following script in the <head> element:

<script embrace="${id}">
  (window.Embrace ??= {})["${id}"] = ${script};
</script>`;
}

// :embrace
export function embrace(templ, dataObject) {
  if (this.__embrace)
    return this.__embrace.run(Object.create(null), dataObject, 0, this.ownerElement);
  const id = this.ownerElement.id || "embrace";
  this.__embrace = parseTemplate(templ, id);
  if (window.Embrace?.[id])
    return this.__embrace.runFirst(this.ownerElement, dataObject, window.Embrace[id]);
  const funcs = extractFuncs(this.__embrace);
  const script = "{\n" + Object.entries(funcs).map(([k, v]) => `${k}: ${v}`).join(',\n') + "\n}";
  DoubleDots.importBasedEval(script).then(funcs => {
    DoubleDots.log?.(":embrace production", hashDebug(script, id));
    (window.Embrace ??= {})[id] = funcs;
    this.__embrace.runFirst(this.ownerElement, dataObject, funcs);
  });
}