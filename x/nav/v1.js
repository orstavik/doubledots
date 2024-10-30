//This is the spa. It will run at startup. Then it will add event listeners for the click and the popstate. The popstate will always just run. And the click will look for the <a href and also check that the event is there.

//statemachine

const attrs = new DoubleDots.AttrWeakSet();
export class Nav extends AttrCustom {
  upgrade() {
    const e = new Event("nav");
    e.data = location;
    this.dispatchEvent(e);
    attrs.add(this);
  }
}

export function nav(e) {
  if (e.defaultPrevented)
    return;
  if (e.type === "popstate") {
    e.preventDefault();
  }
  if (e.type === "click") {
    const a = e.target.closest("a[href]");
    if (!a)
      return;
    history.pushState(null, null, a.href);
    e.preventDefault();
  }
  const e2 = new Event("nav");
  e2.data = location;
  eventLoop.dispatchBatch(e2, [...attrs]);
}

// popstate_:location;
// click_:location;