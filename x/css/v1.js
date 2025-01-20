import { init } from "./lib/interpreter.js";

let shorts;

export class Csss extends AttrCustom {
  upgrade(...args) {
    console.log(...args);
    debugger
    shorts = init(this.ownerElement.value);
  }
}

export class Class extends AttrCustom {
  previous = {};
  upgrade(...args) {
    console.log(...args);
    debugger;//todo don't need this one?
  }

  changeCallback(...args) {
    debugger; //todo do need this one.
    for (let clz of this.classList) {
      if(shorts[clz])
        continue;
      shorts.addShort(clz);
    }
  }
}
