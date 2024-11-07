const triggers = new DoubleDots.AttrWeakSet();
let active;

export class Nav extends AttrCustom {
  upgrade() {
    if (!active) {
      for (let e of ["click", "popstate"])
        document.documentElement.setAttribute(`${e}:${this.trigger}`);
      active = true;
    }

    triggers.add(this);
    const e = Object.assign(new Event("nav"), { location });
    this.dispatchEvent(e);
  }
  remove() {
    triggers.delete(this);
  }
}

function triggerNavs() {
  const e2 = Object.assign(new Event("nav"), { location });
  eventLoop.dispatchBatch(e2, [...triggers]);
}

export function nav(e) {
  if (typeof e === "string") {
    const url = new URL(e, location.href);
    history.pushState(null, null, url.href);
    return triggerNavs();
  }
  if (!triggers.size) {
    for (let e of ["click", "popstate"])
      document.htmlElement.removeAttribute(`${e}:${eventLoop.reaction.name}`);
    //todo check that this eventLoop.reaction.name is correct
    active = false;
    return;
  }
  if (e.defaultPrevented)
    return;
  if (e.type === "popstate") {
    e.preventDefault();
  } else if (e.type === "click") {
    const a = e.target.closest("a[href]");
    if (!a)
      return;
    history.pushState(null, null, a.href);
    e.preventDefault();
  }
  triggerNavs();
}