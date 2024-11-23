const attrs = new DoubleDots.AttrWeakSet();
let raf;

function trigger() {
  const ats = [...attrs];
  if (!ats.length)
    return cancelAnimationFrame(raf);
  const offsets = ats.map(at => at.ownerElement.getBoundingClientRect());
  const e = new Event("offset");

  const iterator = {
    i: 0,
    next() {
      if (this.i >= ats.length)
        return { done: true };
      e[Event.data] = offsets[this.i];
      return { value: ats[this.i++], done: false };
    },
    [Symbol.iterator]() {
      return this;
    }
  };
  eventLoop.dispatchBatch(e, iterator);
}

export class Offset extends AttrCustom {
  upgrade() {
    attrs.add(this);
    if (!raf) {
      function doAll() {
        trigger();
        raf = requestAnimationFrame(doAll);
      }
      doAll();
    }
  }
  // remove() { //not necessary as the AttrWeakSet is self cleaning when iterated.
  //   attrs.delete(this), (!attrs.size && cancelAnimationFrame(raf));
  // }
}