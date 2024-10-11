function dotPathGet(dotPath, obj) {
  for (let p of dotPath.split("."))
    if (!(obj = obj?.[p]))
      return obj === 0 ? obj : "";
  return obj;
}

function processBraces(txt, post) {
  return txt.replace(/\{\{([^}{]+)\}\}/g, (_, expr) => dotPathGet(expr, post));
}

function* bodyTasks(el, attr, ii = []) {
  for (let i = 0; i < el.childNodes.length; i++) {
    let n = el.childNodes[i];
    if (n instanceof Element) {
      let skip = n instanceof HTMLTemplateElement; //always skip template insides
      const ii2 = [...ii, i];
      for (let a of n.attributes) {
        skip ||= attr.sameType(a);
        const { name, value } = a;
        if (value.indexOf("{{") >= 0)
          yield (n, now) => ii2.reduce((e, i) => e.childNodes[i], n).setAttribute(name, processBraces(value, now));
      }
      if (!skip)
        yield* bodyTasks(n, attr, ii2);
    } else if (n instanceof Text) {
      const txt = n.textContent;
      const ii2 = [...ii, i];
      if (txt.indexOf("{{") >= 0)
        yield (n, now) => ii2.reduce((e, i) => e.childNodes[i], n).textContent = processBraces(txt, now);
    }
  }
}

export function brace(now) {
  this.__tasks ??= [...bodyTasks(this.ownerElement, this)];
  for (let cb of this.__tasks)
    cb(this.ownerElement, now);
}

// export function tBrace(template, now) {
//   if (this.__tasks) {
//     for (let cb of this.__tasks)
//       cb(this.ownerElement, now);
//     return;
//   }
//   this.__tasks = [...bodyTasks(template, this)];
//   const clone = template.cloneNode(true);
//   for (let cb of this.__tasks)
//     cb(clone, now);
//   this.ownerElement.textContent = null;
//   this.ownerElement.append(clone);
// }