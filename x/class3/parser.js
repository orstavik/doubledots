//we can put the directions at the beginning or the end of the ctxSelect
//and then we can imagine the :root (<.name>) infront or after the direction.
//and if there is no direction, then it should likely be a <.name>.class:pseudo[attr] selector

/**************/
/** SELECTOR **/
/**************/
const DIR = /~|\+|>>|>/.source;
const ANY = /[^:#[\]="]+/.source;
const TAG = /[a-z]+(?:-[a-z]+)/.source;
const HASHDOTS = /[#:\.]/.source;
const ATTR = /\[[^\]]+\]/.source;
const EL_SELECTOR = new RegExp(`(${TAG})?(${HASHDOTS}${ANY}|${ATTR})`).source;
const SELECTOR = new RegExp(`^(${DIR})?(${EL_SELECTOR})(\,${EL_SELECTOR})*(${DIR})?$`);
const ITEM_SELECT = new RegExp(`^${EL_SELECTOR}$`);

function parse$ItemSelector(txt) {
  if (!txt || txt.match(ITEM_SELECT))
    return " > " + (txt || "*");
  throw new SyntaxError("Illegal item selector: " + txt);
}

function parse$ContainerSelector(txt) {
  if (!txt)
    return "";
  const m = txt.match(SELECTOR);
  if (!m)
    throw new SyntaxError("Illegal container select: " + txt);
  const [, pre, tag, select, post] = m;
  if (!select)
    throw new SyntaxError("Illegal container select: " + txt);
  if (pre && post)
    throw new SyntaxError(
      `Illegal container select: direction can't be both pre: ${pre} and post: ${post} : ${txt}`);
  if (tag && (!pre || !post))
    throw new SyntaxError(
      `Illegal container select: tag selector must be for either pre or post selector: ${txt}`);
  return txt.replace(">>", " ");
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
export function toCssText(shortName, dict) {
  const main = Object.keys(dict).find(key => !key.startsWith(" > "));
  const cssName = "." + shortName.replaceAll(/[^a-z0-9_-]/g, "\\$&");
  const containerSelector = main.match(/[>~+\s]$/) ?
    main + cssName :
    cssName + main;
  const res = [];
  for (let [key, value] of Object.entries(dict)) {
    let str = containerSelector;
    if (key !== main)
      str += key;
    str += " {";
    for (let [k, v] of Object.entries(value))
      str += `\n  ${k}: ${v};`;
    str += "\n}";
    res.push(str);
  }
  return res.join("\n\n");
}
