class StateAttrIterator {

  constructor(event, attrs, dotPath, state) {
    this.event = event;
    this.it = attrs[Symbol.iterator]();
    this.branchChanged = dotPath;
    this.state = state;
  }

  next() {
    for (let n = this.it.next(); !n.done; n = this.it.next()) {
      const at = n.value;
      const branches = at.constructor.branches;
      for (let observedBranch of branches)
        if (observedBranch.every((b, i) => b === this.branchChanged[i])) {
          this.event[Event.data] = branches.length > 1 ?
            this.state :
            observedBranch.reduce((o, p) => o?.[p], this.state);
          return { value: at, done: false };
        }
    }
    return { done: true };
  }

  [Symbol.iterator]() { return this; }
}

const attrs = new DoubleDots.AttrWeakSet();
let stateObj = {};

function setInObjectCreatePaths(obj, path, key, value) {
  for (let p of path)
    obj = (obj[p] ??= {});
  obj[key] = value;
}

function setInObjectIfDifferent(obj, path, key, value) {
  const parent = path.reduce((o, p) => o?.[p], obj);
  if (JSON.stringify(parent?.[key]) === JSON.stringify(value))
    return false;
  setInObjectCreatePaths(obj, path, key, value);
  return true;
}

export class State extends AttrCustom {
  upgrade() { attrs.add(this); }
  static get branches() { return [[]]; }
}

export function state(value) {
  if (JSON.stringify(state) === JSON.stringify(value))
    return;
  state = value;
  const e = new Event("state");
  const it = new StateAttrIterator(e, attrs, [], state);
  eventLoop.dispatchBatch(e, it);
}

export function State_(rule) {
  let [, ...branches] = rule.split("_");
  branches = branches.map(b => b.split("."));
  return class State extends AttrCustom {
    upgrade() { attrs.add(this); }
    static get branches() { return branches; }
  };
}

export function state_(rule) {
  let [name, branch] = rule.split("_");
  branch = branch.split(".");
  const key = branch[branch.length - 1];
  const path = branch.slice(0, -1);
  return function (value) {
    const change = setInObjectIfDifferent(stateObj, path, key, value);
    if (!change)
      return;
    const e = new Event(name);
    const it = new StateAttrIterator(e, attrs, branch, stateObj);
    eventLoop.dispatchBatch(e, it);
  };
}

// function* attrsListeningForBranch(attrs, branch) {
//   for (let at of attrs)
//     for (let atBranch of at.constructor.branches)
//       if (branch.every((b, i) => b === atBranch[i]))
//         yield at;
// }

