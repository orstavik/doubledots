const attrs = new DoubleDots.AttrWeakSet();
export class Portal extends AttrCustom {
  upgrade() {
    attrs.add(this);
  }
}

export function portal(data) {
  const e = new Event("portal");
  e.data = data;
  eventLoop.dispatchBatch(e, [...attrs]);
}
