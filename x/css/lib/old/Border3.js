import { LENGTH_PERCENT_POS, spaceJoin4 } from "../utils.js";
import { logicalFour, doPrefix } from "../utils2.js";

const STYLES = {
  word: /solid|dashed|dotted|double|groove|ridge|inset|outset/
};
const WIDTH = {
  word: /thin|medium|thick/,
  ...LENGTH_PERCENT_POS
};

// const BORDER_RADIUS = {
//   "%": a => a + "%",
//   "deg": a => a + "deg",
//   "rad": a => a + "rad",
// };
//radius needs a better sequencing and using the block and inline for altered radias.
// export function logicalToTRBL(args) {
//   const [t, l = t, b = t, r = l] = args;
//   return `${t} ${r} ${b} ${l}`;
// }

//todo maybe we want a different $short for $border-radius? nah.. this is not what we want.

//if we have a radius-block and radius-inline, this makes sense.
//radius[[block][inline]]
//


const BORDER_MAIN = {
  "border-style": [logicalFour, STYLES],
  "border-width": [logicalFour, WIDTH],
  // "border-radius": [spaceJoin4, {
  //   r: [([a]) => a, LENGTH_PERCENT_POS],
  //   radius: [([a]) => a, LENGTH_PERCENT_POS]  
  // }],
};

const BORDER_DEFAULTS = {
  "border-style": {
    "border-block-start-style": "solid",
    "border-inline-start-style": "solid",
    "border-block-end-style": "solid",
    "border-inline-end-style": "solid",
  },
  "border-width": {
    "border-block-start-width": "1/3rem",
    "border-inline-start-width": "1/3rem",
    "border-block-end-width": "1/3rem",
    "border-inline-end-width": "1/3rem",
  },
  //todo wipe out the images and gradients etc from the result table
};

function setDefaults(start, res2, defaults) {
  const res = { ...res2 };
  for (let key in defaults)
    if (!(key in start || key in res2))
      Object.assign(res, defaults[key]);
  for (let key in res)
    if (res[key] == undefined)
      delete res[key];
  return res;
}

//$border doesn't set border-color!! It uses * {border-color: inherit } set by $color.
export function border(start, args) {
  debugger;
  const argRes = doPrefix(BORDER_MAIN, args);
  const res = setDefaults(start, argRes, BORDER_DEFAULTS);
  // if (res.r2) {
  //   res["border-radius"] ??= "0";
  //   res["border-radius"] += " / " + argRes.r2;
  //   delete res.r2;
  // }
  return res;
}

//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_rr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]
