//NO-SPACE-PERCENT-selector
// 1. ">>" is the descendant space selector.
// 2. "%" is a placeholder for implied selector. 
//    If a comma separated expression doesn't contain a "%", 
//    it is implied at the start. like in regular css.

const styleSheet = new CSSStyleSheet();

function testSelector(selector, txt) {
  try {
    selector = selector.replaceAll("%", ".HELLO-SUNSHINE");
    styleSheet.insertRule(selector + " { border-width: 2px; }");
    styleSheet.deleteRule(0);
  } catch (err) {
    throw new SyntaxError("Illegal no-space-percent selector: " + txt);
  }
}

function parse$NoSpaceSelector(txt, placeholder) {
  const percentSelector = txt
    .replaceAll(">>", " ")
    .split(",")
    .map(txt => txt.includes("%") ? txt : placeholder + txt)
    .join(",");
  testSelector(percentSelector, txt);
  return percentSelector;
}

function parse$ContainerSelector(txt) {
  return parse$NoSpaceSelector(txt, "%");
}

function parse$ItemSelector(txt) {
  if (txt.includes("%"))
    throw new SyntaxError("$short item selector cannot contain %: " + txt);
  return parse$NoSpaceSelector(txt, "% > ");
}

/*************/
/** $shorts **/
/*************/
const ZERO = /(-|)0([0-9]+)/.source; //neg, zeroInt
const FLOAT = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const UNIT = /[a-z]+|%/.source;
//prefix shorts
const NUMBER = `(${ZERO}|${FLOAT})(${UNIT}|)`; //num, neg, zeroInt, unit
const HEX = /#[0-9a-f]{3,6}/.source;
const START = /([a-z]*)\[/.source;
//non-prefix shorts
const WORD = /[-]*[a-z]+[a-z0-9-]*/.source; //word allows for --var syntax. but not prefix.
const QUOTE = /(?:[`'"])(?:\\.|(?!\1).)*?\1/.source; //sign, textBody
const CALC_EXPR = /[^,\]\[]]+/.source;
const BRACKETS_COMMA = /(\,)|(\])/.source;
const TOKENS =
  new RegExp(`${BRACKETS_COMMA}|${START}|(${HEX})|(${NUMBER})|(${WORD})|(${QUOTE})|(${CALC_EXPR})`, "g");

function processToken([, c, end, prefix, hex, N, num, neg, zInt, unit, word, quote, expr]) {
  return c ? "" : end ? end : word ? word :
    prefix != null ? { prefix, args: [] } :
      num ? { N, num, n: Number(zInt ? neg + "." + zInt : num), unit } :
        { hex, quote, expr };
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
  const tokens = [];
  for (let m; m = TOKENS.exec(arg);)
    tokens.push(processToken(m));
  const iter = tokens[Symbol.iterator]();
  const first = iter.next().value;
  return first.args ?
    nestBrackets(first, iter, true) :
    { prefix: "", args: [first] };
}

function parse$Short(short) {
  const [name, ...args] = short.split("_");
  return {
    name,
    camel: name.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase()),
    args: args.map(parse$arg)
  };
}

function parse$Shorts(seg, item) {
  let [select, ...shorts] = seg.split("$");
  const selector = item ?
    parse$ItemSelector(select) :
    parse$ContainerSelector(select);
  return { selector, shorts: shorts.map(parse$Short) };
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
      throw new SyntaxError(`The $superShort "${key}" shouldnt have container selector: ${res[key]}.`);
  }
  return res;
}

/**
 * toCssText
 */
function ruleToString(cssName, selector, value) {
  let str = selector.replaceAll("%", cssName) + " {";
  for (let [k, v] of Object.entries(value))
    str += `\n  ${k}: ${v};`;
  return str + "\n}";
}

export function toCssText(shortName, dict) {
  const cssName = "." + shortName.replaceAll(/[^a-z0-9_-]/g, "\\$&");
  return Object.entries(dict)
    .map(([select, body]) => ruleToString(cssName, select, body))
    .join("\n\n");
}
