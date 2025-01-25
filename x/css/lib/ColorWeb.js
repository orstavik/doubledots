import { SINGULAR, PrefixTable2, trbl, clamp } from "./utils.js";

function webColor(arg) {
  return arg?.hex ?? arg;
}

const colorTable = new PrefixTable2({
  "color": [, webColor, SINGULAR],
  "--background-color": [, webColor, SINGULAR],
  "border-color": [, webColor, clamp(1, 4)],
});

export function color(start, topArgs) {
  const res = colorTable.argsToDict(topArgs);
  trbl(res, "border-color");
  return res;
}