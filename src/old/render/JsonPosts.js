function keyedArray(entries) {
  const res = new Array(entries.length);
  entries.forEach(([k, v], i) => (res[k] = v, res[i] = v));
  return res;
}

function getPosts(typeSlug, db, root) {
  if (!typeSlug) return root.ancestor.posts; //these are keyed props?
  if (!typeSlug.endsWith("/")) return [typeSlug, db[typeSlug]];
  return Object.entries(db).filter(([k, v]) => k.startsWith(typeSlug));
}

function jsonQuery(value, root) {
  const qs = value.split(",");
  const res = [];
  for (let q of qs) {
    const [typeSlug, ...props] = q.split(".");

    const values = posts.map(([k, v]) => props.length ? props.reduce((res, p) => res?.[p], post) : post);
    res.push(...values);
  }
  const res2 = new Array(res.length);
  let i = 0;
  for (let [key, value] of res)
    res2[i++] = value, res2[key] = value;
  return res2;


  return res.map((v, i) => ({ value: v, done: i === res.length - 1 }));
  return res;
}



export class AttributeIterator {

  constructor(root, Type = Attr) {
    this.elIt = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
    this.Type = Type;
    this.attr = undefined;
    this.nextElement();
  }

  nextElement() {
    this.el = this.elIt.nextNode();
    this.i = 0;
    this.attributes = this.el ? Array.from(this.el.attributes) : EMPTY;
  }

  next() {
    while (this.el?.isConnected) {
      while (this.i < this.attributes.length) {
        this.attr = this.attributes[this.i++];
        if (this.attr.ownerElement)           //skip removed attributes
          if (this.attr instanceof this.Type) //if Type === Attr, then no filter
            return { value: this.attr, done: false };
      }
      this.nextElement();
    }
    this.attr = undefined;
    return { done: true };
  }

  [Symbol.iterator]() { return this; }
}


//these are globals. might as well treat them as globals.
const EMPTY = [];
let db;
let E;
const postCache = new WeakMap();

class PostAttrIterator extends AttributeIterator {
  constructor(root) {
    super(root, PostAttr);
  }
  next() {
    while (true) {
      const i = super.next();
      if (i.done) return i;
      // super.nextElement();
      const attr = i.value, post = attr.post;
      const prevPost = postCache.get(attr);
      if (prevPost === post) continue;
      //if(all keys and values are the same) continue;
      //else
      postCache.set(attr, post);
      return i;
    }
  }
}

//todo we could keep track of the top node, in order for us to not iterate through unnecessary elements. That would be equal to keeping track of all the ownerElements, making it possible to find the top root. we wait with this efficiency. we naively iterate all.
class PostAttr extends AttrCustom {
  upgrade() { this.onePerElement(); this.check() && propagate(this.ownerElement); }
  set value(v) { super.value = v; this.check() && propagate(this.ownerElement); }
  get value() { return super.value; }
  onePerElement() {
    for (let a of this.ownerElement.attributes)
      if (a instanceof PostAttr && a !== this)
        throw new Error("An element can only hold one PostAttr.");
  }
  check() {
    if (!E?.active && this.post !== postCache.get(this))
      return true;
    if (!E?.active || E.scope.contains(this.ownerElement) && E.scope !== this.ownerElement)
      return false;
    throw new Error("Post mutation outside scope: " + E.scope + " >! " + this.ownerElement);
  }
  get post2() {
    return db == null ? undefined :
      !this.value ? this.ancestor?.post :
        this.value == "*" ? db :
          db[this.value];
  }
  get post() {
    if (this.value == "*") return db;

    const p = this.post2;
    if (p && this.value[0] == ".")
      return p[this.value.slice(1)];
    return p;
  }
  get ancestor() {
    for (let el = this.ownerElement.parentElement; el; el = el.parentElement)
      for (let at of el.attributes)
        if (at instanceof PostAttr)
          return at;
  }
}

// function postAttr(rule) {
//   const [_, prop] = rule.split("_");
//   return !prop ? PostAttr :
//     class PostAttrProp extends PostAttr {
//       get post() { return super.post?.[prop]; }
//     };
// }

function pstate(oi) {
  if (E?.active)
    throw new Error("Never update post db during down propagation");
  db = Object.assign({}, db, oi); //todo replace with a deep merge
  propagate(document.documentElement);
}
export { pstate, PostAttr };

class PostEvent extends Event {
  constructor(it) { super(EVENT); this.it = it; }
  get post() { return this.it.attr?.post; }
  get db() { return db; } //todo db is mutable here..
  get scope() { return this.it.el; }
  get active() { return !!this.it.attr; }
}

function propagate(start) {
  E = new PostEvent(new PostAttrIterator(start));
  eventLoop.dispatchBatch(E, E.it);
}

document.Reactions.define(PREFIX + "state", pstate);
document.Triggers.define(PREFIX, PostAttr);
document.Triggers.defineRule(PREFIX + "_", postAttr);
