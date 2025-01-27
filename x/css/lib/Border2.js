import { LENGTH_PERCENT_POS } from "./utils.js";
import { logicalPairs, tlbr, postProcess, doPrefix } from "./utils2.js";

const STYLES = {
  word: /solid|dashed|dotted|double|groove|ridge|inset|outset/
};
const WIDTH = {
  word: /thin|medium|thick/,
  ...LENGTH_PERCENT_POS
};
const RADIUS = {
  r: [LENGTH_PERCENT_POS],
  radius: [LENGTH_PERCENT_POS]
};
// const BORDER_RADIUS = {
//   "%": a => a + "%",
//   "deg": a => a + "deg",
//   "rad": a => a + "rad",
// };

//todo add default value to the table?  //type, grabber, max, default
//todo when we do a dict, then it is random detection based on type and prefix.
//todo when we do a list, then it is sequenced detection.
const BORDER_MAIN = {
  "border-style": [STYLES],
  "border-width": [WIDTH],
  "border-radius": [RADIUS],
  "r2": [RADIUS],
};

const BORDER_DEFAULTS = {
  "border-style": ["solid"],
  "border-width": ["1/3rem"],
  "border-radius": ["0"],
};

const BORDER_POST = {
  "border-style": logicalPairs,
  "border-width": logicalPairs,
  "border-radius": ([ar], key) => tlbr(ar, key),
  r2: ([ar], key) => tlbr(ar, key),
};

//$border doesn't set border-color!! It uses * {border-color: inherit } set by $color.
export function border(start, args) {

  //todo start of overall function?
  const init = {};
  for (let key in BORDER_DEFAULTS)
    init[key] = start[key] ?? BORDER_DEFAULTS[key];
  const table = doPrefix(BORDER_MAIN, args);
  const res = Object.assign(init, table);
  const res2 = postProcess(BORDER_POST, res);
  //todo end of overall function??

  if (res2.r2) {
    res2["border-radius"] ??= "0";
    res2["border-radius"] += " / " + res2.r2;
    delete res2.r2;
  }
  return res2;
}

//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_rr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]
