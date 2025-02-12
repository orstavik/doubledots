export const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;

const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

function hitMe(FUNCS, x) {
  for (let func of FUNCS)
    try { return func(x); } catch (e) { }
}

function DoRegEx(RX, func, x) {
  const m = x.match(RX);
  if (!m)
    throw new SyntaxError(`Invalid argument: ${x} => ${RX.source}.`);
  return func ? func(...m) : x;
}

export function Word(prefix, func) {
  (prefix instanceof RegExp) && (prefix = prefix.source);
  return DoRegEx.bind(null, new RegExp(`^(${prefix})$`), func);
}

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

  function validator(str, nFrac, n, frac) {
    n = Number(n);
    frac && (n /= Number(frac));
    if (clamp(n))
      return str;
  };
  return Word(RX, validator);
}

export function P(prop, FUNC) {
  return x => ({ [prop]: FUNC(x) });
}

export const PositiveLengthPercent = CheckNum(LENGTHS_PER, 0);

export function LogicalFour(PROP_ALIASES, ArgHandler) {
  const PROP = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 4 || !name.match(PROP_ALIASES))
      throw new SyntaxError(
        `${name}/1-4 doesn't match ${name}/${args.length}.`);
    let [bs, is, be, ie] = args.map(a => a == null ? a : ArgHandler(a));
    if (args.length === 1)
      return { [PROP]: bs };
    if (args.length === 2)
      return {
        [PROP + "-top"]: bs,
        [PROP + "-right"]: is,
        [PROP + "-bottom"]: bs,
        [PROP + "-left"]: is,
        [PROP + "-block"]: bs,
        [PROP + "-inline"]: is,
      };
    if (args.length === 3)
      return {
        [PROP + "-top"]: bs,
        [PROP + "-right"]: is,
        [PROP + "-bottom"]: be,
        [PROP + "-left"]: is,
        [PROP + "-block-start"]: bs,
        [PROP + "-block-end"]: be,
        [PROP + "-inline"]: is,
      };
    return {
      [PROP + "-top"]: bs,
      [PROP + "-right"]: ie,
      [PROP + "-bottom"]: be,
      [PROP + "-left"]: is,
      [PROP + "-block-start"]: bs,
      [PROP + "-block-end"]: be,
      [PROP + "-inline-start"]: is,
      [PROP + "-inline-end"]: ie
    };
  };
}

export function Sequence(PROP_ALIASES, PROPS, FUNCS) {
  if (FUNCS instanceof Function) FUNCS = [FUNCS];
  for (let i = 0; i < PROPS.length; i++)
    FUNCS[i] ??= FUNCS[0];
  const NAME = PROP_ALIASES && new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args.length || args.length > PROPS.length || (NAME && !name.match(NAME)))
      throw new SyntaxError(
        `${name}() accepts upto ${PROPS.length} arguments, not ${args.length}`);
    return Object.fromEntries(args.map((a, i) =>
      [PROPS[i], a == null ? a : FUNCS[i](a)]));
  };
}

export function CssTextFunction(PROP_ALIASES, FUNCS) {
  const NAME = PROP_ALIASES && PROP_ALIASES.split("|")[0];
  PROP_ALIASES &&= new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args.length || args.length > FUNCS.length || (NAME && !name.match(NAME)))
      throw new SyntaxError(
        `${name}() accepts upto ${PROPS.length} arguments, not ${args.length}`);
    args = args.map((a, i) => FUNCS[i](a));
    return `${NAME}(${args.join()})`;
  };
}

export function MergeSequence(PROP_ALIASES, ...FUNCS) {
  const NAME = PROP_ALIASES && PROP_ALIASES.split("|")[0];
  PROP_ALIASES &&= new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args.length || args.length > FUNCS.length || (NAME && !name.match(NAME)))
      throw new SyntaxError(
        `${name}() accepts upto ${FUNCS.length} arguments, not ${args.length}`);
    return Object.assign({}, ...args.map((a, i) => FUNCS[i](a)));
  };
}

function Either(...FUNCS) {
  return function (exp) {
    const res = hitMe(FUNCS, exp);
    if (res == undefined)
      throw new SyntaxError(`No match in Either: ${exp}`);
    return res;
  };
}

export function Dictionary(...FUNCS) {
  return function ({ name, args }) {
    const res = {};
    for (let arg of args) {
      const res2 = hitMe(FUNCS, arg);
      if (res2 == undefined)
        throw new SyntaxError(`Invalid argument: ${name}(...${arg.toString()}...)`);
      for (let k in res)
        for (let k2 in res2)
          if (k === k2 || k.startsWith(k2 + "-") || k2.startsWith(k + "-"))
            throw new SyntaxError(`Property crash: ${k} vs ${k2}`);
      Object.assign(res, res2);
    }
    return res;
  };
}

