//1. An element can only hold one PostAttr.
//2. If the PostAttr doesn't have a post value, it will use the PostAttr.ancestor post.
//3. A mutation is to a) add a PostAttr or b) change a PostAttr value.
//4. During propagation, mutations are only allowed on descendant elements of the current PostAttr being iterated. Mutations during propagation do *not* trigger any propagation. 
//5. During propagation, the db cannot be modified.

(function () {

  //generic class for iterating attr down in the dom. Can filter for AttrCustom types.
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
        if (post !== postCache.get(attr)) {
          postCache.set(attr, post);
          return i;
        }
      }
    }
  }

  class PostAttr extends AttrCustom {
    //todo we could keep track of the top node, in order for us to not iterate through unnecessary elements. That would be equal to keeping track of all the ownerElements, making it possible to find the top root. we wait with this efficiency. we naively iterate all.
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
    get post() {
      return !db ? undefined :
        !this.value ? this.ancestor?.post :
          this.value === "*" ? { db, keys: Object.keys(db) } :
            db[this.value];
    }
    get ancestor() {
      for (let el = this.ownerElement.parentElement; el; el = el.parentElement)
        for (let at of el.attributes)
          if (at instanceof PostAttr)
            return at;
    }
    get TYPE(){
      return PostAttr;
    }
  }

  function postAttr(rule) {
    const [_, prop] = rule.split("_");
    return !prop ? PostAttr :
      class PostAttrProp extends PostAttr {
        get post() { return super.post?.[prop]; }
      };
  }

  function pstate(oi) {
    if (E?.active)
      throw new Error("Never update post db during down propagation");
    db = Object.assign({}, db, oi); //todo replace with a deep merge
    propagate(document.documentElement);
  }

  class PostEvent extends Event {
    constructor(it) { super("post"); this.it = it; }
    get post() { return this.it.attr?.post; }
    get scope() { return this.it.el; }
    get active() { return !!this.it.attr; }
  }

  function propagate(start) {
    E = new PostEvent(new PostAttrIterator(start));
    eventLoop.dispatchBatch(E, E.it);
  }

  document.Reactions.define("pstate", pstate);
  document.Triggers.define("p", PostAttr);
  document.Triggers.defineRule("p_", postAttr);
})();