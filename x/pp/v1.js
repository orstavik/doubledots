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

class LoopCube {
  static compareSmall(old, now){
    const exact = new Array(now.length);
    const unused = [];
    if (!old?.length)
      return { exact, unused };
    main: for (let o = 0; o < old.length; o++) {
      for (let n = 0; n < now.length; n++) {
        if (!exact[n] && old[o] === now[n]) {
          exact[n] = o;
          continue main;
        }
      }
      unused.push(o);
    }
    return { exact, unused };  
  }

  constructor(root, template) {
    this.root = root;
    this.template = template;
    this.tl = template.childNodes.length;
    this.now = [];
    this.root.textContent = "";
  }

  getTemplClone() {
    return this.template.cloneNode(true).childNodes;
  }

  moveToRes(n, o, now, old, scale) {
    n *= scale;
    o *= scale;
    for (let i = 0; i < scale; i++)
      now[n + i] = old[o + i];
  }

  step(now = []) {
    const old = this.now;
    this.now = now;
    const { exact, unused } = LoopCube.compareSmall(old, now);

    const oldNodes = this.root.childNodes;
    const nowNodes = new Array(now.length * this.tl);
    for (let n = 0; n < exact.length; n++) {
      const o = exact[n];
      if (o != null) {
        this.moveToRes(n, o, nowNodes, oldNodes, this.tl);
      } else {
        unused.length ?
          this.moveToRes(n, unused.pop(), nowNodes, oldNodes, this.tl) :
          this.moveToRes(n, 0, nowNodes, this.getTemplClone(), this.tl);
        this.task(nowNodes, n);
      }
    }
    const removeNodes = [];
    for (let u = unused.pop(), i = 0; u != null; i++, u = unused.pop())
      this.moveToRes(i, u, removeNodes, oldNodes, this.tl);
    return nowNodes;
  }

  task(i) { }
}

class LoopCubeAttr extends LoopCube {
  constructor(attr, template) {
    super(attr.ownerElement, template);
    this.attr = attr;
    this.triggerName = attr.trigger + ":";
  }

  task(nowNodes, i) {
    for (let j = 0, start = i * this.tl; j < this.tl; j++)
      if (nowNodes[start + j].attributes)
        for (let a of nowNodes[start + j].attributes)
          if (a.name.startsWith(this.triggerName))
            return a.value = "." + i;
  }
}

export function loop(template, now) {
  const triggerName = "pp";
  if (!Array.isArray(now))
    throw new Error("loop #2 argument is not an array.");
  if (!(template instanceof DocumentFragment) || !template.children.length)
    throw new Error("loop #1 argument must be a DocumentFragment with at least one child element.");
  const el = this.ownerElement;
  const res = (this.__loop ??= new LoopCubeAttr(this, template)).step(now);
  res.length ? el.append(...res) : el.innerText = "";
}