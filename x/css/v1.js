import { ShortsResolver } from "./lib/interpreter.js";

let shorts;

export class Csss extends AttrCustom {
  upgrade() {
    shorts = ShortsResolver.init(this.ownerElement);
  }
}

export class Class extends AttrCustom {

  set value(v) {
    super.value = v;
    for (let clz of this.ownerElement.classList)
      shorts.addClass(clz);
  }

  get value() {
    return super.value;
  }
}
