class AutoList {
  #nodes;
  constructor(nodes) {
    this.#nodes = nodes;
  }

  get nodes() {
    return [...this.#nodes];
  }

  getter(prop) {
    debugger;
    return Array.prototype.map.call(this.#nodes, n => n[prop]);
  }

  setter(prop, val) {
    debugger;
    Array.prototype.map.call(this.#nodes, n => n[prop] = val);
    return this;
  }

  func(prop) {
    debugger;
    return (...args) => {
      debugger;
      return Array.prototype.map.call(this.#nodes, n => n[prop](...args));
    };
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
// document.Reactions.define("-oi", oi => new EventLoop.ReactionOrigin(oi));
// document.Reactions.define("-e", _ => new EventLoop.ReactionOrigin(eventLoop.event));
// document.Reactions.define("-w", _ => new EventLoop.ReactionOrigin(window));

// 2. lowered doubledots = '..' 
// 
// ".." as local psynonym for ":". I think that we should likely make this a global soft convention. As a way to speed up the reaction calls. This enables a hatch if you don't want to break the ":" in the sgml spec.
//The .. as a convention for a "lowered doubledots" that enable chaining
//inside the dash-rule.
//If the dash-rule allow for chaining internally, then we can make it static at the beginning. And that gives clear benefits.

//3. -dash rule starts with the single node that is the ownerElement.

// produce either a single node, or a DomNodeIterator. A special node that will return 

// Todo: especially down should be implemented
//
//   down: 1,// self => target down towards the target
//   widthFirst: right to left. 
//   sibsNearest: 11, // nearest => next[0], prev[0], next[1], 


// Todo 2: use querySelectorWhen possible to speed up traversal
const singleNodeGenerators = {
  t: function* () { yield eventLoop.event.target; },
  rt: function* () { yield eventLoop.event.relatedTarget; },
  d: function* () { yield document; }
};

const generators = {
  c: function* (it) {
    for (let el of it)
      yield* el.children;
  },
  depth: function* (it) {
    for (let el of it)
      yield* el.querySelectorAll("*");
  },
  width: function* widthFirst(iterable) {
    const queue = [iterable];
    while (queue.length) {
      const it = queue.shift();
      for (let el of it) {
        yield it;
        el.children?.length && queue.push(el.children);
      }
    }
  },
  //roots0 is just the root and hosts0 is just host.
  roots: function* (it) {
    for (let el of it)
      for (let r = el.getRootNode(); r; r = r.host?.getRootNode())
        yield r;
  },
  hosts: function* (it) {
    for (let el of it)
      for (let h = el.getRootNode().host; h; r = r.getRootNode().host)
        yield h;
  },
  p: function* parentElements(it) {
    for (let el of it)
      for (let p = el.parentElement; p; p = p.parentElement)
        yield p;
  },
  sibp: function* previousSiblings(it) {
    for (let el of it)
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling)
        yield s;
  },
  sibn: function* nextSiblings(it) {
    for (let el of it)
      for (let s = el.nextElementSibling; s; s = s.nextElementSibling)
        yield s;
  },
  sibs: function* (it) {
    for (let el of it)
      yield* el.parentNode.children;
  }
};

function makeGenerator(reverse, dir, num) {
  let generator = generators[dir];
  if (!generator)
    throw new DoubleDots.SyntaxError("Bad dash rule generator name: " + dir);
  if (reverse)
    generator = function* (it) {
      const res = [...generator(it)];
      res.reverse();
      yield* res;
    };
  if (isNaN(num))
    return generator;
  if (num < 0) {
    return function* (it) {
      const res = [...generator(it)];
      yield res[res.length + num];
    };
  }
  return function* (it) {
    let i = num;
    for (let el of generator(it))
      if (!i--) {
        yield el;
        return;
      }
  };
}



//todo memoize it
function toGenerator(dash, isFirst, isLast) {
  const single = singleNodeGenerators[dash];
  if (single) {
    if (!isFirst)
      throw new SyntaxError("-rt, -t, or -d must be the first dash rule");
    return single;
  }
  if (dash.startsWith("--")) {
    const query = dash.substring(2);
    return isLast ? function* (it) {
      for (let el of it)
        for (let at of el.attributes)
          if (at.name.startsWith(query))
            yield at;
    } :
      function* (it) {
        for (let el of it)
          for (let at of el.attributes) {
            if (at.name.startsWith(query)) {
              yield el;
              break;
            }
          }
      };
  }
  if (dash.startsWith("-")) {
    const query = dash.substring(1);
    return function* (it) {
      for (let el of it)
        if (el.matches(query))
          yield el;
    };
  }
  if (dash.startsWith(".")) {
    const query = dash.substring(1);
    return function* (it) {
      for (let el of it)
        yield* el.querySelectorAll(query);
    };
  }
  // "_p12" or "p12" or "_p" or "p"
  const m = dash.match(/^(_)?([a-zA-Z]+)([-]?\d+)?$/);
  if (!m)
    throw new DoubleDots.SyntaxError("Unknown dash: " + dash);
  const [_, reverse, dir, num] = m;
  return makeGenerator(reverse, dir, parseInt(num));
}

function pipeGenerators(generators, iterable) {
  for (let gen of generators)
    iterable = gen(iterable);
  return iterable;
}

function dashRule(fullname) {
  const ds = fullname.split("..").map(d => d.substring(1));
  const its = ds.map((d, i) => toGenerator(d, i == 0, i == ds.length - 1));

  return function dashExpression() {
    const origin = this instanceof Element ? [this] :
      this instanceof Attr ? [this.ownerElement] :
        this instanceof AutoList ? this.nodes :
          [eventLoop.attribute.ownerElement];
    const pipeGenerator = pipeGenerators(its, origin);
    let res = [...pipeGenerator];
    if (!res.length)
      throw "dash-rule returned empty: " + fullname;
    res = res.length === 1 ? res[0] :
      res[0] instanceof Element ? HTMLElementList(res) :
        AttrList(res);
    return new EventLoop.ReactionOrigin(res);
  };
}

document.Reactions.defineRule("-", dashRule);