class ElementIterator {
  #superior;
  constructor(superior) { this.#superior = superior; }
  *elements() { yield* this.#superior.elements(); }
  *attributes() { for (let el of this.elements) yield* el.attributes; }
}

//todo this we need for el, target, relatedTarget
class SingleElementIterator extends ElementIterator {
  #q;
  constructor(q) { this.#q = q; }
  *elements() { yield this.#q(this); }
}

class DirectionIterator extends ElementIterator {

  #generator;
  #num;
  #reverse;

  constructor(superior, generator, reverse, num) {
    super(superior);
    this.#generator = generator;
    this.#num = num;
    this.#reverse = reverse;
  }

  * #core() {
    for (let el of super.elements())
      yield* this.#generator(el);
  }

  *elements() {
    if (!this.#reverse && this.#num === undefined)
      yield* this.#core();
    const res = [...this.#core()];
    this.#reverse && res.reverse();
    if (this.#num === undefined) {
      yield* res;
      return;
    }
    let i = this.#num < 0 ? res.length + this.#num : this.#num;
    yield res[i];
  }
}

class TypeClassQueryIterator extends ElementIterator {
  #query;

  constructor(superior, query) {
    super(superior);
    this.#query = query;
  }

  *elements() {
    for (let el of super.elements())
      if (el.matches(this.#query))
        yield el;
  }
}

class AttributeQueryIterator extends ElementIterator {
  #query;
  constructor(superior, queryString) {
    super(superior);
    //todo shit vocabulary issues.
    this.#query = queryString.replaceAll("_.", ":");
  }
  *elements() {
    const done = new Set();
    for (let at of this.attributes) {
      const el = at.ownerElement;
      if (done.has(el))
        continue;
      done.add(el);
      yield el;
    }
  }
  *attributes() {
    for (let at of super.attributes)
      if (at.name.startsWith(this.#query))
        yield at;
  }
}

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

function propIterator(prop) {
  return function* (el) {
    for (let p = el[prop]; p; p = p[prop])
      yield el;
  };
}

// Todo: especially down should be implemented
//
//   down: 1,// self => target down towards the target
//   widthFirst: right to left. 
//   sibsNearest: 11, // nearest => next[0], prev[0], next[1], 

// Todo 2: use querySelectorWhen possible to speed up traversal
const generators = {
  child: function* (el) { yield* el.children; },
  depth: function* (el) { yield* el.querySelectorAll("*"); },
  width: function* (el) {
    yield* el.children;
    for (let c of el.children)
      yield* this.widthFirst(c);
  },
  root: function* (el) { yield el.getRootNode(); },
  host: function* (el) { yield el.getRootNode().host; },
  roots: function* (el) {
    for (let r = el.getRootNode(); r; r = r.host?.getRootNode())
      yield r;
  },
  hosts: function* (el) {
    for (let h = el.getRootNode().host; h; r = r.getRootNode().host)
      yield h;
  },
  parent: propIterator("parentElement"),
  sibp: propIterator("previousSiblingElement"),
  sibn: propIterator("nextSiblingElement"),
  sibs: function* (el) { yield* el.parentNode.children; }
};

function dashesToIterator(dash, superior) {
  if (dash.startsWith("---"))
    return new AttributeQueryIterator(superior, dash.slice(3));
  if (dash.startsWith("--"))
    return new TypeClassQueryIterator(superior, dash.slice(2));
  dash = dash.slice(1);
  if (dash === "t")  //target
    return new SingleElementIterator(_ => eventLoop.event.target);
  if (dash === "t2") //relatedTarget
    return new SingleElementIterator(_ => eventLoop.event.relatedTarget);
  if (dash === "d")  //d for document
    return new SingleElementIterator(_ => document);

  // "_p12" or "p12" or "_p" or "p"
  const m = dash.match(/^(_)?([a-zA-Z]*)([-]?\d*)$/);
  if (!m)
    throw new DoubleDots.SyntaxError("Bad dash rule segment: " + dash);
  const [_, inverse, gen, num] = m;
  const generator = generators[gen];
  if (!generator)
    throw new DoubleDots.SyntaxError("Bad dash rule generator name: " + gen);
  return new DirectionIterator(superior, generator, !!inverse, num);
}

//todo error handling!!
function listProxy(elements) {
  return new Proxy(elements, {
    get(obj, prop) {
      const res = [];
      const propOg = obj[0][prop];
      if (propOg instanceof Function)
        return function (...args) {
          return obj.map(el => propOg.call(el, ...args));
        };
      res[0] = propOg;
      for (let i = 1; i < obj.length; i++)
        res[i] = obj[i][prop];
      return res;
    },
    set(obj, prop, value) {
      return obj.map(el => (el[prop] = value));
    },
  });
}

function dashRule(fullname) {
  const dashes = fullname.split("..");
  let it = new SingleElementIterator(eventLoop.attribute.ownerElement);
  for (let dash of dashes)
    it = dashesToIterator(dash, it);
  const res = it instanceof AttributeQueryIterator ?
    [...it.attributes()] :
    [...it.elements()];
  return !res.length ? undefined :
    res.length === 1 ? res[0] :
      listProxy(res);
}

document.Reactions.defineRule("-", dashRule);