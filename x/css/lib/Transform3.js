import { doPrefix, LENGTH_PERCENT, spaceJoin2 } from "./utils2.js";

// const positiveDistance = calcNum(0, "px");

// function bracketSquare(n) {
//   return function ({ args }) {
//     if (args.length === 1)
//       if (args.every(a => a.length === n))
//         return args;
//   };
// }

const default1 = a => a.length == 1 ? a : undefined;
const default2 = a => a.length <= 2 ? Array.from(a, v => v ?? 0) : undefined;
const default23 = a =>
  (a.length == 3 || a.length == 2) ? Array.from(a, v => v ?? 0) :
    a.length == 1 ? (a.push(0), a) :
      undefined;

const ORIGIN = {
  ...LENGTH_PERCENT,
  word: /left|right|top|bottom|center/,
};

const translate = {
  t: [default23, length],
  translate: [default23, length],
};
const rotate = {
  r: [default1, deg],
  rotate: [default1, deg],
};
const scale = {
  s: [default23, scale],
  scale: [default23, scale],
};
const skew = {
  skew: [default2, DEGREES],
};
const origin = {
  o: [args => args.join(" "), ORIGIN],
  origin: [args => args.join(" "), ORIGIN],
};

const MAIN = {
  translate: [spaceJoin2, translate],
  rotate: [spaceJoin2, rotate],
  scale: [spaceJoin2, scale],
  skew: [spaceJoin2, skew],
  origin: [spaceJoin2, origin],

  //"rotate3d": [/rotate3d/, ...todo],
  // "matrix": [/|m|matrix/, bracketSquare(3, 4), args => args.join("\n")],
  // "perspective": [/perspective/, positiveDistance, SINGULAR],
};

export function transform(start, args) {
  const res = doPrefix(MAIN, args);
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