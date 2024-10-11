function dotPathGet(dotPath, obj) {
  for (let p of dotPath.split("."))
    if (!(obj = obj?.[p]))
      return obj === 0 ? obj : "";
  return obj;
}

function processBraces(txt, post) {
  return txt.replace(/\{\{([^}{]+)\}\}/g, (_, expr) => dotPathGet(expr, post));
}

function* bodyTasks(el, triggerName, ii = []) {
  if (el instanceof Element) {
    if (ii.length) //skip during first check
      for (let a of el.attributes)
        if (a.name.startsWith(triggerName))
          return;
    for (let { name, value } of el.attributes)
      if (value.indexOf("{{") >= 0)
        yield (n, now) => ii.reduce((e, i) => e.childNodes[i], n).setAttribute(name, processBraces(value, now));
    for (let i = 0; i < el.childNodes.length; i++)
      yield* bodyTasks(el.childNodes[i], triggerName, [...ii, i]);
  } else if (el instanceof Text) {
    const txt = el.textContent;
    if (txt.indexOf("{{") >= 0)
      yield (n, now) => ii.reduce((e, i) => e.childNodes[i], n).textContent = processBraces(txt, now);
  }
}

export function brace(now) {
  this.__tasks ??= [...bodyTasks(this.ownerElement, this.trigger + ":")];
  for (let cb of this.__tasks)
    cb(this.ownerElement, now);
}