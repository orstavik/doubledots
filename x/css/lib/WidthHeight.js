import { LENGTH_PERCENT, PrefixTable2 } from "./utils.js";

const LENGTH = PrefixTable2.processArg.bind(null, LENGTH_PERCENT);
function checkLENGTH(a){
  const b = LENGTH(a);
  if(a != null && b == null)
    throw new SyntaxError(`Invalid length: ${a}`);
  return b;
}

//$w_10px => [normal]
//$w_70%_80% => [normal, max]
//$w_10px_70%_80% => [min, normal, max]
//$w_10px_70%_ => [min, normal]
function normalMinMax(prefix) {
  return function lengthShort(start, args) {
    args = PrefixTable2.singles(args, 1, 3);
    args = args.map(a => checkLENGTH(a));
    let min, normal, max, res = {};
    if (args.length === 3) [min, normal, max] = args;
    if (args.length === 2) [normal, max] = args;
    if (args.length === 1) [normal] = args;
    if (min) res["min-" + prefix] = min;
    if (normal) res[prefix] = normal;
    if (max) res["max-" + prefix] = max;
    return res;
  };
}

const w = normalMinMax("width");
const h = normalMinMax("height");

export { w, h, w as width, h as height };

export function wMin(start, args) { return { "min-width": checkLENGTH(args[0]) }; }
export function wMax(start, args) { return { "max-width": checkLENGTH(args[0]) }; }

export function hMin(start, args) { return { "min-height": checkLENGTH(args[0]) }; }
export function hMax(start, args) { return { "max-height": checkLENGTH(args[0]) }; }
