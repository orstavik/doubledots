import { isOnlyOne, PrefixTable, trbl } from "./utils.js";

function webColor(arg) {
  return arg?.hex ?? arg;
}

const colorTable = new PrefixTable({
  "color": [, webColor, isOnlyOne],
  "--background-color": [, webColor, isOnlyOne],
  "border-color": [, webColor, args => args.length < 5 && args],
});

export function color(start, topArgs) {
  const res = colorTable.argsToDict(topArgs);
  trbl(res, "border-color");
  return res;
}