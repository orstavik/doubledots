import { PrefixTable, spaceJoin, calcNum, isOnlyOne } from "./utils.js";

const calc = calcNum.bind(null, 1 / 3, "rem");
const borderStyle = /solid|dashed|dotted|double|groove|ridge|inset|outset|none/;

const borderPrefix = new PrefixTable({
  "border-style": [/|s|style/, borderStyle, spaceJoin],
  "border-width": [/|w|width/, calc, spaceJoin],
  "border-radius": [/r|radius/, calc, spaceJoin],
  r2: [/rr|r2/, calc, spaceJoin]
});

//$border doesn't set border-color!! It uses * {border-color: inherit } set by $color.
export function border(start, args) {
  const res = borderPrefix.argsToDict(args);
  res["border-style"] ??= "solid";
  res["border-width"] ??= "1/3rem";
  if (res.r2) {
    res["border-radius"] ??= "0";
    res["border-radius"] += " / " + res.r2;
    delete res.r2;
  }
  return res;
}

export function _border(start, args) {
  return border(start, args);
}
//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_rr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]

// function positiveNumberOrPercentOrFill(arg) {
//   if (arg === "fill")
//     return arg;
//   const { n, unit } = arg;
//   if (n && ((unit === "%") || n >= 0 && !unit))
//     return arg;
// }

// function lengthOrNumberAndPositive(arg) {
//   const { n, unit } = arg;
//   if (n && unit && n >= 0)
//     return arg;
// }

// const borderImagePrefix = new PrefixTable({
//   "border-image-source": [/|src|source/, ({ quote }) => `url(${quote})`, isOnlyOne],
//   "border-image-repeat": [/repeat|round|space|stretch/, , spaceJoin], //max 2
//   "border-image-width": [/w|width/, calc],
//   "border-image-slice": [/slice/, intPercentFill, spaceJoin],
//   "border-image-outset": [/o|outset/, calc],
// });

// export function borderImage(start, args) {
//   const res = borderImagePrefix.argsToDict(args);
//   if (res["border-image-slice"])
//     trbl() ??= "none";
// }