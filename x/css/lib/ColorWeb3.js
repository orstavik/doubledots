import { doSequence2, tailToVariables, logicalFour, uno } from "./utils2.js";

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

function colorFunc(args, key) {
  const from = args[4] ? `from ${args[4]} ` : "";
  const alpha = args[3] ? ` / ${args[3]}` : "";
  const abc = args.slice(0, 3).map(a => a || 0).join(" ");
  return `${key}(${from}${abc}${alpha})`;
}

const colorX = {};
Object.assign(colorX, {
  word: WEB_COLORS,
  hex: v => v,
  rgb: [colorFunc, percentOr255, percentOr255, percentOr255, percentOr0to1, colorX],
  hsl: [colorFunc, percentOr360, percentOr0to1, percentOr0to1, percentOr0to1, colorX],
  lab: [colorFunc, LABCH.l, LABCH.a, LABCH.b, percentOr0to1, colorX],
  lch: [colorFunc, LABCH.l, LABCH.c, LABCH.h, percentOr0to1, colorX],
  oklab: [colorFunc, LABCH.l, LABCH.a, LABCH.b, percentOr0to1, colorX],
  oklch: [colorFunc, LABCH.l, LABCH.c, LABCH.h, percentOr0to1, colorX],
});

const COLOR_MAIN = [
  ["color", [uno, colorX]],
  ["--background-color", [tailToVariables, colorX]],
  ["border-color", [logicalFour, colorX]],
];

export function color2(start, args) {
  const res = doSequence2(COLOR_MAIN, args);
  return res;
}