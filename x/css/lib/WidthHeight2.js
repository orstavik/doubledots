import { doSequence2, uno, WIDTH, minNormalMax } from "./utils2.js";
//$w_10px => [normal]
//$w_70%_80% => [normal, max]
//$w_10px_70%_80% => [min, normal, max]
//$w_10px_70%_ => [min, normal]

const MAIN = [
  ["one", [uno, WIDTH]],
  ["two", [uno, WIDTH]],
  ["three", [uno, WIDTH]],
];

export function w(start, args) {
  return minNormalMax(doSequence2(MAIN, args), "width");
}
export function h(start, args) {
  return minNormalMax(doSequence2(MAIN, args), "height");
}

export function wMin(_, a) { return doSequence2([["min-width", [uno, WIDTH]]], a); }
export function wMax(_, a) { return doSequence2([["max-width", [uno, WIDTH]]], a); }
export function hMin(_, a) { return doSequence2([["min-height", [uno, WIDTH]]], a); }
export function hMax(_, a) { return doSequence2([["max-height", [uno, WIDTH]]], a); }
