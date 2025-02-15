import { CheckNum, CssVarList, Either, ListOf, LogicalFour, Merge, P, ShorthandFunction, ShadowProps, Word, BorderSwitch } from "./Xfunc.js";

const WEB_COLORS = Word(/azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/);
const HEX = Word(/#[0-9a-f]{6}|#[0-9a-f]{3}/);
const Degree = CheckNum("deg|rad|");
const Zero255 = CheckNum("", 0, 255);
const Percent = CheckNum("%|", 0, 100);
const ZeroOne = CheckNum("", 0, 1);

const Calc = L =>
  Word(new RegExp(`^[${L}0-9.e*/+-]+$`), x => `calc(${x.replaceAll(/[*/+-]/g, " $& ")})`);

function rgbText(name, a, b, c, d = "") {
  return `${name}${d && "a"}(${a},${b},${c}${d && ` /${d}`})`;
}

function labText(name, color = "", a, b, c, d = "") {
  return `${name}(${color ? `from ${color} ` : ""}${a} ${b} ${c}${d && ` /${d}`})`;
}

const LabText = (NAME, FUNC) => x => labText(NAME, ...FUNC(x));
const RgbText = (NAME, FUNC) => x => rgbText(NAME, ...FUNC(x));

const RGB = RgbText("rgb", ListOf("rgba|rgb", Zero255, Zero255, Zero255, Percent));
const HSL = RgbText("hsl", ListOf("hsla|hsl", Degree, Percent, Percent, Percent));
let Color;
const OKLAB = LabText("oklab", ListOf("oklab", Color, Calc("l"), Calc("a"), Calc("b"), ZeroOne));
const OKLCH = LabText("oklch", ListOf("oklch", Color, Calc("l"), Calc("c"), Degree, ZeroOne));
const LAB = LabText("lab", ListOf("lab", Color, Calc("l"), Calc("a"), Calc("b"), ZeroOne));
const LCH = LabText("lch", ListOf("lch", Color, Calc("l"), Calc("c"), Degree, ZeroOne));

Color = Either(
  HEX,
  WEB_COLORS,
  RGB,
  HSL,
  LAB,
  LCH,
  OKLAB,
  OKLCH
);

/*

 * { 
  border-top-color: inherit; 
  border-right-color: inherit;
  border-bottom-color: inherit;
  border-left-color: inherit;
  text-decoration-color: inherit;
}
  // --box-shadow-color  
  // --text-shadow-color
  // --drop-shadow-color
  outline-color
Usage: Colors the outline drawn around an element, often used for focus styles.
  column-rule-color
Usage: Sets the color of the rule (divider) between columns in a multi-column layout.
  text-emphasis-color
Usage: Colors the emphasis marks used in some typographic styles.
   caret-color
Usage: Determines the color of the text insertion cursor (caret) in editable elements.
  accent-color
Usage: Applies to form controls (checkboxes, radio buttons, etc.) and other UI components to set their accent color.
*/
export const color = Merge(ListOf(null,
  P("color", Color),
  CssVarList("background-color", ShorthandFunction(":", "background-color|bg|", Color)),
  BorderSwitch(LogicalFour("color", ShorthandFunction(":", "border|b", Color))),
  ShadowProps(["--box-shadow-color", "--text-shadow-color", "--drop-shadow-color"],
    ListOf("shadow|s", Color)),
  ListOf("caret|accent|text-emphasis|text-decoration|column-rule|outline", Color),
  ListOf("caret|accent|text-emphasis|text-decoration|column-rule|outline", Color),
  ListOf("caret|accent|text-emphasis|text-decoration|column-rule|outline", Color),
  ListOf("caret|accent|text-emphasis|text-decoration|column-rule|outline", Color),
  ListOf("caret|accent|text-emphasis|text-decoration|column-rule|outline", Color),
  ListOf("caret|accent|text-emphasis|text-decoration|column-rule|outline", Color)
));
