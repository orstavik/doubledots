import { doSequence, makeGrabber, tailToVariables, postProcess, logicalPairs, single } from "./utils2.js";

function NUMBER({int, float, ["%"]: percent}) {
  return int ?? float ?? percent + "%";
}

//rgb[1,2,3], hsl[1,2,3,4]
function rgbHsl(args, prefix) {
  if (args.length >= 3 && args.length <= 4)
    return `${prefix}(${args.map(NUMBER).join(", ")})`;
}

//all the web colors as a regexp
const WEB_COLORS = /azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/;

function labLch(args, key) {
  let first = colorX(args[0]) ?? "";
  if (first) {
    first = `from ${first} `;
    args = args.slice(1);
  }
  let transparency = "";
  if (args[4]) {
    transparency = percent(args[4]) ?? "";
    if (transparency) transparency = " / " + transparency;
  }
  let abc = args.slice(0, 3).map(colorExpression);
  return `${key}(${first}${abc.join(" ")}${transparency})`;
}

{
  
}
//flatten the prefix into the value
//if we have a value, then we can also add an array of type checkers.
//todo these type checkers should fallback to the first one if not defined.
//todo if there are fewer arguments than expected, that is not a problem.
//todo if there are more arguments than expected, that is a problem.
//todo this means that the optional from color must be added last...
//todo this is not super 


const colorX = makeGrabber({  //rename grabber to argumentGrabber
  word: WEB_COLORS,
  hex: v => v,
  prefix: {
    rgb: rgbHsl,
    hsl: rgbHsl,
    rgba: rgbHsl,
    hsla: rgbHsl,
    lab: labLch,
    lch: labLch,
    oklab: labLch,
    oklch: labLch,
  },
  expr: v => v,
});

const COLOR_MAIN = [
  ["color", colorX, 1],
  ["--background-color", colorX, 2],
  ["border-color", colorX, 4],
];

const COLOR_POST = {
  "color": single,
  "--background-color": tailToVariables,
  "border-color": logicalPairs,
};

export function color2(start, args) {
  const res = doSequence(COLOR_MAIN, args); //returns a dictionary with arrays, that are checked for length
  const res2 = postProcess(COLOR_POST, res);
  return res2;
}