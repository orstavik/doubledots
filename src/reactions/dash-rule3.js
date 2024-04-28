class AutoList {
  #nodes;
  constructor(nodes) {
    this.#nodes = nodes;
  }

  *nodes() {
    yield* this.#nodes;
  }

  getter(prop) {
    return Array.prototype.map.call(this.#nodes, n => n[prop]);
  }

  setter(prop, val) {
    Array.prototype.map.call(this.#nodes, n => n[prop] = val);
    return this;
  }

  func(prop) {
    return (...args) => Array.prototype.map.call(this.#nodes, n => n[prop](...args));
  }
}

function expandPropsToList(ListClass, ...ItemClasses) {
  for (let ItemClass of ItemClasses)
    for (let prop of Object.getOwnPropertyNames(ItemClass.prototype)) {
      if (prop in ListClass.prototype)
        continue;
      const d = Object.getOwnPropertyDescriptor(ItemClass.prototype, prop);
      if (d.get) d.get = function () { this.getter(prop); };
      if (d.set) d.set = function (val) { this.setter(prop, val); };
      if (d.value instanceof Function)
        d.value = function () { this.func(prop); };
      Object.defineProperty(ListClass.prototype, prop, d);
    }
}

class HTMLElementList extends AutoList { };
class AttrList extends AutoList { };
expandPropsToList(HTMLElementList, HTMLElement, Element, Node, EventTarget);
expandPropsToList(AttrList, AttrCustom, Attr, Node, EventTarget);

//the two AutoLists are super simplistic jQuery versions for manipulation. Will likely produce many errors if used extensively..


// 1. NOT e,oi,window
//  e,oi,window are not directions! This dash-rule is for dom node origins only. We use the .-dot rules for e, oi, window.
// so NONE of this:
// document.Reactions.define("-oi", oi => new EventLoop.ReactionOrigin(oi));
// document.Reactions.define("-e", _ => new EventLoop.ReactionOrigin(eventLoop.event));
// document.Reactions.define("-w", _ => new EventLoop.ReactionOrigin(window));

// 2. lowered doubledots = '..' 
// 
// ".." as local psynonym for ":". I think that we should likely make this a global soft convention. As a way to speed up the reaction calls. This enables a hatch if you don't want to break the ":" in the sgml spec.
//The .. as a convention for a "lowered doubledots" that enable chaining
//inside the dash-rule.
//If the dash-rule allow for chaining internally, then we can make it 
//static at the beginning. But we don't. If `this` is a valid origin, we go dynamic.
//
//todo PROBLEM: how to do lowered doubledots in the attribute query? ".." conflicts with the nesting, should we do "_."? Or should we say that "." is illegal in trigger names? So we will just match with full trigger names?
//todo empty: use `-..-something` as a way to make a static dash selector?

//3. -dash rule starts with the single node that is the ownerElement.

// produce either a single node, or a DomNodeIterator. A special node that will return 

// Todo: especially down should be implemented
//
//   down: 1,// self => target down towards the target
//   widthFirst: right to left. 
//   sibsNearest: 11, // nearest => next[0], prev[0], next[1], 


// Todo 2: use querySelectorWhen possible to speed up traversal
// Todo 2: for example -c..--input => querySelectorAll(':root > input')
// Todo 2: this is possible with -c/sibp/sibn/depth..--query
// Todo 2: -depth..--query already has the -.query
// Todo 2: but maybe make the "." be the attribute and then make "---query" be short for -depth..--query and add "--0" as short for a numerical variant.
const firsts = {
  t: `[eventLoop.event.target]`,
  rt: `[eventLoop.event.relatedTarget]`,
  d: `[document]`,
  default: `this instanceof AutoList ? this.nodes : [this instanceof Element ? this : this instanceof Attr ? this.ownerElement : eventLoop.attribute.ownerElement]`
};

const directions = {
  //todo .querySelectorAll(":scope ~ *") doesn't work..
  //todo .querySelectorAll(":scope:has(++)") I don't even bother testing.
  c: n => `el${n}.querySelectorAll(":scope > *")`,
  sibs: n => `el${n}.parentNode.querySelectorAll(":scope > *")`,
  down: n => `el${n}.querySelectorAll("*")`,
  up: n => `DoubleDots.up(el${n}, "*")`,
  left: n => `DoubleDots.left(el${n}, "*")`,
  right: n => `DoubleDots.right(el${n}, "*")`,
  roots: n => `DoubleDots.roots(el${n}, "*")`,
  hosts: n => `DoubleDots.hosts(el${n}, "*")`,
  downwide: n => `DoubleDots.downWide(el${n}, "*")`,
};

function attrQuery(q) {
  return;
}

function direction(dash) {
  const m = dash.match(/^(_)?([a-zA-Z]+)([-]?\d+)?$/);
  if (!m)
    throw new DoubleDots.SyntaxError("Unknown dash: " + dash);
  let [_, rev, dir, num] = m;
  let gen = directions[dir];
  if (!gen)
    throw new DoubleDots.SyntaxError("Dash direction unknown: " + dir);
  num = parseInt(num);
  if (rev && !isNaN(num))
    throw new DoubleDots.SyntaxError(`${dash} is reverse+indexed. Just invert the number, it means the same: ${dir}${-num}`);
  else if (rev)
    return n => `[...${gen(n)}].reverse()`;
  else if (num)
    return n => `[...${gen(n)}].at(${num})`;
  return gen;
}

function miniQuerySelector(d) {
  return d[0] === "-" && DoubleDots.miniQuerySelector(d.substring(1));
}

function endAttrQuerySelector(d) {
  if (d[0] !== ".")
    return;
  const q = d.substring(1);
  return n => `[...el${n}.attributes].filter(a => a.startsWith("${q}"))`;
}

function middleAttrQuerySelector(d) {
  if (d[0] !== ".")
    return;
  const q = d.substring(1);
  return n => `new Set([...el${n}.attributes].filter(a => a.startsWith("${q}")).map(a=>a.ownerElement))`;
}

function wrapper(body, fullname, size) {
  const funcName = DoubleDots.kebabToPascal(fullname.slice(1).replaceAll(".", "_"));
  const els = Array.from({ length: size }, (_, i) => `el${i}`).join(", ");
  return `function ${funcName}(oi) {
  let ${els};
  const res = [];
${body}
  if (!res.length)
    throw "dash-rule returned empty: ${fullname}";
  const res2 = res.length === 1 ? res[0] :
    res[0] instanceof Element ? HTMLElementList(res) :
      AttrList(res);
  return new EventLoop.ReactionOrigin(res2);
}`;
}

function dashRule(fullname) {
  const ds = fullname.split("..").map(d => d.substring(1));
  //1. fixing implied starts
  const pipes = [];
  const start = firsts[["t", "rt", "d"].includes(ds[0]) ? ds.shift() : "default"];
  pipes.push(start);


  if (ds[0][0] === "-")
    ds.unshift("down");

  for (let i = 0; i < ds.length; i++) {
    const d = ds[i];
    let exp;
    //inlining the querySelector
    //todo we must make sure that querySelectors are not added twice in a row.
    //todo if they are, then they are nested. and we should just space .join(" ") them
    if (exp = miniQuerySelector(d))
      pipes[pipes.length - 1] = pipes[pipes.length - 1].replace("*", exp);
    else if (exp = direction(d))
      pipes.push(exp(i));
    else if (exp = middleAttrQuerySelector(d)) //todo untested
      pipes.push(exp(i));
    else if (exp = endAttrQuerySelector(d)) //todo untested
      pipes.push(exp(i));
    else
      throw DoubleDots.SyntaxError("DashRule unknown");
  }

  const iters = pipes.map((pipe, i) => `for (el${i} of ${pipe})`);
  iters.push(`res.push(el${pipes.length - 1})`);
  const body = iters.map((str, i) => "  ".repeat(i + 1) + str).join("\n");
  const functionText = wrapper(body, fullname, pipes.length);
  return DoubleDots.importBasedEval(functionText);
}

document.Reactions.defineRule("-", dashRule);