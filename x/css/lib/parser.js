import { parse$ContainerSelector, parse$ItemSelector } from "./parseSelector.js";
export { toCssText } from "./parseSelector.js";

const NUM = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const UNIT = /[a-z]+|%/.source;
//prefix shorts
const NUMBER = `(${NUM})(\\/${NUM})?(${UNIT})?`; //num, int, unit
const HEX = /#[0-9a-f]{3,6}/.source;
const START = /([a-z]*)\[/.source;
//non-prefix shorts
const WORD = /[-]*[a-z]+[a-z0-9-]*/.source; //word allows for --var syntax. but not prefix.
const QUOTE = /(?:[`'"])(?:\\.|(?!\1).)*?\1/.source; //sign, textBody
const CALC_EXPR = /[^,\]\[]]+/.source;
const BRACKETS_COMMA = /(\,)|(\])/.source;
const TOKENS =                                    //|(${FRACTION})
  new RegExp(`${BRACKETS_COMMA}|${START}|(${HEX})|(${NUMBER})|(${WORD})|(${QUOTE})|(${CALC_EXPR})`, "g");

function processToken([, c, end, prefix, hex, N, num, frac, unit, word, quote, expr]) {
  if (N) {
    if(unit === "args" || unit === "prefix")
      throw new SyntaxError("the unit of numbers cannot be 'args' nor 'prefix'.");
    num = Number(num);
    if (frac)
      num /= Number(frac.slice(1));
    unit ||= (!frac && Number.isInteger(num)) ? "int" : "float";
    return { [unit]: num };
  }
  if (prefix != null)
    return { prefix, args: [] };
  return c ? "" : end ? end : word ? { word } : hex ? { hex } : quote ? { quote } : { expr };
}

function nestBrackets(active, tokens) {
  let prev;
  for (let t of tokens) {
    if (t === "]")
      return active;
    if (t.args)
      prev = nestBrackets(t, tokens);
    else if (t || !prev) //add somethings and commas after commas.
      active.args.push(prev = t);
    else
      prev = t;
  }
  throw new SyntaxError("Too many '['.");
}

function parse$arg(arg) {
  if(!arg)
    return {prefix: "", args: []};
  const tokens = [];
  for (let m; m = TOKENS.exec(arg);)
    tokens.push(processToken(m));
  const iter = tokens[Symbol.iterator]();
  const first = iter.next().value;
  return first.args ?
    nestBrackets(first, iter, true) :
    { prefix: "", args: [first] };
}

function parse$Short(short, item) {
  let [name, ...args] = short.split("_");
  const camel = (item ? "_" : "") + name.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());
  args = args.map(parse$arg);
  return { name, camel, args };
}

function parse$Shorts(seg, item) {
  let [select, ...shorts] = seg.split("$");
  const selector = item ?
    parse$ItemSelector(select) :
    parse$ContainerSelector(select);
  return { selector, shorts: shorts.map(s => parse$Short(s, item)) };
}

// :hover$flex_row$color_blue|$flex_1_0_auto
// div.something#alice[bob="dothis"]:focus:first$flex_0|:focus$flex_1_2_auto$color_yellow
// div$flex_1|.bob$flex_none$red500_blue500
export function parse$Expression(txt) {
  return txt.split("|").map(parse$Shorts);
}

export function cssClassName(shortName) {
  return "." + shortName.replaceAll(/[^a-z0-9_-]/g, "\\$&");;
}

/**
 * supershorts
 */
export function parse$SuperShorts(txt) {
  const res = {};
  for (let [, name, value] of txt.matchAll(/\$([a-z0-9-]+)\s*\{([^\}]+)\}/g)) {
    res[name] = parse$Expression(value.replaceAll(/\s/g, ""));
    if (res[name][0].selector.container)
      throw new SyntaxError(`$superShort "${key}" cannot have container selector: ${res[key]}.`);
  }
  return res;
}