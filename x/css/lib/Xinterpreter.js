import { parse$Expression } from "./Xparser.js";

const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;

const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

const FLEX_FUNCS = /gap|padding|align|wrap|scroll-padding/;
const FLEX_ITEM_FUNCS = /margin|align|grow|shrink|order|basis/;

const ALIGN_WORDS = /start|center|end|space-around|space-between|space-evenly/;

function Undefined(func) {
  return function (exp) {
    if (exp == undefined) return exp;
    const res = func(exp);
    if (!res) throw new SyntaxError(`Invalid argument: ${exp}`);
    return res;
  };
}

function Word(words, func) {
  const RX = new RegExp(`^(${words})$`);
  const Func = func ?
    x => ((x = x.match?.(RX)) && func(x)) :
    x => (x.match?.(RX) && x);
  return Undefined(Func);
}

function PWord(prop, words, func) {
  const RX = new RegExp(`^(${words})$`);
  const Func = func ?
    x => ((x = x.match?.(RX)) && { [prop]: func(x) }) :
    x => (x.match?.(RX) && { [prop]: x });
  return Undefined(Func);
}

function NumberUnit(units, valueCheck) {
  units = new RegExp(`^(${NUM})(${units})$`);
  const Func = valueCheck ?
    x => (x = x.match?.(units)) && valueCheck(x[1]) && x[0] :
    x => x.match?.match(units) && x;
  return Undefined(Func);
}

const PositiveLengthPercent = NumberUnit(LENGTHS_PER, v => Number(v) >= 0);


function LogicalFour(PROP_ALIASES, ArgHandler) {
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

function Props(PROP_ALIASES, propList, func) {
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

function Dictionary(...funcs) {
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

function Sequence(...funcs) {
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

const Padding = LogicalFour("padding", PositiveLengthPercent);
const Margin = LogicalFour("margin", PositiveLengthPercent);
const ScrollPadding = LogicalFour("scroll-padding", PositiveLengthPercent);
const ScrollMargin = LogicalFour("scroll-margin", PositiveLengthPercent);
const Gap = Props("gap", ["gap-column", "gap-row"], PositiveLengthPercent);

const flex = Dictionary(
  PWord("flex-direction", "column|column-reverse|row-reverse"),
  Padding,
  Gap,
  ScrollPadding,
);

const _flex = Dictionary(
  Margin,
  ScrollMargin,
);


function BorderSwitch(func) {
  return function (exp) {
    const res = func(exp);  //style  and width are 5 char long
    return Object.fromEntries(Object.entries(res).map(([k, v]) => {
      const [wsr, ...dirs] = k.split("-");
      k = ["border", ...dirs, wsr].join("-");
      return [k, v];
    }));
  };
}
const border = Sequence(  //border-colors controlled by $color
  BorderSwitch(LogicalFour("width", PositiveLengthPercent)),
  BorderSwitch(LogicalFour("style|s", Word("solid|dotted|dashed|double"))),
  BorderSwitch(LogicalFour("radius|r", PositiveLengthPercent))
  //todo radius-block-inline
);

const shortFuncs = { flex, _flex, border, };

function interpret(exp) {
  const obj = shortFuncs[exp.name](exp);
  return Object.fromEntries(Object.entries(obj)
    .filter(kv => kv[1] != null)
    .map(([k, v]) => [k.replace(/[A-Z]/g, "-$&").toLowerCase(), v])
  );
}

export function interpretClass(txt) {
  const { container: { selector, shorts }, items } = parse$Expression(txt);
  const res = {
    [selector]: Object.assign({}, ...shorts.map(x => interpret(x)))
  };
  for (let { selector, shorts } of items)
    res[selector] = Object.assign({}, ...shorts.map(x => interpret(x)));
  return res;
  // const superShorts = container.shorts.map(s => superShorts[s.name]).filter(Boolean);
  //merge the superShorts objects with the .results objects from container and items
  // return { container, items };
}