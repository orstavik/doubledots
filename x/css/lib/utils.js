const LENGTH_UNITS = "px|em|rem|vw|vh|vmin|vmax|mm|cm|in|pt|pc|ch|ex|fr".split("|");

const POS = (a, key) => a < 0 ? undefined : a + key;
const ANY = (a, key) => a + key;
const UNITLESS = a => a;
const UNITLESS_POS = a => a >= 0 ? a : undefined;

export const LENGTH_ANY = Object.fromEntries(LENGTH_UNITS.map(unit => [unit, ANY]));
export const LENGTH_POS = Object.fromEntries(LENGTH_UNITS.map(unit => [unit, POS]));
export const PERCENT = { "%": ANY };
export const PERCENT_POS = { "%": POS };
export const LENGTH_PERCENT = { ...LENGTH_ANY, ...PERCENT };
export const LENGTH_PERCENT_POS = { ...LENGTH_POS, ...PERCENT_POS };
export const INT = { int: UNITLESS };
export const INT_POS = { int: UNITLESS_POS };
export const NUMBER = { float: UNITLESS, int: UNITLESS };
export const NUMBER_POS = { float: UNITLESS_POS, int: UNITLESS_POS };

export const isOnlyOne = join("", 1); //todo replace with SINGULAR
export const SINGULAR = a => a.length === 1 && !(a[0] instanceof Array) && a[0] || undefined;
export const spaceJoin2 = join(" ", 1, 2);
export const spaceJoin4 = join(" ", 1, 4);

export function join(sep = " ", min = 1, max = min) {
  const count = clamp(min, max);
  return a => count(a)?.join(sep);
}
export function clamp(min, max) {
  return a => a.length >= min && a.length <= max ? a : undefined;
}
export function fillArrayWithDefault(fallback, max) {
  return a => a.length <= 2 ? a.map(a => a ?? fallback) : undefined;
}

const twoIsThree = (a, b, c) => b == c || undefined;

function wordMatch(regex) {
  regex = new RegExp(`^(${regex.source})$`);
  return str => typeof str == "string" && str.match(regex) ? str : undefined;
}

function processTop(args, func) {
  args = args.slice();
  for (let i = 0; i < args.length; i++)
    if ((args[i] = func(args[i])) == null)
      return;
  return args;
}

export class PrefixTable {
  #rules;
  constructor(dict) {
    this.#rules = Object.entries(dict).map(([type, [prefix, func, func2]], i) => [
      type,
      prefix instanceof RegExp ? wordMatch(prefix) : prefix ?? twoIsThree,
      func instanceof RegExp ? wordMatch(func) : func,
      func2,
      i
    ]);
  }

  argsToDict(topArgs) {
    const res = {};
    top: for (let [i, { prefix, args }] of topArgs.entries()) {
      type: for (let [type, matcher, func, func2, j] of this.#rules)
        if (matcher(prefix, i, j) != undefined) {
          const a = processTop(args, func);
          if (a == null)
            continue type;
          res[type] = func2?.(a) ?? a;
          continue top;
        }
    }
    return res;
  }
}

export class PrefixTable2 {
  #rules;
  constructor(dict) {
    this.#rules = Object.entries(dict).map(([type, [prefix, whiteList, rootProcess]], i) => [
      type,
      prefix instanceof RegExp ? wordMatch(prefix) : prefix ?? twoIsThree,
      PrefixTable2.prepWhiteList(whiteList),
      rootProcess,
      i
    ]);
  }

  static prepWhiteList(whiteList) {
    if (whiteList instanceof RegExp)
      whiteList = { word: whiteList };
    for (let key in whiteList)
      if (whiteList[key] instanceof RegExp)
        whiteList[key] = wordMatch(whiteList[key]);
    return whiteList;
  }

  static processArg(whiteList, arg) {
    if (!arg)
      return arg;
    if (arg.args) {
      const res = arg.args.map(a => PrefixTable2.processArg(whiteList, a));
      if (res.find(a => a == null))
        return undefined;
      if (arg.prefix)
        return { prefix: arg.prefix, args: res };
      return res;
    }
    if (!whiteList)
      return arg;
    for (let key in arg)
      if (key in whiteList)
        return whiteList[key](arg[key], key);
  }

  argsToDict(topArgs) {
    const res = {};
    top: for (let [i, { prefix, args }] of topArgs.entries()) {
      type: for (let [type, matcher, whiteList, func2, j] of this.#rules)
        if (matcher(prefix, i, j) != undefined) {
          const resA = args.map(arg => PrefixTable2.processArg(whiteList, arg));
          if (resA.findIndex(a => a == null) >= 0)
            continue type;
          res[type] = func2?.(resA) ?? resA;
          continue top;
        }
    }
    return res;
  }

  static singles(topArgs, min, max) {
    if (topArgs.length < min)
      throw new SyntaxError(`Too few arguments: ${topArgs.length} < ${min}`);
    if (topArgs.length > max)
      throw new SyntaxError(`Too many arguments: ${topArgs.length} > ${max}`);
    const res = [];
    for (let { prefix, args } of topArgs) {
      if (prefix)
        throw new SyntaxError("prefix not allowed for singles arguments shorts.");
      res.push(args.length > 1 ? args : args[0]);
    }
    return res;
  }
}

