import { PrefixTable, tailToVariables, isOnlyOne, trbl } from "./utils.js";


const MATERIAL_COLORS = {
  red: "#F44336",
  pink: "#E91E63",
  purple: "#9C27B0",
  deepPurple: "#673AB7",
  indigo: "#3F51B5",
  blue: "#2196F3",
  lightBlue: "#03A9F4",
  cyan: "#00BCD4",
  teal: "#009688",
  green: "#4CAF50",
  lightGreen: "#8BC34A",
  lime: "#CDDC39",
  yellow: "#FFEB3B",
  amber: "#FFC107",
  orange: "#FF9800",
  deepOrange: "#FF5722",
  brown: "#795548",
  grey: "#9E9E9E",
  blueGrey: "#607D8B",
};
const MATERIAL_NAMES = Object.keys(MATERIAL_COLORS).join("|");

const WEB_COLORS = /AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGray|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGray|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGray|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gray|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGray|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGray|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|RebeccaPurple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGray|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen/.source;

const DDaDD = /(\d\d?)(?:a(\d\d?))/.source;
const DDdaDD = /(\d\d?\d?)(?:a(\d\d?))/.source;

const MATERIAL_COLOR = new RegExp(`^(${MATERIAL_NAMES})${DDdaDD}$`, "i");
const WEB_COLOR = new RegExp(`^(${WEB_COLORS})${DDaDD}$`, "i");

function parseColor(rx, arg, scale = 1000) {
  const m = arg.match(rx);
  if (!m)
    throw new SyntaxError(`Bad color name: ${arg}.
Color name format is: "color<0-${scale - 1}>[a<0-99>]"
Examples: "red${scale / 2}" or "darkOrange${scale / 10 - 1}a1"`
    );
  let [, color, light, alpha] = m;
  light = Number(light) / scale;
  alpha &&= alpha != null ? ` / ${Number(alpha)}%` : "";
  return { color, light, alpha };
}

function absoluteDarkness(light) {
  return `calc(0.5 * (1 + var(--dark-mode) * (${light * 2} - 1)) * 100%)`;
}

function computeWebColor(arg) {
  const { color, light, alpha } = parseColor(WEB_COLOR, arg, 100);
  return `oklab(from ${color} ${absoluteDarkness(light)} a b${alpha})`;
}

function computeMaterialColor(arg) {
  const { color, light, alpha } = parseColor(MATERIAL_COLOR, arg, 1000);
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
  return Object.fromEntries(Object.entries(MATERIAL_COLORS).map(([k, v]) =>
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