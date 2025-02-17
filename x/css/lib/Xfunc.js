import { Expression } from "./Xengine.js";

const Debugger = FUNC => x => { debugger; const res = FUNC(x); debugger; return res; };

export function Word(rx, func) {
  const RX = new RegExp(`^(?:${rx.source})$`);
  return function word(x) {
    const m = x.match?.(RX);
    if (m)
      return func ? func(...m) : x;
    throw `Invalid argument: ${x} => ${rx.source}.`;
  };
}

export const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;
export const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
export const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

const Clamp = (INT, MIN, MAX) => (str, n, frac) => {
  n = Number(n) / (frac ? Number(frac) : 1);
  if ((!INT || Number.isInteger(n)) && (MIN == null || n >= MIN) && (MAX == null || n <= MAX))
    return str;
};

export const CheckNum = (UNITS, MIN, MAX, IsINT) =>
  Word(new RegExp(UNITS ? `${NUM}(${UNITS})` : NUM), Clamp(IsINT, MIN, MAX));

function signature(x, ALIASES, MAX) {
  if (x instanceof Expression) {
    if (ALIASES == null || ALIASES.split("|").includes(x.name))
      if (MAX == null || x.args.length <= MAX)
        return x.args;
  } else if (ALIASES.includes(""))
    return [x];
  throw `Signature mismatch: (${ALIASES})/1-${MAX} doesn't accept ${x}.`;
}

function shorthandSignature(x, ALIASES, SEP) {
  if (typeof x === "string")
    return x.split(SEP);
  if (x instanceof Expression)
    if (ALIASES == null || ALIASES.split("|").includes(x.name))
      return x.args;
  throw `Shorthand mismatch: (${ALIASES}) or ${SEP} doesn't accept ${x}.`;
}

function oneOf(FUNCS, x) {
  for (let func of FUNCS)
    try { return func(x); } catch (e) { }
  throw new SyntaxError(`No match for: ${x}`);
}

export const ListOfSame = (Aliases, FUNC) =>
  x => signature(x, Aliases).map(a => a == null ? a : FUNC(a));
export const ListOf = (Aliases, ...FUNCS) =>
  x => signature(x, Aliases, FUNCS.length).map((a, i) => a == null ? a : FUNCS[i](a));
export const ShorthandFunction = (SEP, NAME, FUNC) =>
  x => shorthandSignature(x, NAME, SEP).map(a => a == null ? a : FUNC(a));
export const Either = (...FUNCS) =>
  x => oneOf(FUNCS, x);
export const Dictionary = (...FUNCS) =>
  x => x.args.map(a => oneOf(FUNCS, a));


function spaceJoin(x) {
  return x instanceof Array ? x.join(" ") : x;
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
//todo there are different ways to do the logic here..
//todo length == 2, I think that we could have top/bottom too
//todo length == 3, then the third becomes all the inline ones
//todo length === 4, then forth is the inline on the end side
function toLogicalEight(NAME, DEFAULT, args) {
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
}

function toMinMax(NAME, res) {
  if (res.length == 1)
    return { [NAME]: res[0] };
  if (res.length == 3)
    return {
      [`min-${NAME}`]: res[0],
      [NAME]: res[1],
      [`max-${NAME}`]: res[2]
    };
}

function safeMerge(ar) {
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
}

function borderSwitch(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => {
    const [wsr, ...dirs] = k.split("-");
    return [["border", ...dirs, wsr].join("-"), v];
  }));
}

function toCssFunctionIf2(NAME, ar) {
  return ar.length == 1 ? ar[0] :
    `${NAME}(${ar.join(",")})`;
}

function assignIfNone(Defaults, res) {
  const res2 = {};
  main: for (let k in Defaults) {
    if (k in res)
      continue;
    for (let k2 in res)
      if (k2.match(new RegExp(`^(${k.replaceAll(/-/g, ".+")})$`)))
        continue main;
    res2[k] = Defaults[k];
  }
  return { ...res2, ...res };
}

function pP(NAMES, ar) {
  return ar.reduce((res, x, i) => ((res[NAMES[i]] = spaceJoin(x)), res), {});
}

export const P = (NAME, FUNC) => x => ({ [NAME]: spaceJoin(FUNC(x)) });
export const PP = (NAMES, FUNC) => x => pP(NAMES, FUNC(x));
export const LogicalFour = (NAME, FUNC) => x => toLogicalFour(NAME, FUNC(x));
export const CssFunction = (NAME, SEP, FUNC) => x => `${NAME}(${FUNC(x).join(SEP)})`;
export const CssFunctionIf2 = (NAME, FUNC) => x => toCssFunctionIf2(NAME, FUNC(x));
export const LogicalEight = (NAME, FUNC) => x => toLogicalEight(NAME, 0, FUNC(x));
export const ToMinMax = (DIR, FUNC) => x => toMinMax(DIR, FUNC(x));
export const Merge = FUNC => x => safeMerge(FUNC(x));
export const Assign = (OBJ, FUNC) => x => assignIfNone(OBJ, FUNC(x));
export const BorderSwitch = FUNC => x => borderSwitch(FUNC(x));

export const PositiveLengthPercent = CheckNum(LENGTHS_PER, 0);

export const PositiveSize = Either(
  Word(/(min|max)(-content)?/, (_, m, c = "-content") => m + c),
  PositiveLengthPercent
);


//enables us to write a min and max eiter as 2px:5px or max(2px,5px)
const Size = DIR => ToMinMax(DIR, Either(
  ListOf(null, PositiveSize),
  ListOf(null,
    CssFunctionIf2("max", ShorthandFunction(":", "max", PositiveSize)),
    PositiveSize,
    CssFunctionIf2("max", ShorthandFunction(":", "min", PositiveSize))
  )
));

export const w = Size("inline-size");
export const h = Size("block-size");



//todo Dictionary should check that none of the properties coming out are already set.
//border-colors controlled by $color
export const border = Assign({ "border-style": "solid" }, BorderSwitch(Merge(Dictionary(
  LogicalFour("style", ListOfSame("style|s|", Word(/solid|dotted|dashed|double/))),
  LogicalFour("width", Either(
    ListOfSame("width|w|", PositiveLengthPercent),
    Word(/thin|medium|thick/)
  )),
  LogicalEight("radius", ListOfSame("radius|r", PositiveLengthPercent)),
  LogicalFour("radius", ListOfSame("r2|radius-og", PositiveLengthPercent))//NativeEight?
))));

export const cursor = P("cursor", Word(/default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out/));//auto is excluded
