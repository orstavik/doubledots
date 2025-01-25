import { PrefixTable, calcNum } from "./utils.js";

// const positiveDistance = calcNum(0, "px");

// function bracketSquare(n) {
//   return function ({ args }) {
//     if (args.length === 1)
//       if (args.every(a => a.length === n))
//         return args;
//   };
// }

const deg = calcNum.bind(null, 0, "deg");
const scale = calcNum.bind(null, 1, "");
const length = calcNum.bind(null, 1, "rem");

const default1 = a => a.length == 1 ? a : undefined;
const default2 = a => a.length <= 2 ? Array.from(a, v => v ?? 0) : undefined;
const default23 = a =>
  (a.length == 3 || a.length == 2) ? Array.from(a, v => v ?? 0) :
    a.length == 1 ? (a.push(0), a) :
      undefined;
const offset = /^(left|right|top|bottom|center)$/;
const origin = (a, i) => i == 2 ? length(a) :
  i < 2 ? (a.match(offset) ? a : lengthPercent(a)) :
    undefined;


const transformTable = new PrefixTable({
  "translate": [/t|translate/, length, default23],
  "rotate": [/r|rotate/, deg, default1],
  "scale": [/s|scale/, scale, default23],
  "skew": [/skew/, deg, default2],
  "origin": [/o|origin/, origin, args => args.join(" ")],
  //"rotate3d": [/rotate3d/, ...todo],
  // "matrix": [/|m|matrix/, bracketSquare(3, 4), args => args.join("\n")],
  // "perspective": [/perspective/, positiveDistance, SINGULAR],
});

export function transform(start, args) {
  const res = transformTable.argsToDict(args);
  res.transform = "";
  for (let k of ["translate", "scale", "skew"]) {
    const v = res[k];
    delete res[k];
    if (v) {
      if (v.length === 3) k += "3d";
      res.transform += `${k}(${v.join(", ")}) `;
    }
  }
  return res;
}