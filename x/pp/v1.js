class AttributeIterator {

  constructor(root, Type = Attr) {
    this.elIt = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT);
    this.Type = Type;
    this.attr = undefined;
    this.nextElement();
  }

  nextElement() {
    this.el = this.elIt.nextNode();
    this.i = 0;
    this.attributes = this.el ? Array.from(this.el.attributes) : [];
  }

  next() {
    while (this.el?.isConnected) {
      while (this.i < this.attributes.length) {
        this.attr = this.attributes[this.i++];
        if (this.attr.ownerElement)          //skip removed attributes
          if (this.attr instanceof this.Type)//if Type===Attr, then no filter
            return { value: this.attr, done: false };
      }
      this.nextElement();
    }
    this.attr = undefined;
    return { done: true };
  }

  [Symbol.iterator]() { return this; }
}

class PpIterator extends AttributeIterator {
  constructor(root) {
    super(root, Pp);
    this.stack = [];
  }

  next() {
    const i = super.next();
    if (i.done) return i;
    const attr = i.value;
    while (this.stack.length && !this.stack.at(-1).ownerElement.contains(attr.ownerElement))
      this.stack.pop();
    this.stack.push(i.value);
    return i;
  }

  get currentPath() {
    return this.attr.value[0] === "." ?
      this.#getRelativePath() :
      this.attr.value.split(".");
  }

  #getRelativePath() {
    let path = [];
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const attr = this.stack[i];
      if (attr.value[0] === ".")
        path = [...attr.value.slice(1).split("."), ...path];
      else
        return [...attr.value.split("."), ...path];
    }
    return path;
  }
}

function findNearestPpObject(el) {
  for (; el; el = el.parentElement)
    if (el.pp)
      return el.pp;
}

class PpEvent extends Event {
  constructor(type, root, IT) {
    super(type);
    this.IT = IT;
    this.root = root;
  }

  get data() {
    const path = IT.currentPath;
    return path.reduce((res, seg) => res[seg], this.root);
  }
}

function propagate(scope, pp) {
  IT = new PpIterator(scope);
  const e = new PpEvent("pp", pp, IT);
  eventLoop.dispatchBatch(e, IT);
}

let IT;

export function pp(obj) {
  if (IT?.attr)
    throw new Error(":pp reaction cannot be triggered while the pp: is propagating");
  this.ownerElement.pp = obj;
  obj && propagate(this.ownerElement, obj);
}

export class Pp extends AttrCustom {
  upgrade() {
    for (let a of this.ownerElement.attributes)
      if (a !== this && a instanceof Pp)
        throw new Error("An element can only hold one " + this.trigger + ":");
  }
  set value(v) {
    super.value = v;
    if (IT?.attr) {
      if (IT.attr === this)
        throw new Error("reactions on pp: trigger cannot change their own value!");
      if (!IT.attr.ownerElement.contains(this.ownerElement))
        throw new Error("pp: mutation outside scope: " + IT.attr.ownerElement + " >! " + this.ownerElement);
      return;
    }
    const pp = findNearestPpObject(this.ownerElement);
    pp && propagate(this.ownerElement, pp);
  }
  get value() { return super.value; }
}


//loop starting
function firstAttrStartsWith(root, startsWith){
  for (let el of root.querySelectorAll("*"))
    for (let a of el.attributes)
      if (a.name.startsWith(startsWith))
        return a;
}

export function loop_(rule) {
  const [_, templateName] = rule.split("_");
  let triggerName = "pp:";
  return function loop(now) {
    if (!Array.isArray(now))
      throw new Error("loop #2 argument is not an array.");
    const el = this.ownerElement;
    //todo get the template from the head or 1st child
    const template = document.head.querySelector(`template[name="${templateName}"]`).content;
    if (!(template instanceof DocumentFragment) || !template.children.length)
      throw new Error("loop #1 argument must be a DocumentFragment with at least one child element.");
    el.innerText = "";
    for (let i = 0; i < now.length; i++) {
      const clone = template.cloneNode(true);
      const attr = firstAttrStartsWith(clone, triggerName);
      attr.value = "." + i;
      el.append(clone);
    }
  };
}