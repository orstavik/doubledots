const attrs = new DoubleDots.AttrWeakSet();
let state = [];

export class State extends AttrCustom {
  upgrade() {
    attrs.add(this);
  }
}

export function state_(rule) {
  let active = false;
  let [name, num] = rule.split("_");
  num = parseInt(num);
  while (state.length <= num)
    state.push(undefined);
  return function (value) {
    if (state[num] === value)
      return;
    state[num] = value;
    if (!active)
      for (let i = 0; i < state.length; i++)
        if (state[i] === undefined)
          return;
    active = true;
    const e = new Event(name);
    e.data = state;
    eventLoop.dispatchBatch(e, [...attrs]);
  };
}