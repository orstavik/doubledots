class AttributeIterator {

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
let E;
const valueCache = new WeakMap();

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
      debugger; //use something other than .post?
      if (post !== valueCache.get(attr)) {
        valueCache.set(attr, post);
        return i;
      }
    }
  }
  get active() {
    return !!this.at;
  }
}

class PostAttr extends AttrCustom {
  //todo we could keep track of the top node, in order for us to not iterate through unnecessary elements. That would be equal to keeping track of all the ownerElements, making it possible to find the top root. we wait with this efficiency. we naively iterate all.
  upgrade() { this.onePerElement(); this.check() && propagate(this.ownerElement); }
  set value(v) {
    /* check if the value is the same before we do something? should we make the obj an obj and then the string value as json text? or just json text? */
    super.value = v; this.check() && propagate(this.ownerElement);
  }
  get value() { return super.value; }
  onePerElement() {
    for (let a of this.ownerElement.attributes)
      if (a instanceof PostAttr && a !== this)
        throw new Error("An element can only hold one PostAttr.");
  }
  check() {
    if (!IT?.active && this.post !== valueCache.get(this))
      return true;
    if (!IT?.active || E.scope.contains(this.ownerElement) && IT.el !== this.ownerElement)
      return false;
    throw new Error("Post mutation outside scope: " + IT.el + " >! " + this.ownerElement);
  }
}

function pupdate(oi) {
  if (IT?.active)
    throw new Error("Never update post db during down propagation");
  propagate(this.ownerElement, oi);
}

function propagate(start, data) {
  IT = new PostAttrIterator(start);
  const e = new Event("render");
  e.data = data;
  eventLoop.dispatchBatch(e, IT);
}