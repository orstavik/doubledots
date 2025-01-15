import { PrefixTable, calcNum } from "./SHORT.js";

//what to do with the url?

const calc = calcNum.bind(null, 1 / 3, "rem");

const borderImagePrefix = PrefixTable({
  "border-repeat": [/stretch|repeat|round|space/],
  "border-width": [/|w|width/, [calc]],
  "border-outset": [/o|outset/, [calc]],
  "border-slice": [/s|slice/],
  "url": [/url/, [/[a-z][a-z0-9-]*/]]
});

const BorderImageDefault = {
  ["border-source"]: "var(--border-image)"
};


export class BorderImage {
  static parse(base, args) {
    const res = borderImagePrefix(args);
    Object.assign(res, BorderImageDefault);
    if (res.url)
      res["border-source"] = `var(--${res.url}, ${res["border-source"]})`;
    debugger;

    //at the end, turn this thing into a border-image shorthand? why not?
    /* source | slice | width | outset | repeat */
    // border-image: url("/images/border.png") 27 23 / 50px 30px / 1rem ;

    return res;
  }
}