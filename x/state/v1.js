function matchesPath(observedPaths, path) {
  for (let observedPath of observedPaths)
    if (path.startsWith(observedPath))
      return true;
}

function pathsAllSet(observedPaths, state) {
  for (let path of observedPaths) {
    let obj = state;
    for (let p of path) {
      if (!(p in obj))
        return false;
      obj = obj[p];
    }
  }
  return true;
}

function makeIterator(attrs, state, pathString) {
  if (!pathString)
    return attrs[Symbol.iterator]();
  const matches = [];
  for (let at of attrs) {
    if(!at.constructor.paths)
      matches.push(at);
    else if (matchesPath(at.constructor.branches, pathString))
      if (pathsAllSet(at.constructor.paths, state))
        matches.push(at);
  }
  return matches[Symbol.iterator]();
}

const attrs = {};
function addAttr(at, name) {
  (attrs[name] ??= new DoubleDots.AttrWeakSet()).add(at);
}
const states = {};

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
  upgrade() { addAttr(this, this.trigger); }
}

export function state(value) {
  const name = eventLoop.reaction;
  if (JSON.stringify(states[name]) === JSON.stringify(value))
    return;
  const e = new Event("state");
  e[Event.data] = states[name] = value;
  const it = makeIterator(attrs[name], states[name]);
  eventLoop.dispatchBatch(e, it);
}

export function State_(rule) {
  const [name, ...branches] = rule.split("_");
  const paths = branches.map(b => b.split("."));
  return class State extends AttrCustom {
    upgrade() { addAttr(this, name); }
    static get branches() { return branches; }
    static get paths() { return paths; }
  };
}

export function state_(rule) {
  let [name, branch] = rule.split("_");
  const path = branch.split(".");
  const key = path.pop();
  return function (value) {
    const change = setInObjectIfDifferent(states[name] ??= {}, path, key, value);
    if (!change)
      return;
    const e = new Event(name);
    e[Event.data] = states[name];
    const it = makeIterator(attrs[name], states[name], branch);
    eventLoop.dispatchBatch(e, it);
  };
}