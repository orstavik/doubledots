import { doSequence2, tailToVariables, postProcess, logicalPairs, single } from "./utils2.js";

//all the web colors as a regexp
const WEB_COLORS = /azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/;

const percentOr255 = {
  "%": (a, key) => a + key,
  int: a => a >= 0 && a <= 255 ? a : undefined,
};

const percentOr360 = {
  "%": (a, key) => a + key,
  int: a => a >= 0 && a <= 360 ? a : undefined,
  rad: (a, key) => a + key,
  deg: (a, key) => a + key,
};

const percentOr0to1 = {
  "%": (a, key) => a + key,
  float: a => a >= 0 && a <= 1 ? a : undefined,
  int: a => a == 0 || a == 1 ? a : undefined,
};

const LABCH = Object.fromEntries("labch".split("").map(k =>
  [k, { word: new RegExp(k), expr: v => v }]));

const colorX = {};
Object.assign(colorX, {
  word: WEB_COLORS,
  hex: v => v,
  rgb: [percentOr255, percentOr255, percentOr255, percentOr0to1, colorX],
  hsl: [percentOr360, percentOr0to1, percentOr0to1, percentOr0to1, colorX],
  lab: [LABCH.l, LABCH.a, LABCH.b, percentOr0to1, colorX],
  lch: [LABCH.l, LABCH.c, LABCH.h, percentOr0to1, colorX],
  oklab: [LABCH.l, LABCH.a, LABCH.b, percentOr0to1, colorX],
  oklch: [LABCH.l, LABCH.c, LABCH.h, percentOr0to1, colorX],
});

const COLOR_MAIN = [
  ["color", [colorX, 1]],
  ["--background-color", [colorX]],
  ["border-color", [colorX, , , , 1]],
];

const COLOR_POST = {
  "color": single,
  "--background-color": tailToVariables,
  "border-color": logicalPairs,
};

export function color2(start, args) {
  const res = doSequence2(COLOR_MAIN, args); //returns a dictionary with arrays, that are checked for length
  const res2 = postProcess(COLOR_POST, res);
  return res2;
}