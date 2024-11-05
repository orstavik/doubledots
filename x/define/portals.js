const attrs = new DoubleDots.AttrWeakSet();
export class Portal extends AttrCustom {
  upgrade() { attrs.add(this); }
}

export function portal(data) {
  const e = new Event("portal");
  e.data = data;
  eventLoop.dispatchBatch(e, [...attrs]);
}

export function Portal_(rule) {
  const [_, value] = rule.split("_");
  return class Portal_ extends AttrCustom {
    upgrade() { attrs.add(this); }
    static get value() { return value; }
  };
}

export function portal_(rule){
  const [_, value] = rule.split("_");
  return function portal_rule(data) {
    const e = new Event("portal_");
    e.data = data;
    e.value = value;
    eventLoop.dispatchBatch(e, [...attrs]);
  }
}