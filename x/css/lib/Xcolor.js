import { N, P, PP, Either, ListOf, ListOfSame, LogicalFour, Merge, ShorthandFunction, Word, BorderSwitch } from "./Xfunc.js";

const WEB_COLOR_NAMES = /azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/;

const Color = (function (Color) {
  const OP = "[*/+-]";
  const VAR = "[a-z][a-z0-9]+";
  const RGB = `([rgb])|(${VAR})|(${N})`;
  const HSL = `([hsl])|(${VAR})|(${N})`;
  const LAB = `([lab])|(${VAR})|(${N})`;
  const LCH = `([lch])|(${VAR})|(${N})`;
  const RGB_ALL = new RegExp(`^(${RGB}|(${OP}${RGB})*)$`);
  const HSL_ALL = new RegExp(`^(${HSL}|(${OP}${HSL})*)$`);
  const LAB_ALL = new RegExp(`^(${LAB}|(${OP}${LAB})*)$`);
  const LCH_ALL = new RegExp(`^(${LCH}|(${OP}${LCH})*)$`);
  const RGB_TOKEN = new RegExp(`${RGB}|(${OP})`, "g");
  const HSL_TOKEN = new RegExp(`${HSL}|(${OP})`, "g");
  const LAB_TOKEN = new RegExp(`${LAB}|(${OP})`, "g");
  const LCH_TOKEN = new RegExp(`${LCH}|(${OP})`, "g");

  function toCalc(RX, s) {
    const t = [...s.matchAll(RX)]
      .map(([s, rgb, v, n, o]) => v ? `var(--${v})` : s);
    return t.length == 1 ? s : `calc(${t.join(" ")})`;
  };

  const RGBCalc = Word(RGB_ALL, x => toCalc(RGB_TOKEN, x));
  const HSLCalc = Word(HSL_ALL, x => toCalc(HSL_TOKEN, x));
  const LABCalc = Word(LAB_ALL, x => toCalc(LAB_TOKEN, x));
  const LCHCalc = Word(LCH_ALL, x => toCalc(LCH_TOKEN, x));

  function toColorFunc(name, color = "", a, b, c, d = "") {
    return (!color && (name == "rgb" || name == "hsl")) ?
      `${name}${d && "a"}(${a},${b},${c}${d && `,${d}`})` : //old
      `${name}(${color ? `from ${color} ` : ""}${a} ${b} ${c}${d && ` /${d}`})`; //new
  }

  const ToColorFunc = (NAME, FUNC) => x => toColorFunc(NAME, ...FUNC(x));

  const WEB_COLORS = Word(WEB_COLOR_NAMES);
  const HEX = Word(/#[0-9a-f]{6}|#[0-9a-f]{3}/);
  const Rgb = ToColorFunc("rgb", ListOf("rgba|rgb", Color, RGBCalc, RGBCalc, RGBCalc, RGBCalc));
  const Hsl = ToColorFunc("hsl", ListOf("hsla|hsl", Color, HSLCalc, HSLCalc, HSLCalc, HSLCalc));
  const OkLab = ToColorFunc("oklab", ListOf("oklab", Color, LABCalc, LABCalc, LABCalc, LABCalc));
  const Lab = ToColorFunc("lab", ListOf("lab", Color, LABCalc, LABCalc, LABCalc, LABCalc));
  const OkLch = ToColorFunc("oklch", ListOf("oklch", Color, LCHCalc, LCHCalc, LCHCalc, LCHCalc));
  const Lch = ToColorFunc("lch", ListOf("lch", Color, LCHCalc, LCHCalc, LCHCalc, LCHCalc));
  const ColorVar = Word(/[a-z][a-z0-9-]*/, x => `var(--color-${x})`);
  return Color = Either(HEX, WEB_COLORS, Rgb, Hsl, Lab, Lch, OkLab, OkLch, ColorVar);
})();

/*

* { 
  border-color: inherit;
  border-block-color: inherit;
  border-inline-color: inherit;
  border-block-start-color: inherit;
  border-block-end-color: inherit;
  border-inline-start-color: inherit;
  border-inline-end-color: inherit;
  border-top-color: inherit; 
  border-right-color: inherit;
  border-bottom-color: inherit;
  border-left-color: inherit;
  text-decoration-color: inherit;
  caret-color: inherit;
  accent-color: inherit;
  text-emphasis-color: inherit;
  text-decoration-color: inherit;
  column-rule-color: inherit;
  outline-color: inherit;
}
*/
const BG_PROPS = Array(8).fill().map((_, i) => `--color${i ? "-" + i : ""}`, Color);
//singles of foreground+background+border colors
export const color = Merge(ListOf(null,
  P("color", Color),
  P("--background-color", Color),
  BorderSwitch(LogicalFour("color", ShorthandFunction(":", null, Color))),
));

export const bgColor = PP(BG_PROPS, ListOfSame(null, Color));
export const colorBorder = BorderSwitch(LogicalFour("color", ShorthandFunction(":", null, Color)));

export const colorCaret = P("caret-color", ListOf(null, Color));
export const colorAccent = P("accent-color", ListOf(null, Color));
export const colorTextEmphasis = P("text-emphasis-color", ListOf(null, Color));
export const colorTextDecoration = P("text-decoration-color", ListOf(null, Color));
export const colorColumnRule = P("column-rule-color", ListOf(null, Color));
export const colorOutline = P("outline-color", ListOf(null, Color));
export const colorTextShadow = P("--text-shadow-color", ListOf(null, Color));
export const colorDropShadow = P("--drop-shadow-color", ListOf(null, Color));
export const colorShadow = LogicalFour(["--box-shadow-color"], ListOfSame(null, Color));