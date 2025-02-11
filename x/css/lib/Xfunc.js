export const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;

const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

function DoRegEx(RX, func, x) {
  const m = x.match(RX);
  if (!m)
    throw new SyntaxError(`Invalid argument: ${x} => ${RX.source}.`);
  return func ? func(...m) : x;
}

export function Word(prefix, func) {
  return DoRegEx.bind(null, new RegExp(`^(${prefix})$`), func);
}

export function Unit(units, func) {
  return DoRegEx.bind(null, new RegExp(`^(${NUM})(${units})$`), func);
}

export function PWord(prop, words, func) {
  const inner = Word(words, func);
  return x => ({ [prop]: inner(x) });
}

export const PositiveLengthPercent =
  Unit(LENGTHS_PER, (str, v) => (Number(v) >= 0 ? str : null));

export function LogicalFour(PROP_ALIASES, ArgHandler) {
  const PROP = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 4 || !name.match(PROP_ALIASES))
      return;
    let [bs, is, be, ie] = args.map(a => a == null ? a : ArgHandler(a));
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

export function MergeSequence(PROP_ALIASES, ...FUNCS) {
  const NAME = PROP_ALIASES && new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args.length || args.length > FUNCS.length || (NAME && !name.match(NAME)))
      throw new SyntaxError(
        `${name}() accepts upto ${FUNCS.length} arguments, not ${args.length}`);
    return Object.assign({}, ...args.map((a, i) => FUNCS[i](a)));
  };
}

export function Dictionary(...FUNCS) {
  return function ({ name, args }) {
    const res = {};
    main: for (let arg of args) {
      for (let func of FUNCS) {
        try {
          Object.assign(res, func(arg));
          continue main;
        } catch (e) {
          console.debug(e);
        }
      }
      throw new SyntaxError(`Invalid argument: ${name}(...${arg.toString()}...)`);
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

function LogicalEight(PROP_ALIASES, PositiveLengthPercent) {
  const [PROP] = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 8 || !name.match(PROP_ALIASES))
      return;

    let [bss, iss, bes, ies, bse, ise, bee, iee] = args.map(PositiveLengthPercent);
    if (args.length === 1) iss = bes = ies = bse = ise = bee = iee = bss;
    if (args.length === 2) ise = ies = iee = iss, bse = bes = bee = bss;
    if (args.length === 3) ise = ies = iee = iss, bse = bss, bee = bes;
    if (args.length === 4) ise = iss, iee = ies, bse = bss, bee = bes;
    if (args.length === 5) ise = iss, iee = ies, bee = bes;
    if (args.length === 6) iee = ies, bee = bes;
    if (args.length === 7) iee = ies;
    return {
      [PROP + "-top-start"]: bss,
      [PROP + "-top-end"]: bse,
      [PROP + "-bottom-start"]: bes,
      [PROP + "-bottom-end"]: bee,
      [PROP + "-start-start"]: iss,
      [PROP + "-end-start"]: ies,
      [PROP + "-start-end"]: ise,
      [PROP + "-end-end"]: iee,
    };
  };
}

//min(x) => clamp(x,,)
//max(x) => clamp(,,x)
//fit|fit-content(x) => clamp(min-content, x, max-content)
//clamp => clamp(,,x)
function MinNormalMax(PROP, cb) {
  const MIN = "min-" + PROP, MAX = "max-" + PROP;
  return function mnm(exp) {
    if(!exp) return;
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
    const res = func(exp);  //style  and width are 5 char long
    return Object.fromEntries(Object.entries(res).map(([k, v]) => {
      const [wsr, ...dirs] = k.split("-");
      k = ["border", ...dirs, wsr].join("-");
      return [k, v];
    }));
  };
}

export const border = Dictionary(  //border-colors controlled by $color
  BorderSwitch(LogicalFour("width|w", PositiveLengthPercent)),
  BorderSwitch(LogicalFour("style|s", Word("solid|dotted|dashed|double"))),
  BorderSwitch(LogicalFour("old-radius|or", PositiveLengthPercent)),
  BorderSwitch(LogicalEight("radius|r|logical-radius", PositiveLengthPercent)),
  PWord("border-style", "solid|dotted|dashed|double"),
  PWord("border-width", "thin|medium|thick"),
  Unit(LENGTHS_PER, (str, v) => (Number(v) >= 0 ? { "border-width": str } : null))
);

export const size = MergeSequence(undefined, 
  MinNormalMax("block-size", PositiveLengthPercent), 
  MinNormalMax("inline-size", PositiveLengthPercent)
);
