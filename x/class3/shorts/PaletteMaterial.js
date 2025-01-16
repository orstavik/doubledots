import { PrefixTable, tailToVariables, isOnlyOne, trbl } from "./utils.js";

const materialColors500 = {
  red: "red",//"#F44336",
  pink: "#E91E63",
  purple: "#9C27B0",
  "deep-purple": "#673AB7",
  indigo: "#3F51B5",
  blue: "#2196F3",
  "light-blue": "#03A9F4",
  cyan: "#00BCD4",
  teal: "#009688",
  green: "#4CAF50",
  "light-green": "#8BC34A",
  lime: "#CDDC39",
  yellow: "#FFEB3B",
  amber: "#FFC107",
  orange: "#FF9800",
  "deep-orange": "#FF5722",
  brown: "#795548",
  grey: "#9E9E9E",
  "blue-grey": "#607D8B",
};

const names = Object.keys(materialColors500).join("|");
const COLOR = new RegExp(`^(${names})(\\d{1,3})(?:a(\\d{1,2}))?$`);

function computeColor(arg) {
  const m = arg.match(COLOR);
  if (!m)
    throw new SyntaxError(`Bad material color: ${arg}. Should be name123<a45> like red500 or deep-orange333a80.`);
  let [, color, light, alpha] = m;
  light = Number(light) / 1000;
  alpha = alpha != null ? " / " + Number(alpha) / 100 : "";
  return `oklab(from var(--palette-material-${color}) calc(.5 + (${light} * var(--dark-mode))) a b${alpha})`;
}

const colorTable = new PrefixTable({
  "--color": [, computeColor, isOnlyOne],
  "--background-color": [, computeColor,],
  "border-color": [, computeColor],
  "text-decoration-color": [, computeColor, isOnlyOne],
});

export function paletteMaterial(start, args) {
  return Object.fromEntries(Object.entries(materialColors500).map(([k, v]) =>
    [`--palette-material-${k}`, v]));
}

export function colorMaterial(start, args) {
  const res = colorTable.argsToDict(args);
  tailToVariables(res, "--background-color");
  trbl(res, "border-color");
  if ("--color" in res)
    res["color"] = "var(--color)";
  return res;
}

// export function background(start, args){
//   return {
//     "background-color": "var(--background-color)"
//   }
// }