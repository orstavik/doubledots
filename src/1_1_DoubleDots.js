window.DoubleDots = {

  DoubleDotsError: class DoubleDotsError extends Error { },
  DeprecationError: class DeprecationError extends Error { },
  DefinitionError: class DefinitionError extends Error { },
  MissingReaction: class MissingReaction extends Error { },
  DisconnectedError: class DisconnectedError extends Error { },
  
  AttrWeakSet: class AttrWeakSet extends Set {
    static #bigSet = new Set(); //wr => AttrWeakSet
    static #key;
    static GC = 10_000;

    static gc() {
      let active, l;
      for (let wr of AttrWeakSet.#bigSet) {
        if (l = wr.ref())
          for (let a of l)
            a.isConnected ? (active = true) : (l.delete(a), a.remove());
        else
          AttrWeakSet.#bigSet.delete(wr);

      }
      !active && (AttrWeakSet.#key = clearInterval(AttrWeakSet.#key));
    }

    constructor(...args) {
      super(...args);
      AttrWeakSet.#bigSet.add(new WeakRef(this));
    }

    add(at) {
      AttrWeakSet.#key ??= setInterval(AttrWeakSet.gc, AttrWeakSet.GC);
      super.add(at);
    }
  }
};
