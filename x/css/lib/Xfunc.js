import { Expression } from "./Xengine.js";

function hitMe(FUNCS, x) {
  for (let func of FUNCS)
    try { return func(x); } catch (e) { }
}

export function Word(rx, func) {
  const RX = new RegExp(`^(?:${rx.source})$`);
  return function word(x) {
    const m = x.match?.(RX);
    if (m)
      return func ? func(...m) : x;
    throw new SyntaxError(`Invalid argument: ${x} => ${rx.source}.`);
  };
}

export const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;
const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

function Clamp(INT, MIN, MAX) {
  if (INT && MIN != null && MAX != null)
    return n => Number.isInteger(n) && MIN <= n && n <= MAX;
  if (INT && MIN != null)
    return n => Number.isInteger(n) && MIN <= n;
  if (INT && MAX != null)
    return n => Number.isInteger(n) && n <= MAX;
  if (INT)
    return n => Number.isInteger(n);
  if (MIN != null && MAX != null)
    return n => MIN <= n && n <= MAX;
  if (MIN != null)
    return n => MIN <= n;
  if (MAX != null)
    return n => n <= MAX;
};

export function CheckNum(UNITS, MIN, MAX, IsINT) {
  const RX = new RegExp(UNITS ? `${NUM}(${UNITS})` : NUM);
  const clamp = Clamp(IsINT, MIN, MAX);
  if (!clamp)
    return Word(RX);

  function validator(str, n, frac) {
    n = Number(n);
    frac && (n /= Number(frac));
    if (clamp(n))
      return str;
  };
  return Word(RX, validator);
}

export const PositiveLengthPercent = CheckNum(LENGTHS_PER, 0);


function signature(exp, ALIASES, MAX) {
  if (exp instanceof Expression) {
    if (ALIASES == null || ALIASES.includes(exp.name))
      if (MAX == null || exp.args.length <= MAX)
        return exp.args;
  } else if (ALIASES.includes(""))
    return [exp];
  throw `Signature mismatch: (${ALIASES})/1-${MAX} doesn't accept ${exp}.`;
}

export function ListOfSame(Aliases, FUNC) {
  Aliases &&= Aliases.split("|");
  return function (x) {
    return signature(x, Aliases).map(a => a == null ? a : FUNC(a));
  };
}

export function ListOf(Aliases, ...FUNCS) {
  Aliases &&= Aliases.split("|");
  return function (x) {
    return signature(x, Aliases, FUNCS.length).map((a, i) => a == null ? a : FUNCS[i](a));
  };
}

function Either(...FUNCS) {
  return function either(exp) {
    const res = hitMe(FUNCS, exp);
    if (res == undefined)
      throw new SyntaxError(`No match in Either: ${exp}`);
    return res;
  };
}


function spaceJoin(x) {
  return x instanceof Array ? x.join(" ") : x;
}

function toCssVarList(NAME, ar) {
  return !(ar instanceof Array) ? { [`--${NAME}`]: ar } :
    Object.fromEntries(ar.map((a, i) => [`--${NAME}${i ? "-" + i : ""}`, a]));
}

function toLogicalFour(NAME, ar) {
  if (!(ar instanceof Array))
    return { [NAME]: ar };
  if (ar.length === 1)
    return { [NAME]: ar[0] };
  if (ar.length === 2)
    return {
      [NAME + "-block"]: ar[0],
      [NAME + "-inline"]: ar[1],
    };
  if (ar.length === 3)
    return {
      [NAME + "-block-start"]: ar[0],
      [NAME + "-inline"]: ar[1],
      [NAME + "-block-end"]: ar[2],
    };
  return {
    [NAME + "-block-start"]: ar[0],
    [NAME + "-inline-start"]: ar[1],
    [NAME + "-block-end"]: ar[2],
    [NAME + "-inline-end"]: ar[3]
  };
}

export const P = (PROP, FUNC) => x => ({ [PROP]: spaceJoin(FUNC(x)) });
export const LogicalFour = (NAME, FUNC) => x => toLogicalFour(NAME, FUNC(x));
export const CssTextFunction = (NAME, FUNC) => x => `${NAME}(${FUNC(x).join()})`;
export const CssVarList = (PROP, FUNC) => x => toCssVarList(PROP, FUNC(x));

export function Merge(cb) {
  return function (exp) {
    const ar = cb(exp);
    const res = {};
    for (let res2 of ar) {
      for (let k in res2)
        if (res2[k] == null)
          delete res2[k];
      for (let k in res)
        for (let k2 in res2)
          if (k === k2 || k.startsWith(k2 + "-") || k2.startsWith(k + "-"))
            throw new SyntaxError(`Property crash: ${k} vs ${k2}`);
      Object.assign(res, res2);
    }
    return res;
  };
}

export function Dictionary(...FUNCS) {
  return function ({ name, args }) {
    const res = [];
    for (let arg of args) {
      const res2 = hitMe(FUNCS, arg);
      if (res2 == undefined)
        throw new SyntaxError(`Invalid argument: ${name}(...${arg.toString()}...)`);
      res.push(res2);
    }
    return res;
  };
}

