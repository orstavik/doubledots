const LENGTHS_PER = /px|em|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|ch|ex|%/.source;

const N = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const NUM = `(${N})(?:\\/(${N}))?`; //num frac allows for -.5e+0/-122.5e-12

function DoWord(prop, RX, func, x) {
  const m = x.match(RX);
  if (!m) throw new SyntaxError(`Invalid argument: ${x} => ${RX.source}.`);
  const res = func ? func(...m) : x;
  // if(res == null) dunno if this is needed
  return prop ? { [prop]: res } : res;
}

export function Word(words, func) {
  return DoWord.bind(null, null, new RegExp(`^(${words})$`), func);
}

export function PWord(prop, words, func) {
  return DoWord.bind(null, prop, new RegExp(`^(${words})$`), func);
}

export function NumberUnit(units, valueCheck) {
  const RX = new RegExp(`^(${NUM})(${units})$`);
  return valueCheck ?
    x => (x = x.match(RX)) && valueCheck(x[1]) && x[0] :
    x => x.matchmatch(RX) && x;
}

export function Unit(units, func) {
  const RX = new RegExp(`^(${NUM})(${units})$`);
  return x => (x = x.match(RX)) && func(...x);
}

export const PositiveLengthPercent = NumberUnit(LENGTHS_PER, v => Number(v) >= 0);

export function Display(display, func) {
  return exp => ({ display, ...func(exp) });
}

const NullOk = (x, func) => x == undefined ? x : func(x);



export function LogicalFour(PROP_ALIASES, ArgHandler) {
  const PROP = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 4 || !name.match(PROP_ALIASES))
      return;
    let [bs, is, be, ie] = args.map(a => NullOk(a, ArgHandler));
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
    return Object.fromEntries(args.map((a, i) => [PROPS[i], NullOk(a, FUNCS[i])]));
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