//todo not yet in use
// export function OneOf(...FUNCS) {
//   return function (exp) {
//     for (let func of FUNCS) {
//       try {
//         return func(exp);
//       } catch (e) {
//         console.debug(e);
//       }
//     }
//     throw new SyntaxError(`Invalid argument: ${exp}`);
//   };
// }
//todo there are different ways to do the logic here..
//todo length == 2, I think that we could have top/bottom too
//todo length == 3, then the third becomes all the inline ones
//todo length === 4, then forth is the inline on the end side
function LogicalEight(PROP_ALIASES, FUNC, DEFAULT = "0") {
  const PROP = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 8 || !name.match(PROP_ALIASES))
      throw new SyntaxError(
        `${name}/1-8   !=   ${name}/${args.length}.`);

    let [bss, iss, bes, ies, bse, ise, bee, iee] = args.map(FUNC);
    if (args.length === 1) return { [PROP]: bss };
    // if (args.length === 1) iss = bes = ies = bse = ise = bee = iee = bss;
    if (args.length === 2) ise = ies = iee = iss, bse = bes = bee = bss;
    if (args.length === 3) ise = ies = iee = iss, bse = bss, bee = bes;
    if (args.length === 4) ise = iss, iee = ies, bse = bss, bee = bes;
    if (args.length === 5) ise = iss, iee = ies, bee = bes;
    if (args.length === 6) iee = ies, bee = bes;
    if (args.length === 7) iee = ies;
    const res = {};
    if (bss || iss) res[PROP + "-top-left"] = `${bss ?? DEFAULT} ${iss ?? DEFAULT}`;
    if (bse || ies) res[PROP + "-top-right"] = `${bse ?? DEFAULT} ${ies ?? DEFAULT}`;
    if (bes || ise) res[PROP + "-bottom-left"] = `${bes ?? DEFAULT} ${ise ?? DEFAULT}`;
    if (bee || iee) res[PROP + "-bottom-right"] = `${bee ?? DEFAULT} ${iee ?? DEFAULT}`;
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
    if (!exp) return;
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

export const size = MergeSequence(undefined,
  MinNormalMax("block-size", PositiveLengthPercent),
  MinNormalMax("inline-size", PositiveLengthPercent)
);

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
export const border = BorderSwitch(Dictionary(  //border-colors controlled by $color
  LogicalFour("width|w", PositiveLengthPercent),
  LogicalFour("style|s", Word("solid|dotted|dashed|double")),
  LogicalEight("radius|r", PositiveLengthPercent),
  // LogicalFour("old-radius|or", PositiveLengthPercent),
  P("style", Word("solid|dotted|dashed|double")),
  //todo this should be added to the 
  P("width", Either(
    Word("thin|medium|thick"),
    CheckNum(LENGTHS_PER, 0)
  ))
));

const WEB_COLORS = Word(/azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/);
const HEX = Word("#[0-9a-f]{6}|#[0-9a-f]{3}");

const Zero360Deg = CheckNum("deg|rad|");
const Zero255 = CheckNum("", 0, 255);
const Percent = CheckNum("%|", 0, 100);
const RGB = CssTextFunction("rgb", [Zero255, Zero255, Zero255]);
const RGBA = CssTextFunction("rgba|rgb", [Zero255, Zero255, Zero255, Percent]);
const HSL = CssTextFunction("hsl", [Zero360Deg, Percent, Percent]);
const HSLA = CssTextFunction("hsla|hsl", [Zero360Deg, Percent, Percent, Percent]);

const Color = Either(
  HEX,
  WEB_COLORS,
  RGB,
  RGBA,
  HSL,
  HSLA
);

function ToCssVar(PROP_ALIASES, FUNC) {
  const PROP = PROP_ALIASES.split("|")[0];
  return function (exp) {
    if (!exp) return;
    if (typeof exp == "string")
      return { [`--${PROP}`]: FUNC(exp) };
    const { name, args } = exp;
    if (!args.length || !name.match(PROP_ALIASES))
      throw new SyntaxError(`${name}/${args.length}   !=   ${PROP}/1+.`);
    args = args.map(FUNC);
    const res = { [`--${PROP}`]: args[0] };
    for (let i = 1; i < args.length; i++)
      if (args[i] != null)
        res[`--${PROP}-${i}`] = args[i];
    return res;
  };
}

export const color = MergeSequence(undefined,
  P("color", Color),
  ToCssVar("background-color|bg", Color),
  BorderSwitch(LogicalFour("color|border|b", Color)),
);

export const cursor = P("cursor", Word(/default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out/));//auto is excluded
