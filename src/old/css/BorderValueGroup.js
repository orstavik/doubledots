function makeCssRule(selector, dict) {
  return `${selector}{${Object.entries(dict).map(([k, v]) => `\n  ${k}:${v};`)}\n}\n\n`;
}

/**
 * write step. Pass in the parsed output into a rule set unit.
 * get select step. This is universal. Applies for both contextSelect and childSelects.
 * convert element step. Use the sub class methods to house the semantics for how to turn the values into a css style rule set.
 * convert babies step. use the sub class methods for parsing the childGroupValues sets.
 * wrap super rules. arg-url and the inherit-line-height. This is done outside the convert element and convert babies.
 * push out the css style text. selector + element rule,   [...selector + childSelector + childRule]
 */
export class ValueGroup {
  constructor(name, ctxSelects, values, childValues) {
    this.name = name;
    this.ctxSelects = ctxSelects;
    this.values = values;
    this.childValues = childValues;
  }

  get childType() {
    return ">";
  }

  arg(...segs) {
    const prop = segs.join("-");
    throw "todo";
  }

  inherit(...segs) {
    const prop = segs.join("-");
    throw "todo";
  }

  get ctxSelector() {
    debugger;
    return "." + this.name.replaceAll(/[^a-z0-9_$-]/g, "\\$&");
    throw "not implemented these yet " + this.ctxSelects;
  }

  element(values) {
    throw new Error("must be implemented in subclass");
  }

  child(values) {
    throw new Error("must be implemented in subclass");
  }

  get cssRules() {
    let res = makeCssRule(this.ctxSelector, this.element(this.values));
    for (let [select, ...values] of this.childValues)
      res += makeCssRule(this.ctxSelector + this.childType + select, this.child(values));
    return res;
  }

  get type() {
    return this.constructor.name.slice(0, -10).toLowerCase();
  }

  extend(name, ctxSelect, values, childValues) {
    return new this.constructor(
      name, ctxSelect, [...this.values, ...values], [...this.childValues, ...childValues]);
  }
}

export class InheritValueGroup extends ValueGroup {
  get childType() {
    return " ";
  }
}

export class BorderValueGroup extends ValueGroup {

  get numType() {
    return "em";
  }

  processValue(value, res) {
    let m = value.value.match(/^(collapse|separate)$/);
    if (m)
      return res["border-collapse"] = m[1];
    m = value.value.match(/^radius-<number>$/);
    if (m)
      return res["border-radius"] = value.two.number + (value.two.type ?? this.numType);


  }
  //border_solid2px
  //arial-1.5
  //red500_grey500

  //border_2px_solid => nice shortcut
  //border_tlb-2px-solid-50%
  //border_x-2px-dotted_

  //bad alternative
  //border-dashed-2px  (border should be a separate value. border doesn't have -.)
  
  element(values) {
    const res = {
      "border-collapse": "separate"
    };
    for (let value of values) {
      this.processValue(value, res);

    }

    //border_tlb-2px-solid-50%
    // ([tlbr]+)-<number>-(solid|dotted|dashed)-<number>
    // <number>-<number>-(solid|dotted|dashed)-[tlbr]+
    // (solid|dotted|dashed)-<number>(-<number>(-[tlbr]+)?)?
    //

    // <number> => border-width
    // image-<arg>-<number>-<word> => image
    // /(collapse|separate)/ => border-collapse: $1. defaults => border-collapse:separate.
    // we need to process individual values, and subvalue chains differently.
    // subvalue chain 1) border-image: url('border.png') 30 round
    // subvalue chain 2) direction-width-type-radiusWidth
    // subvalue chain 3) radius-radiusWidth
    // 
    // , and we have direction, then 
    //if the first value is a number, then that is border-width
    //if the first 
    return { border: "2px solid" };
  }

  child(values) {
    // return { border: "2px dotted" };
  }

  static keywords() {
    return ["border"];
  }
}