const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;

const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

function Undefined(func) {
  return function (exp) {
    if (exp == undefined) return exp;
    const res = func(exp);
    if (!res) throw new SyntaxError(`Invalid argument: ${exp}`);
    return res;
  };
}

export function Word(words, func) {
  const RX = new RegExp(`^(${words})$`);
  const Func = func ?
    x => ((x = x.match?.(RX)) && func(...x)) :
    x => (x.match?.(RX) && x);
  return Undefined(Func);
}

export function PWord(prop, words, func) {
  const RX = new RegExp(`^(${words})$`);
  const Func = func ?
    x => ((x = x.match?.(RX)) && { [prop]: func(...x) }) :
    x => (x.match?.(RX) && { [prop]: x });
  return Undefined(Func);
}

export function NumberUnit(units, valueCheck) {
  units = new RegExp(`^(${NUM})(${units})$`);
  const Func = valueCheck ?
    x => (x = x.match?.(units)) && valueCheck(x[1]) && x[0] :
    x => x.match?.match(units) && x;
  return Undefined(Func);
}

export function Unit(units, func) {
  const RX = new RegExp(`^(${NUM})(${units})$`);
  const Func = x => (x = x.match?.(RX)) && func(...x);
  return Undefined(Func);
}

export const PositiveLengthPercent = NumberUnit(LENGTHS_PER, v => Number(v) >= 0);

export function Display(value, func) {
  return function display(exp) {
    const res = func(exp);
    res.display = value;
    return res;
  };
}

export function LogicalFour(PROP_ALIASES, ArgHandler) {
  const PROP = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 4 || !name.match(PROP_ALIASES))
      return;
    let [bs, is, be, ie] = args.map(ArgHandler);
    if (args.length === 1) is = be = ie = bs;
    if (args.length === 2) be = bs, ie = is;
    if (args.length === 3) ie = is;
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

function Space(PROP_ALIASES, max, func, auto = "auto") {
  const PROP = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > max || !name.match(PROP_ALIASES))
      return;
    return { [PROP]: args.map(func).map(v => v ?? auto).join(" ") };
  };
}

export function Props(PROP_ALIASES, propList, func) {
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > propList.length || !name.match(PROP_ALIASES))
      return;
    const res = {};
    for (let i = 0; i < args.length; i++) {
      let value = func(args[i]);
      if (value != null)
        res[propList[i]] = value;
    }
    return res;
  };
}

export function Dictionary(...funcs) {
  return function ({ name, args }) {
    const res = {};
    main: for (let arg of args) {
      for (let func of funcs) {
        try {
          const obj = func(arg);
          if (obj) {
            Object.assign(res, obj);
            continue main;
          }
        } catch (e) {
          console.debug(e);
        }
      }
      throw new SyntaxError(`Invalid argument: ${name}(...${arg.toString()}...)`);
    }
    return res;
  };
}

export function Sequence(...funcs) {
  return function ({ name, args }) {
    if (args.length > funcs.length)
      throw new SyntaxError(
        `${name}() accepts upto ${funcs.length} arguments, not ${args.length}`);
    const res = {};
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      const func = funcs[i];
      const obj = a != null ? func(a) : a;
      if (!obj)
        throw new SyntaxError(
          `Invalid argument: ${name}(${",".repeat(i)}${a.toString()})`);
      Object.assign(res, obj);
    }
    return res;
  };
}
