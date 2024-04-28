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
const tags = {
  t: n => `for (let el${n} of [eventLoop.event.target])`,
  rt: n => `for (let el${n} of [eventLoop.event.relatedTarget])`,
  d: n => `for (let el${n} of [document])`,
  default: n => `for (let el${n} of this instanceof AutoList ? this.nodes : [this instanceof Element ? this : this instanceof Attr ? this.ownerElement :  eventLoop.attribute.ownerElement])`,

  //todo .querySelectorAll(":scope ~ *") doesn't work..
  //todo .querySelectorAll(":scope:has(++)") I don't even bother testing.


  c: n => `for (let el${n} of el${n - 1}.querySelectorAll(":scope > *"))`,
  sibs: n => `for (let el${n} of el${n - 1}.parentNode.querySelectorAll(":scope > *"))`,down: n => `for (let el${n} of el${n - 1}.querySelectorAll("*"))`,
  up: n => `for (let el${n} of DoubleDots.up(el${n - 1}, "*"))`,
  left: n => `for (let el${n} of DoubleDots.left(el${n - 1}, "*"))`,
  right: n => `for (let el${n} of DoubleDots.right(el${n - 1}, "*"))`,
  roots: n => `for (let el${n} of DoubleDots.roots(el${n - 1}, "*"))`,
  hosts: n => `for (let el${n} of DoubleDots.hosts(el${n - 1}, "*"))`,
  downwide: n => `for (let el${n} of DoubleDots.downWide(el${n - 1}, "*"))`,
};

function reverse(n) {
  return `(tmp${n} ||= []).push(el${n - 1});
}{
  let x = tmp1;
  tmp1 = [];
  for (let el${n};el${n}=x.pop();)`;
}

function count(c) {
  return n =>
    `if(tmp${n}>${c}) {tmp${n}=0; break;} else if (tmp${n}++ == ${c} && (el${n}=el${n - 1}))`;
}

function negCount(c) {
  return n =>
    `(tmp${n} ||= []).push(el${n - 1});
}{
let el${n} = tmp${n}[tmp${n}.length + ${num}]; 
tmp${n} = [];`;
}

function direction(dash) {
  const m = dash.match(/^(_)?([a-zA-Z]+)([-]?\d+)?$/);
  if (!m)
    throw new DoubleDots.SyntaxError("Unknown dash: " + dash);
  let [_, rev, dir, num] = m;
  num = parseInt(num);
  if (!(dir in tags))
    throw new DoubleDots.SyntaxError("Bad dash rule generator name: " + dir);
  const res = [tags[dir]];
  rev && res.push(reverse);
  !isNaN(num) && res.push(num < 0 ? negCount(num) : count(num));
  return res;
}


function miniQuerySelects(d) {

  const queries = {
    "-": q => n => `for(let el${n} = el${n - 1}; el${n}?.matches("${q}"); el${n} = null)`,
    ".": q => n => `for (let el${n} of el${n - 1}.querySelectorAll("${q}"))`,
  };

  for (let key in queries)
    if (d.startsWith(key))
      return queries[key](DoubleDots.miniQuerySelector(d.slice(key.length)));
}

function wrapper(body, fullname, size) {
  const funcName = DoubleDots.kebabToPascal(fullname.slice(1).replaceAll(".", "_"));
  const tmps = Array.from({ length: size }, (_, i) => `el${i}, tmp${i}=0`);
  const tmpStr = tmps.join(", ");
  return `function ${funcName} (oi) {
  const res = [];
  let ${tmpStr};
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
  ["r", "rt", "d"].includes(ds[0]) || ds.unshift("default");
  // throw new SyntaxError("-rt, -t, or -d must be the first dash rule");
  const pipe = ds.map(d => miniQuerySelects(d) || direction(d)).flat();
  const strs = pipe.map((fun, i) => fun(i)).reverse();
  let body = `res.push(el${strs.length - 1});`;
  for (let str of strs)
    body = `${str}{\n  ${body.replaceAll("\n", "\n  ")}\n}`;
  const functionText = wrapper(body, fullname, pipe.length);
  return DoubleDots.importBasedEval(functionText);
}

document.Reactions.defineRule("-", dashRule);