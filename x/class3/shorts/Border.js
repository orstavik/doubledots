import { PrefixTable, calcNum, trbl } from "./utils.js";

const calc = calcNum.bind(null, 1 / 3, "rem");
const borderStyle = /solid|dashed|dotted|double|groove|ridge|inset|outset|none/;

const borderPrefix = PrefixTable({
  // possiblePrefixes, ArgTransformers, ArgGroupTransformers
  "border-width": [/|w|width/, [calc], [trbl]],
  "border-style": [/|s|style/, [borderStyle], [trbl]],
  "border-radius": [/r|radius/, [calc], [/*trbl*/]],
  "rr": [/rr/, [calc], [/*trbl*/]],
  //todo when we have an empty array, then we do the calc on the inner of that array?
  "border-collapse": [/collapse|separate/],
});

export function border(start, args){
  const res = borderPrefix(args, { ...start });
  if (res["border-collapse"]) {
    res["border-spacing"] = calc(res["border-collapse"]);
    res["border-collapse"] = res["border-collapse"].prefix;
  }
  // res["border-color"] ??= "var(--border-color)"; //we use * {border-color: inherit} instead
  return res;
}

export function _border(start, args){
  return border(start, args);
}
//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_vr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]

//todo change somehow //aSlashB
// function lengthSlash(a) {
//   if (a.expr == "/")
//     return "/";
//   return a;
// };