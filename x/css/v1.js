// import { SheetWrapper } from "http://127.0.0.1:3003/src/engine.js";
import { SheetWrapper } from "https://cdn.jsdelivr.net/gh/orstavik/csss@1.0.5/src/engine.js";

let sheetWrapper;
export class Csss extends AttrCustom {

  upgrade() {
    if (this.ownerElement.tagName === "STYLE")
      sheetWrapper = new SheetWrapper(this.ownerElement.sheet);
    else
      console.warn("The 'csss' attribute should be used on a <style> element.");
  }
  set value(v) { sheetWrapper.readSupers(super.value = v); }
  get value() { return super.value; }
}

function overlap({ rule: { shorts: A } }, { rule: { shorts: B } }) {
  for (const a in A)
    for (const b in B)
      if (a === b) return a;
}

export class Class extends AttrCustom {

  upgrade() {
    this.__previousClasses = {};
  }

  set value(v) {
    super.value = v;
    let positions = [], last = -1;
    for (let clz of this.ownerElement.classList) {
      if (clz.includes("$")) {
        const ruleAndPos = sheetWrapper.addRule(clz);
        const { pos, rule } = ruleAndPos;
        positions[pos] = ruleAndPos;
        if (pos < last) {
          const potentialErrors = positions.filter((_, i) => i > pos);
          for (let potential of potentialErrors) {
            const doubleKey = overlap(ruleAndPos, potential);
            if (doubleKey)
              console.warn(`Wrong sequence!! ${clz} should be positioned before ${potential}.`);
          }
        } else
          last = pos;
      }
    }
  }

  get value() { return super.value; }
}
