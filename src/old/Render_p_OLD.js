//1. An element can only hold either one post setter or many post mutors.
//2. A mutation occurs is when a post setter/mutor is added/changed.
//3. During propagation, a mutation can only occur *within* the owner element of the current mutor running. Mutations during propagation do *not* trigger any propagation. 
//4. During propagation, the db cannot be modified.
//5. Setters and mutors are sorted in a document ordered list which can be mutated during propagation.
//6. Post setters has no reactions. They never trigger reactions, only propagations that trigger post mutors.


(function () {

  let db = {};
  let E;
  let started;

  function pstate(oi) {
    if (E) throw new Error("Never update post db during down propagation");
    started = true;
    db = Object.assign({}, db, oi);
    propagate(document.documentElement);
  }

  function checkScope(el) {
    if (E && !E.scope.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_CONTAINED_BY)
      throw "mutation outside scope: " + E.scope + " >! " + el;
  }

  function getParentPost(el) {
    for (; el; el = el.parentElement)
      for (let at of el.attributes)
        if (at instanceof PostSetter)
          return at;
  }

  class PostAttr extends AttrCustom {
    upgrade() { checkScope(this.ownerElement); E || this.onChange(true); }
    set value(v) {
      super.value = v; checkScope(this.ownerElement); E || this.onChange();
    }
    get value() { return super.value; };
  }

  class PostGetter extends PostAttr {
    onChange(upgrade) {
      if(!started)
        return;
      const post = getParentPost(this.ownerElement)?.post;
      if (post === undefined && upgrade)
        return;
      const e = new Event(this.trigger);
      e.post = post;
      eventLoop.dispatch(e, this);
    }
  }
  class PostSetter extends PostAttr {
    onChange() { started && propagate(this.ownerElement); }
    get post() {
      return this.value === "*" ? { db, keys: Object.keys(db) } : db[this.value];
    }
  }

  class PostEvent extends Event {
    constructor() {
      super("post");
    }
    setScope(el) {
      this.scope = el;
      this.attributes = el && [...el.attributes];
    }
  }

  function propagate(start) {
    const elIt = document.createNodeIterator(start, NodeFilter.SHOW_ELEMENT);
    let i = 0;

    E = new PostEvent();
    E.setScope(elIt.nextNode());

    const iterable = {
      next() {
        while (E.scope) {
          while (i < E.attributes.length) {
            const a = E.attributes[i++];  
            if(!a.ownerElement)
              continue;
            if (a instanceof PostGetter) {
              const postSetter = getParentPost(E.scope);
              //todo here we can do a test against known changes
              //     on the getter.
              E.post = postSetter?.post;
              return { value: a };
            }
          }
          i = 0;
          E.setScope(elIt.nextNode());
        }
        E = undefined;
        return { done: true };
      },
      [Symbol.iterator]() {
        return this;
      }
    };
    eventLoop.dispatchBatch(E, iterable);
  }

  document.Reactions.define("pstate", pstate);
  document.Triggers.define("p", PostSetter);
  document.Triggers.define("p_", PostGetter);
})();