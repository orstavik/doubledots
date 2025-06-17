export class WindowTrigger extends AttrListener {
  get target() { return window; }
}

export class DocumentTrigger extends AttrListener {
  get target() { return document; }
}

export class DCLTrigger extends DocumentTrigger {
  get type() { return "DOMContentLoaded"; }
}

export class PrePropTrigger extends WindowTrigger { //global _click
  get type() { return this.trigger.slice(1); } //remove prefix so returns "click"
  get options() { return true; }
}

export class PostPropTrigger extends WindowTrigger { //global click_
  get type() { return this.trigger.slice(-1); } //remove postfix so returns "click"
}

function makeAll() {
  const upCase = s => s[0].toUpperCase() + s.slice(1);
  const res = {};
  for (let type of DoubleDots.nativeEvents.element) {
    type = upCase(type);
    res[type] = AttrListener;
    res["_" + type] = PrePropTrigger;
    res[type + "_"] = PostPropTrigger;
  }
  for (let type of DoubleDots.nativeEvents.window)
    res[upCase(type)] = WindowTrigger;
  for (let type of DoubleDots.nativeEvents.document)
    res[upCase(type)] = DocumentTrigger;
  delete res["DOMContentLoaded"];
  res["Domcontentloaded"] = DCLTrigger;
  return res;
}
export const dynamicSimpleProp = makeAll();