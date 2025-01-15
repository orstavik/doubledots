import { PrefixTable, trbl, tailToVariables, isOnlyOne } from "./SHORT.js";

const webColors = /^(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen)$/i;

export function color({ word }) {
  if (word?.match(webColors))
    return word;
  throw new SyntaxError("unknown color");
}

export function reduceSpaceName(rgb) {
  rgb = rgb.join("").split("").filter(/a-z/).join("");
  return rgb === "lab" ? "oklab" :
    rgb === "lch" ? "oklch" :
      rgb === "hsl" ? "hsl" :
        rgb === "rgb" ? "rec2020" : false;
}

function vectorToColor(prefix, vec) {
  if (vec.length === 3)//find the space.
    return;
      //     //if the first is a colorName or a variable, then shift 1=> "from color"
  //     //the from color needs the varName as a fallback. and the fallbacks is also hard typed in the colors.
  //     //then, shift 3 => rgb
  //     //then, shift 1 => alpha
  //     debugger;
  //     if (c.length === 3) {
  //       propName = `var(${propName}, #010101)`;
  //       return `color(oklch from ${propName} )`;

}

export function parseColor(c, propName) {
  const { word, hex, expr, num, args, prefix } = c;
  if (hex) return hex;
  if (word) return word.match(webColors) ? word : `var(--color-${word})`;
  if(expr) return `oklch(${expr})`; // todo add propName
  if(args )return vectorToColor(prefix, args, propName);
  throw new SyntaxError("unknown color" + c);
}

const colorPrefix = PrefixTable({
  "--border-color": [/border|bc/, [parseColor], [trbl]],
  "--background-color": [/bg|background/, [parseColor], [tailToVariables]], //multiplesBecomeVariables
  "color": [/|text|fg/, [parseColor], [isOnlyOne]],
});

export class Color {
  static parse(args) {
    const res = colorPrefix(args);
    if (res.color.length > 1)
      throw new SyntaxError("too many main colors: " + res.color.join(","));
    trbl(res, "--border-color");
    if ("--background-color" in res) {
      tailToVariables(res, "--background-color");
      res.background = "var(--background-color)";
    }
    spaceJoin(res);
    return res;
  }
}