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

function brace(now) {
  this.__tasks ??= [...bodyTasks(this.ownerElement, this)];
  for (let cb of this.__tasks)
    cb(this.ownerElement, now);
}

function tBrace(template, now) {
  if (this.__tasks) {
    for (let cb of this.__tasks)
      cb(this.ownerElement, now);
    return;
  }
  this.__tasks = [...bodyTasks(template, this)];
  const clone = template.cloneNode(true);
  for (let cb of this.__tasks)
    cb(clone, now);
  this.ownerElement.textContent = null;
  this.ownerElement.append(clone);
}

document.Reactions.define("brace", brace);
document.Reactions.define("tbrace", tBrace);

//todo trim the template to remove ws text nodes before and after the template??
function getHoistTemplate() {
  let el = this.ownerElement;
  const name = el.tagName.toLowerCase();
  let res = document.head.querySelector(`template[name="${name}"]`);
  if (res)
    return res.content;
  el = el.firstElementChild;
  if (!(el instanceof HTMLTemplateElement))
    return;
  el.setAttribute("name", name);
  document.head.append(el);
  return el.content;
}

function cacheBullish(cb) {
  let id = Math.random();
  return function (...args) {
    return this["__c"+id] ??= cb.apply(this, args);
  };
}

document.Reactions.define("template", cacheBullish(getHoistTemplate));

//todo the template_attr_val_attr2_val2... rule. The .val are interpreted as dotGetters.
//todo tag-name is always ownerElement.tagName
//todo other empty values are attempted replaced with the value of a prop of the incoming data element. Again, this will work if the incoming element is not an Event, but just the data object. This means that we need to filter the value.
//todo if no value, then the attribute is just checked for presence.
//todo the "if/else" of works by selecting a template based on the value from first argument.

//:template_type_.post.type       => <template type="${post.type}">
//:template_name_hellosunshine    => <template name="hellosunshine">
//:template_tag-name              => <template tag-name="my-component">
//:template                       => ownerElement.firstChild template.
//

//the rules inside the brace don't allow us to remove any nodes from the branch dynamically.
//if we do, then the rules will run against the wrong node.