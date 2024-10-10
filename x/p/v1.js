//we need wrap in a class that can have a two way map between string and object,
//with a max limit of entries, where the most used entries are kept first, and
//where the string is the json equivalent of the obj
//and we only have getters, so that if the object is not there when you ask with the string, the object is made using Json.parse, and vice versa when you give a string.
// const objToJson = new WeakMap();
// const jsonToObj = {}; //todo this one we need to weakify
// function toJson(obj){

// }
// function fromJson(str){

// }
const objToJson = new Map();
const jsonToObj = {};

function toJson(obj) {
  if (objToJson.has(obj))
    return objToJson.get(obj);
  const json = JSON.stringify(obj);
  objToJson.set(obj, json);
  jsonToObj[json] = obj;
  return json;
}
function toObj(json) {
  if (jsonToObj[json])
    return jsonToObj[json];
  const obj = JSON.parse(json);
  objToJson.set(obj, json);
  jsonToObj[json] = obj;
  return obj;
}

////p

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

let IT;
export class P extends AttrCustom {
  upgrade() {
    for (let a of this.ownerElement.attributes)
      if (a !== this && a instanceof P)
        throw new Error("An element can only hold one P.");
  }
  set value(v) {
    super.value = v;
    if (IT?.attr) {
      if (IT.attr === this)
        throw new Error("reactions on p: trigger cannot change their own value!");
      if (!IT.attr.ownerElement.contains(this.ownerElement))
        throw new Error("p: mutation outside scope: " + IT.attr.ownerElement + " >! " + this.ownerElement);
      return;
    }
    IT = new AttributeIterator(this.ownerElement, P);
    const e = new Event("render");
    e.data = toObj(this.value);
    eventLoop.dispatchBatch(e, IT);
  }
  get value() { return super.value; }
  set object(v) { this.value = toJson(v); }
  get object() { return toObj(this.value); }
}

export function pupdate(obj) {
  const p = new AttributeIterator(this.ownerElement, P).next().value;
  p.object = obj;
}


//loop starting

function compareSmall(old, now) {
  const exact = new Array(now.length);
  const unused = [];
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


class LoopCube {
  constructor(root, template) {
    this.root = root;
    this.template = template;
    this.tl = template.childNodes.length;
    this.now = [];
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
    const { exact, unused } = compareSmall(old, now);

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
  constructor(root, template, attr) {
    super(root, template);
    this.attr = attr;
  }

  task(nowNodes, i) {
    for (let j = 0, start = i * this.tl; j < this.tl; j++)
      if (nowNodes[start + j].attributes)
        for (let a of nowNodes[start + j].attributes)
          if (a.name.startsWith(this.attr.trigger + ":"))
            return a.value = toJson(this.now[i]);
  }
}

export function loop(template, now) {
  if (!Array.isArray(now))
    throw new Error("loop #2 argument is not an array.");
  if (!(template instanceof DocumentFragment) || !template.children.length)
    throw new Error("loop #1 argument must be a DocumentFragment with at least one child element.");
  const el = this.ownerElement;
  const res = (this.__loop ??= new LoopCubeAttr(el, template, this)).step(now);
  res.length ? el.append(...res) : el.innerText = "";
}