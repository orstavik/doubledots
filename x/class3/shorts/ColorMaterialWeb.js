import { PrefixTable, tailToVariables, isOnlyOne, trbl } from "./utils.js";

const materialColors500 = {
  red: "#F44336",
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

const WEB_COLORS = /(AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGray|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGray|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGray|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gray|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGray|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGray|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|RebeccaPurple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGray|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)/.source;
const DDaDD = /(\d\d?)(?:a(\d\d?))/.source;
const WEB_COLOR = new RegExp(`^${WEB_COLORS}${DDaDD}$`, "i");

function computeWebColor(arg) {
  const m = arg.match(WEB_COLOR);
  if (!m)
    throw new SyntaxError(`Bad material color: ${arg}. Should be webColorName99<a99> like red50 or DarkOrange1A80.`);
  let [, color, light, alpha] = m;
  light = (Number(light) / 100) - .5;
  alpha = alpha != null ? ` / ${Number(alpha)}%` : "";
  return `oklab(from ${color} calc(.5 + (${light} * var(--dark-mode))) a b${alpha})`;
}

function computeMaterialColor(arg) {
  const m = arg.match(COLOR);
  if (!m)
    throw new SyntaxError(`Bad material color: ${arg}. Should be name123<a45> like red500 or deep-orange333a80.`);
  let [, color, light, alpha] = m;
  light = Number(light) / 1000;
  alpha = alpha != null ? " / " + Number(alpha) / 100 : "";
  return `oklab(from var(--palette-material-${color}) calc(.5 + (${light} * var(--dark-mode))) a b${alpha})`;
}

function colorTable(computeColor) {
  return new PrefixTable({
    "--color": [, computeColor, isOnlyOne],
    "--background-color": [, computeColor,],
    "border-color": [, computeColor],
    "text-decoration-color": [, computeColor, isOnlyOne],
  });
}

function postProcessColorProperties(res) {
  tailToVariables(res, "--background-color");
  trbl(res, "border-color");
  if ("--color" in res)
    res["color"] = "var(--color)";
  return res;
}


export function paletteMaterial(start, args) {
  return Object.fromEntries(Object.entries(materialColors500).map(([k, v]) =>
    [`--palette-material-${k}`, v]));
}

const materialColorTable = colorTable(computeMaterialColor);
export function colorMaterial(start, args) {
  return postProcessColorProperties(materialColorTable.argsToDict(args));
}

const webColorTable = colorTable(computeWebColor);
export function colorWeb(start, args) {
  return postProcessColorProperties(webColorTable.argsToDict(args));
}

// export function background(start, args){
//   return {
//     "background-color": "var(--background-color)"
//   }
// }