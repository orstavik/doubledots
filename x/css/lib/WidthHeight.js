import { isOnlyOne } from "./utils.js";

function calcLength(arg) {
  const { n, unit = "rem" } = arg;
  return n + unit;
}

//$w_10px => [normal]
//$w_70%_80% => [normal, max]
//$w_10px_70%_80% => [min, normal, max]
//$w_10px_70%_ => [min, normal]
function normalMinMax(prefix) {
  return function lengthShort(start, args) {
    args = args.map(({ args }) => args.map(calcLength)).map(isOnlyOne);
    let min, normal, max;
    if (args.length === 3)
      [min, normal, max] = args;
    else if (args.length === 2)
      [normal, max] = args;
    else
      [normal] = args;
    const res = {};
    if (min) res["min-" + prefix] = min;
    if (normal) res[prefix] = normal;
    if (max) res["max-" + prefix] = max;
    return res;
  };
}

const w = normalMinMax("width");
const h = normalMinMax("height");

export { w, h, w as width, h as height };

export function wMin(start, args) { return { "min-width": calcLength(args[0]) }; }
export function wMax(start, args) { return { "max-width": calcLength(args[0]) }; }

export function hMin(start, args) { return { "min-height": calcLength(args[0]) }; }
export function hMax(start, args) { return { "max-height": calcLength(args[0]) }; }