//todo there are different ways to do the logic here..
//todo length == 2, I think that we could have top/bottom too
//todo length == 3, then the third becomes all the inline ones
//todo length === 4, then forth is the inline on the end side
function LogicalEight(NAME, FUNC, DEFAULT = "0") {
  return function (exp) {
    const args = FUNC(exp);
    if (!(args instanceof Array))
      return { [NAME]: args };
    if (args.length === 1)
      return { [NAME]: args[0] };
    let [bss, iss, bes, ies, bse, ise, bee, iee] = args;
    if (args.length === 2) ise = ies = iee = iss, bse = bes = bee = bss;
    if (args.length === 3) ise = ies = iee = iss, bse = bss, bee = bes;
    if (args.length === 4) ise = iss, iee = ies, bse = bss, bee = bes;
    if (args.length === 5) ise = iss, iee = ies, bee = bes;
    if (args.length === 6) iee = ies, bee = bes;
    if (args.length === 7) iee = ies;
    const res = {};
    if (bss || iss) res[NAME + "-top-left"] = `${bss ?? DEFAULT} ${iss ?? DEFAULT}`;
    if (bse || ies) res[NAME + "-top-right"] = `${bse ?? DEFAULT} ${ies ?? DEFAULT}`;
    if (bes || ise) res[NAME + "-bottom-left"] = `${bes ?? DEFAULT} ${ise ?? DEFAULT}`;
    if (bee || iee) res[NAME + "-bottom-right"] = `${bee ?? DEFAULT} ${iee ?? DEFAULT}`;
    return res;
  };
}

//min(x) => clamp(x,,)
//max(x) => clamp(,,x)
//fit|fit-content(x) => clamp(min-content, x, max-content)
//clamp => clamp(,,x)
function MinNormalMax(PROP, cb) {
  const MIN = "min-" + PROP, MAX = "max-" + PROP;
  return function mnm(exp) {
    const { name, args } = exp;
    if (name === "min" && args.length === 1)
      return { [MIN]: cb(args[0]) };
    if (name === "max" && args.length === 1)
      return { [MAX]: cb(args[0]) };
    if ((name === "fit" || name === "fit-content") && args.length === 1)
      return { [MIN]: "min-content", [PROP]: cb(args[0]), [MAX]: "max-content" };
    if (name === "clamp" && args.length === 3)
      return { [MIN]: cb(args[0]), [PROP]: cb(args[1]), [MAX]: cb(args[2]) };
    return { [PROP]: cb(exp) };
  };
}


function BorderSwitch(func) {
  return function (exp) {
    const res = func(exp);
    return Object.fromEntries(Object.entries(res).map(([k, v]) => {
      const [wsr, ...dirs] = k.split("-");
      k = ["border", ...dirs, wsr].join("-");
      return [k, v];
    }));
  };
}

//todo Dictionary should check that none of the properties coming out are already set.
//border-colors controlled by $color
export const border = BorderSwitch(Merge(Dictionary(
  LogicalFour("style", ListOfSame("style|s|", Word(/solid|dotted|dashed|double/))),
  LogicalFour("width", Either(
    ListOfSame("width|w|", PositiveLengthPercent),
    Word(/thin|medium|thick/)
  )),
  LogicalEight("radius", ListOfSame("radius|r", PositiveLengthPercent)),
  LogicalFour("radius", ListOfSame("r2|radius-og", PositiveLengthPercent))
  //needs to be NativeEight
)));

const WEB_COLORS = Word(/azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/);
const HEX = Word(/#[0-9a-f]{6}|#[0-9a-f]{3}/);

const Zero360Deg = CheckNum("deg|rad|");
const Zero255 = CheckNum("", 0, 255);
const Percent = CheckNum("%|", 0, 100);
const RGB = CssTextFunction("rgb", ListOf("rgb", Zero255, Zero255, Zero255));
const RGBA = CssTextFunction("rgba", ListOf("rgba|rgb", Zero255, Zero255, Zero255, Percent));
const HSL = CssTextFunction("hsl", ListOf("hsl", Zero360Deg, Percent, Percent));
const HSLA = CssTextFunction("hsla", ListOf("hsla|hsl", Zero360Deg, Percent, Percent, Percent));

const Color = Either(
  HEX,
  WEB_COLORS,
  RGB,
  RGBA,
  HSL,
  HSLA
);

export const size = Merge(ListOf(undefined,
  MinNormalMax("block-size", PositiveLengthPercent),
  MinNormalMax("inline-size", PositiveLengthPercent)
));

export const color = Merge(ListOf(null,
  P("color", Color),
  CssVarList("background-color", ListOfSame("background-color|bg|", Color)),
  BorderSwitch(LogicalFour("color", ListOfSame("border|b", Color))),
));

export const cursor = P("cursor", Word(/default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out/));//auto is excluded
