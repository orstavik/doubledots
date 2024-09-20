//1. An element can only hold either one post setter or many post mutors.
//2. A mutation occurs is when a post setter/mutor is added/changed.
//3. During propagation, a mutation can only occur *within* the owner element of the current mutor running. Mutations during propagation do *not* trigger any propagation. 
//4. During propagation, the db cannot be modified.
//5. Setters and mutors are sorted in a document ordered list which can be mutated during propagation.
//6. Post setters has no reactions. They never trigger reactions, only propagations that trigger post mutors.

(function () {

  
  const EMPTY = [];
  class AttributeIterator {
    [Symbol.iterator]() { return this; }
    constructor(root, Type = Attr) {
      this.elIt = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
      this.el = this.elIt.nextNode();
      this.attributes = this.el ? Array.from(this.el.attributes) : EMPTY;
      this.i = 0;
      this.attr = null;
      this.Type = Type;
    }
    next() {
      while (this.el?.isConnected) {
        while (this.i < this.attributes.length) {
          const attr = this.attributes[this.i++];
          if (attr.ownerElement) //skip removed attributes
            if (attr instanceof this.Type) //if Type === Attr, then no filter
              return { value: this.attr = attr, done: false };
        }
        this.el = this.elIt.nextNode();
        this.i = 0;
        this.attributes = this.el ? Array.from(this.el.attributes) : EMPTY;
      }
      this.attr = null;
      return { done: true };
    }
  }


  let db = {};
  let E;
  let started;

  function pstate(oi) {
    if (E) throw new Error("Never update post db during down propagation");
    started = true;
    db = Object.assign({}, db, oi);
    propagate(document.documentElement);
  }

  class PostAttr extends AttrCustom {
    upgrade() { this.check() && this.onChange(true); }
    set value(v) { super.value = v; this.check() && this.onChange(); }
    get value() { return super.value; }
    check() {
      if (!started) return false;
      if (!E) return true;
      if (E.scope.contains(this.ownerElement) && E.scope !== this.ownerElement) return false;
      throw new Error("Mutation outside scope during cascade: " + E.scope + " >! " + this.ownerElement);
    }
  }

  class PostGetter extends PostAttr {
    onChange(upgrade) {
      const post = this.post;
      if (upgrade && post === undefined)
        return;
      const e = new Event(this.trigger.split("_")[0]);
      e.post = post;
      eventLoop.dispatch(e, this);
    }
    get post() {
      for (let el = this.ownerElement; el; el = el.parentElement)
        for (let at of el.attributes)
          if (at instanceof PostSetter)
            return at.post;
    }
  }
  class PostSetter extends PostAttr {
    onChange() { propagate(this.ownerElement); }
    get post() {
      return this.value === "*" ? { db, keys: Object.keys(db) } : db[this.value];
    }
  }


  class CascadeEvent extends Event {
    constructor(type, it) {
      super(type);
      this.it = it;
    }
    get post() { return this.it.attr?.post; }
    get scope() { return this.it.el; }
  }

  function propagate(start) {
    const it = new AttributeIterator(start, PostGetter);
    E = new CascadeEvent("post", it);
    eventLoop.dispatchBatch(E, it);
  }

  document.Reactions.define("pstate", pstate);
  document.Triggers.define("p", PostSetter);
  document.Triggers.define("p_", PostGetter);
})();