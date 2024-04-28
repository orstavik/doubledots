class AutoList {
  #nodes;
  constructor(nodes) {
    this.#nodes = nodes;
  }

  *nodes() {
    yield* this.#nodes;
  }

  getter(prop) {
    //todo if the output are Elements, or Attrs, then make new AutoList
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

//todo move this monad jQuery structure into DoubleDots? Or move it into another file?
//DoubleDots.Lists

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

//   downTarget: 1,// self => target down towards the target
//   downTarget: is the same as target=>up in reverse, stop at current element.
//   sibsNearest: 11, // nearest => next[0], prev[0], next[1], 

// Todo 2: but maybe make the "." be the attribute and then make "---query" be short for -depth..--query and add "--0" as short for a numerical variant.
const firsts = {
  t: `[eventLoop.event.target]`,
  rt: `[eventLoop.event.relatedTarget]`,
  d: `[document]`,
  origin: `this instanceof AutoList ? this.nodes : [this instanceof Element ? this : this instanceof Attr ? this.ownerElement : eventLoop.attribute.ownerElement]`
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

const directionRegEx = new RegExp(`^(_)?(${Object.keys(directions).join("|")})([-]?\\d+)?$`);

function direction(dash, n) {
  const m = dash.match(directionRegEx);
  if (!m)
    return;
  const [_, rev, dir, num] = m;
  if (rev && num)
    throw new DoubleDots.SyntaxError(`${dash} is reverse&Indexed. Just invert the number, it means the same: ${dir}${-parseInt(num)}`);
  const core = directions[dir](n);
  return rev ? `[...${core}].reverse()` : num ? `[[...${core}].at(${num})]` : core;
}

function attrQuerySelector(d, n, length) {
  if (d[0] !== ".")
    return;
  const q = d.substring(1); //replaceAll(".", ":")??
  const core = `[...el${n}.attributes].filter(a => a.startsWith("${q}"))`;
  return n === length - 1 ? core : `new Set(${core}.map(a=>a.ownerElement))`;
}

function dashRule(fullname) {
  const ds = fullname.split("..").map(d => d.substring(1));
  //1. extracting starts
  let pipes = [ds[0] in firsts ? firsts[ds.shift()] : firsts["origin"]];
  //2. fixing implied first direction
  ds[0][0] === "-" && ds.unshift("down");
  //3. parsing the dashes
  for (let i = 0; i < ds.length; i++) {
    const d = ds[i];
    let exp;
    if (d[0] === "-") { 
      // inlining the querySelector, and space.join(" ")ing selectors
      // the space.join(" ") ensures that the implied *down* direction 
      // always applies when direction is implied.
      exp = DoubleDots.miniQuerySelector(d.slice(1));
      for (;i + 1 < ds.length && ds[i + 1][0] === "-";i++)
        exp += " " + DoubleDots.miniQuerySelector(ds[i+1].slice(1));
      pipes.push(pipes.pop().replace("*", exp));
    } else if (exp = direction(d, i) || attrQuerySelector(d, i, ds.length))
      pipes.push(exp);
    else
      throw DoubleDots.SyntaxError("DashRule unknown: " + d);
  }
  //4. converting pipes to for-loop-chain with correct spaces
  pipes = pipes.map((exp, i)=> `for (let el${i} of ${exp})`);
  pipes.push(`res.push(el${pipes.length - 1})`);
  pipes = pipes.map((str, i) => "  ".repeat(i + 1) + str + "\n");
  //5. returning the finished function txt
  return DoubleDots.importBasedEval(`
function ${DoubleDots.kebabToPascal(fullname.slice(1).replaceAll(".", ""))}() {
  const res = [];
${pipes.join("")}
  if (!res.length)
    throw "-dash-rule returned empty: ${fullname}";
  const res2 = res.length === 1 ? res[0] :
    res[0] instanceof Element ? new HTMLElementList(res) :
      AttrList(res);
  return new EventLoop.ReactionOrigin(res2);
}`);
}

document.Reactions.defineRule("-", dashRule);