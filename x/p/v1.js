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
const previousPropagationValue = new WeakMap();

export class P extends AttrCustom {
  upgrade() {
    this.onePerElement();
    previousPropagationValue.set(this, "");
    this.tryPropagate();
  }
  set value(v) {
    super.value = v;
    this.tryPropagate();
  }
  get value() { return super.value; }
  onePerElement() {
    for (let a of this.ownerElement.attributes)
      if (a instanceof P && a !== this)
        throw new Error("An element can only hold one P.");
  }
  tryPropagate() {
    if (!IT?.attr && this.value !== previousPropagationValue.get(this))
      return this.propagate();
    if (!IT?.attr || IT.el.contains(this.ownerElement) && IT.el !== this.ownerElement)
      return;
    throw new Error("Post mutation outside scope: " + IT.el + " >! " + this.ownerElement);
  }
  propagate() {
    previousPropagationValue.set(this, this.value);
    IT = new AttributeIterator(this.ownerElement, P);
    const e = new Event("render");
    e.data = JSON.parse(this.value);
    eventLoop.dispatchBatch(e, IT);
  }
}

export function pupdate(obj) {
  const p = new AttributeIterator(this.ownerElement, P).next().value;
  p.value = JSON.stringify(obj);
}

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