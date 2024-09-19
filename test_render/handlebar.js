function extractTask(n, path, last) {
  const txt = n.textContent;
  const regex = /\{\{([^}]+)\}\}/g;
  const matches = [...txt.matchAll(regex)];
  if (matches.length === 0)
    return;
  const props = [...new Set(matches.map(match => match[1]))].sort();
  function replacer(post) {
    return txt.replace(/\{\{(\w+)\}\}/g, (_, m) => m.split(".").reduce(
      (res, prop) => (!prop || res[prop] === undefined) ? "" : res[prop], post));
  };

  return { replacer, props, path, last };
}

function* nextAttribute(el, skips = ["template", "[p\\:]"], path = []) {
  for (let n of el.attributes)
    if (n = extractTask(n, path, n.name))
      yield n;

  for (let i = 0, j = 0; i < el.childNodes.length; i++) {
    let n = el.childNodes[i];
    if (n instanceof Element) {
      j++;
      if (!skips.some(s => n.matches(s)))
        yield* nextAttribute(n, skips, [...path, `${n.tagName}:nth-child(${j})`]);
    } else if (n instanceof Text) {
      if (n = extractTask(n, path, i))
        yield n;
    }
  }
}

function makeTask({ props, replacer, path, last }) {
  const textIndex = parseInt(last);
  const qs = path.length && `:scope > ${path.join(" > ")}`;
  return function (n, old, now) {
    if (old === now)
      return;
    if (now?.constructor && now?.constructor === old?.constructor && props.every(prop => old[prop] === now[prop]))
      return;
    qs && (n = n.querySelector(qs));
    if (!n)
      return;
    n = isNaN(textIndex) ? n.getAttribute(last) : n.childNodes[textIndex];
    if (!n)
      return;
    n.textContent = replacer(now);
  };
};

const taskCache = new WeakMap();
function getTask(attr) {
  let tasks = taskCache.get(attr);
  if (!tasks) {
    tasks = [...nextAttribute(attr.ownerElement)].map(makeTask);
    taskCache.set(attr, tasks);
  }
  return tasks;
}

const valueCache = new WeakMap();
function handlebarAdvanced({ post: now }) {
  const tasks = getTask(this);
  const old = valueCache.get(this);
  valueCache.set(this, now);
  debugger;
  for (let task of tasks)
    task(this.ownerElement, old, now);
}

document.Reactions.define("handlebar-advanced", handlebarAdvanced);