export function calcNum(defaultValue, defaultType, arg) {
  if (!arg)
    return arg;
  let { N, n, num, unit, expr } = arg;
  if (!N && !expr)
    throw new SyntaxError("not a number value");
  if (unit === "auto")
    throw new Error("implement this");
  if (expr?.endsWith(/[-+/*]/))
    return `calc(${expr} ${defaultValue + defaultType})`;
  if (expr?.startsWith(/[-+/*]/))
    return `calc(${defaultValue + defaultType} ${expr})`;
  if (unit)
    return n + unit;
  return defaultValue * n + defaultType;
}

export function normalizeArray4(ar) {
  if (ar.length > 4 || !ar.length)
    throw new SyntaxError("Array must have 1-4 items: " + ar);
  return ar.length == 3 ? (ar.push(ar[1]), ar) :
    ar.length == 2 ? (ar.push(...ar), ar) :
      ar.length == 1 ? [ar[0], ar[0], ar[0], ar[0]] :
        ar; /*ar.length == 4*/
}

export function trbl(dict, prop) {
  const args = dict[prop];
  if (!args)
    return;
  const [head, tail] = prop.split(/-(?=[^-]*$)/);
  dict[`${head}-top-${tail}`] = args[0];
  dict[`${head}-right-${tail}`] = args[1];
  dict[`${head}-bottom-${tail}`] = args[2];
  dict[`${head}-left-${tail}`] = args[3];
  delete dict[prop];
}

export function tailToVariables(dict, prop) {
  const args = dict[prop];
  if (!args?.length)
    return dict;
  while (args.length > 1)
    dict[prop + "-" + args.length] = args.pop();
  dict[prop] = args[0];
  return dict;
}

export function tryVariableFirst(val, prop) {
  return `var(--${prop},${val})`;
}

// const JUSTIFY_CONTENT = /start|end|flex-start|flex-end|center|space-between|space-around|space-evenly/;
// const ALIGN_ITEMS = /stretch|start|end|flex-start|flex-end|center|baseline/;
// const ALIGN_CONTENT = /stretch|start|end|flex-start|flex-end|center|space-between|space-around/;

export class LAYOUT {
  static DIRECTIONS = /row|column/;
  static WRAP_BLOCK = /nowrap|hidden|auto|scroll/;
  static WRAP = /wrap|reverse|ellipsis|nowrap|hidden|auto|scroll/;
  static FLEX_ALIGN_SELF = /stretch|start|end|flex-start|flex-end|center|baseline|first-baseline|last-baseline/;
  static SNAP_ALIGN = /snap-start|snap-center|snap-end/;
  static SNAP_TYPE = /block-mandatory|block-proximity|inline-mandatory|inline-proximity|mandatory|proximity/;

  static SCROLL_CONTAINER = {
    "scroll-padding": [/scroll-padding/, LENGTH_PERCENT_POS, spaceJoin4],
    "scroll-snap-type": [/snap/, this.SNAP_TYPE,
      a => SINGULAR(a) && a.includes("-") ? a.replace(/-/, " ") : "both " + a
    ],
  };
  static SCROLL_ITEM = {
    "scroll-margin": [/scroll-margin/, LENGTH_PERCENT, spaceJoin4],
    "scroll-snap-align": [/^$/, this.SNAP_ALIGN,
      a => SINGULAR(a) && a[0].replace("snap-", "")
    ],
    "scroll-snap-stop": [/^$/, /snap-stop-always/,
      a => SINGULAR(a) && "always"
    ],
  };
  static GAP = { "gap": [/g|gap/, LENGTH_POS, spaceJoin2] };
  static PADDING = { "padding": [/p|padding/, LENGTH_PERCENT_POS, spaceJoin4] };
  static MARGIN = { "margin": [/m|margin/, LENGTH_PERCENT, spaceJoin4] };
  static ALIGN = [/^$/, /start|center|end|around|between|evenly/,
    a => spaceJoin2(a)?.replace(/around|between|evenly/, s => "space-" + s)];
  static ALIGN_1 = [/^$/, /start|center|end|around|between|evenly/,
    a => SINGULAR(a)?.replace(/around|between|evenly/, s => "space-" + s)];
};