import { SheetWrapper } from "https://cdn.jsdelivr.net/gh/orstavik/csss@1.0.9/src/engine.js";

let sheetWrapper;
function makeSheetWrapper() {
  let style = document.querySelector("style[csss]");
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("csss", "");
    document.head.appendChild(style);
  }
  return sheetWrapper = new SheetWrapper(style.sheet);
}

let active;
function updateTextContent() {
  active ||= setTimeout(() => (sheetWrapper.cleanup(), (active = undefined)), 500);
}

export class Class extends AttrCustom {

  upgrade() {
    this.__previousClasses = {};
  }

  set value(v) {
    super.value = v;
    sheetWrapper ??= makeSheetWrapper();
    let positions = [], last = -1;
    for (let clz of this.ownerElement.classList) {
      if (clz.includes("$")) {
        const ruleAndPos = sheetWrapper.addRule(clz, this.ownerElement);
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
      updateTextContent();
    }
  }

  get value() { return super.value; }
}