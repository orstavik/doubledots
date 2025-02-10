const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;

const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

function DoRegEx(prop, RX, func, x) {
  const m = x.match(RX);
  if (!m) throw new SyntaxError(`Invalid argument: ${x} => ${RX.source}.`);
  const res = func ? func(...m) : x;
  // if(res == null) dunno if this is needed
  return prop ? { [prop]: res } : res;
}

export function Word(words, func) {
  return DoRegEx.bind(null, null, new RegExp(`^(${words})$`), func);
}

export function PWord(prop, words, func) {
  return DoRegEx.bind(null, prop, new RegExp(`^(${words})$`), func);
}

export function Unit(units, func) {
  return DoRegEx.bind(null, null, new RegExp(`^(${NUM})(${units})$`), func);
}

export const PositiveLengthPercent =
  Unit(LENGTHS_PER, (str, v) => (Number(v) >= 0 ? str : null));

export function Display(display, func) {
  return exp => ({ display, ...func(exp) });
}

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
