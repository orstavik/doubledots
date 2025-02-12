function hitMe(FUNCS, x) {
  for (let func of FUNCS)
    try { return func(x); } catch (e) { }
}

export function Word(rx, func) {
  const RX = new RegExp(`^(?:${rx.source})$`);
  return function DoRegEx(x) {
    const m = x.match(RX);
    if (!m)
      throw new SyntaxError(`Invalid argument: ${x} => ${rx.source}.`);
    return func ? func(...m) : x;
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




export function P(prop, FUNC) {
  return x => ({ [prop]: FUNC(x) });
}

function SignatureChecker(ALIASES, MAX) {
  if (!ALIASES)
    return { checkSignature: x => x };
  const NAME = ALIASES.split("|")[0];
  const RX = new RegExp(`^(${ALIASES})$`);
  function checkSignature(exp) {
    if (!exp || typeof exp == "string")
      throw `Invalid argument: ${exp}, must be an expression.`;
    const { name, args } = exp;
    if (!args.length || args.length > MAX || !name.match(RX))
      throw `Signature mismatch: ${name}/${args.length} vs (${ALIASES})/1-${MAX}.`;
    return exp;
  }
  return { NAME, checkSignature };
}

export function LogicalFour(ALIASES, FUNC) {
  const { NAME, checkSignature } = SignatureChecker(ALIASES, 4);
  return function (exp) {
    const { args } = checkSignature(exp);
    let [bs, is, be, ie] = args.map(a => a == null ? a : FUNC(a));
    if (args.length === 1)
      return { [NAME]: bs };
    if (args.length === 2)
      return {
        [NAME + "-top"]: bs,
        [NAME + "-right"]: is,
        [NAME + "-bottom"]: bs,
        [NAME + "-left"]: is,
        [NAME + "-block"]: bs,
        [NAME + "-inline"]: is,
      };
    if (args.length === 3)
      return {
        [NAME + "-top"]: bs,
        [NAME + "-right"]: is,
        [NAME + "-bottom"]: be,
        [NAME + "-left"]: is,
        [NAME + "-block-start"]: bs,
        [NAME + "-block-end"]: be,
        [NAME + "-inline"]: is,
      };
    return {
      [NAME + "-top"]: bs,
      [NAME + "-right"]: ie,
      [NAME + "-bottom"]: be,
      [NAME + "-left"]: is,
      [NAME + "-block-start"]: bs,
      [NAME + "-block-end"]: be,
      [NAME + "-inline-start"]: is,
      [NAME + "-inline-end"]: ie
    };
  };
}

export function Sequence(ALIASES, PROPS, FUNCS) {
  if (FUNCS instanceof Function) FUNCS = [FUNCS];
  for (let i = 0; i < PROPS.length; i++)
    FUNCS[i] ??= FUNCS[0];
  const { checkSignature } = SignatureChecker(ALIASES, PROPS.length);
  return function (exp) {
    let { args } = checkSignature(exp);
    args = args.map((a, i) => [PROPS[i], a == null ? a : FUNCS[i](a)]);
    return Object.fromEntries(args);
  };
}

export function CssTextFunction(ALIASES, FUNCS) {
  const { NAME, checkSignature } = SignatureChecker(ALIASES, FUNCS.length);
  return function (exp) {
    let { args } = checkSignature(exp);
    args = args.map((a, i) => FUNCS[i](a));
    return `${NAME}(${args.join()})`;
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

export function Merge(cb) {
  return function (exp) {
    const res = {};
    for (let res2 of cb(exp)) {
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
function LogicalEight(ALIASES, FUNC, DEFAULT = "0") {
  const { NAME, checkSignature } = SignatureChecker(ALIASES, 8);
  return function (exp) {
    const { args } = checkSignature(exp);

    let [bss, iss, bes, ies, bse, ise, bee, iee] = args.map(FUNC);
    if (args.length === 1) return { [NAME]: bss };
    // if (args.length === 1) iss = bes = ies = bse = ise = bee = iee = bss;
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
  LogicalFour("width|w", PositiveLengthPercent),
  LogicalFour("style|s", Word(/solid|dotted|dashed|double/)),
  LogicalEight("radius|r", PositiveLengthPercent),
  // LogicalFour("old-radius|or", PositiveLengthPercent),
  P("style", Word(/solid|dotted|dashed|double/)),
  //todo this should be added to the 
  P("width", Either(
    Word(/thin|medium|thick/),
    CheckNum(LENGTHS_PER, 0)
  ))
)));

const WEB_COLORS = Word(/azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen/);
const HEX = Word(/#[0-9a-f]{6}|#[0-9a-f]{3}/);

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

function ToCssVar(ALIASES, FUNC) {
  const PROP = ALIASES.split("|")[0];
  return function (exp) {
    if (typeof exp == "string")
      return { [`--${PROP}`]: FUNC(exp) };
    const { name, args } = exp;
    if (!args.length || !name.match(ALIASES))
      throw new SyntaxError(`${name}/${args.length}   !=   ${PROP}/1+.`);
    args = args.map(FUNC);
    const res = { [`--${PROP}`]: args[0] };
    for (let i = 1; i < args.length; i++)
      if (args[i] != null)
        res[`--${PROP}-${i}`] = args[i];
    return res;
  };
}

//todo this is a diverse list, args 3 < funcs 5
//todo we also have the list of the same type
export function ListOf(ALIASES, ...FUNCS) {
  const { NAME, checkSignature } = SignatureChecker(ALIASES, FUNCS.length);
  return function (exp) {
    const { args } = checkSignature(exp);
    return args.map((a, i) => a == null ? a : FUNCS[i](a));
  };
}

export const size = Merge(ListOf(undefined,
  MinNormalMax("block-size", PositiveLengthPercent),
  MinNormalMax("inline-size", PositiveLengthPercent)
));

export const color = Merge(ListOf(null,
  P("color", Color),
  ToCssVar("background-color|bg", Color),
  BorderSwitch(LogicalFour("color|border|b", Color)),
));

export const cursor = P("cursor", Word(/default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out/));//auto is excluded
