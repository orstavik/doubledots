import { PrefixTable, calcNum, trbl } from "./utils.js";

const calc = calcNum.bind(null, 1 / 3, "rem");
const borderStyle = /solid|dashed|dotted|double|groove|ridge|inset|outset|none/;

const borderPrefix = PrefixTable({
  "border-width": [/|w|width/, [calc], [trbl]],
  "border-style": [/|s|style/, [borderStyle], [trbl]],
  "border-radius": [/r|radius/, [calc], [/*trbl*/]],
  "rr": [/rr/, [calc], [/*trbl*/]],
  //todo change somehow //aSlashB
  //todo when we have an empty array, then we do the calc on the inner of that array?
  "border-collapse": [/collapse|separate/],
});


// function lengthSlash(a) {
//   if (a.expr == "/")
//     return "/";
//   // return length;
//   return a;
// };

//possible prefixes / ArgumentConverter / valueConverter

export class Border {

  static parse(args) {
    //todo this can utilize the css as a default value..
    const res = borderPrefix(args, this.css);
    if (res["border-collapse"]) {
      res["border-spacing"] = calc(res["border-collapse"]);
      res["border-collapse"] = res["border-collapse"].prefix;
    }
    return res;
  }

  static parseChild(args) {
    return this.parse(args);
  }

  static get css() {
    return {
      "border-width": "0.3rem"
    };
  }

  static get childCss() {
    return {
      ":first": {
        "border-top-width": "1rem"
      }
    };
  }
}

//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_vr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]