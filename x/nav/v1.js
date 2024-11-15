const triggers = new DoubleDots.AttrWeakSet();
let active;

class LocationEvent extends Event {
  constructor() {
    super("location");
  }
  get [Event.data]() {
    return location;
  }
}

export class Nav extends AttrCustom {
  upgrade() {
    if (!active) {
      for (let e of ["click", "popstate"])
        document.documentElement.setAttribute(`${e}:${this.trigger}`);
      active = true;
    }

    triggers.add(this);
    this.dispatchEvent(new LocationEvent());
  }
  remove() {
    triggers.delete(this);
  }
}

export function nav(e) {
  if (typeof e === "string") {
    const url = new URL(e, location.href);
    history.pushState(null, null, url.href);
    return eventLoop.dispatchBatch(new LocationEvent(), triggers);
  }
  if (!triggers.size) {
    for (let e of ["click", "popstate", "hashchange"])
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
  eventLoop.dispatchBatch(new LocationEvent(), triggers);
}