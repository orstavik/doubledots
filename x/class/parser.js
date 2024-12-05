//we can put the directions at the beginning or the end of the ctxSelect
//and then we can imagine the :root (<.name>) infront or after the direction.
//and if there is no direction, then it should likely be a <.name>.class:pseudo[attr] selector
const DIR = /~|\+|>>|>/.source;
const ANY = /[^:#[\]="]+/.source;
const TAG = /[a-z]+(?:-[a-z]+)/.source;
const HASHDOTS = /[#:\.]/.source;
const ATTR = /\[[^\]]+\]/.source;
const SELECT = new RegExp(`^(${DIR})?(${TAG})?(${HASHDOTS}${ANY}|${ATTR})*(${DIR})?$`);

const VARIABLE = /^--([a-z-]+)_.*$/;

const SIGN = /[+*\/-]/.source;
const INT = /(0*)[0-9]+/.source;
const FLOAT = /0?\.[0-9]+/.source; //.07 and 0.07
const TYPES = /%|em|ex|ch|rem|vw|vh|vmin|vmax|px|cm|mm|in|pt|pc|fr/.source;
const HEX = /#[0-9a-f]+/.source;
const NUMBERS = new RegExp(`(${SIGN})?(${INT}|${FLOAT})(${TYPES})?|(${HEX})`, "g");


function parse$Select(txt, expression) {
  if (!txt)
    return txt;
  const m = txt.match(SELECT);
  if (!m)
    throw new SyntaxError("Illegal ctx select: " + txt);
  const [, pre, tag, select, post] = m;
  if (pre && post)
    throw new SyntaxError(
      `Illegal ctx select: direction can't be both pre: ${pre} and post: ${post} : ${txt}`);
  if (tag && (!pre || !post))
    throw new SyntaxError(
      `Illegal ctx select: tag selector must be for either pre or post selector: ${txt}`);
  const name = "." + expression.replaceAll(/[^a-z0-9_-]/g, "\\$&");
  const css = post ? tag + select + post.replace(">>", " ") + name :
    pre ? `${name}:has(${pre.replace(">>", "")}${tag + select})` :
      name + select;
  return { expression, name, css };
}

function check$ChildSelect(select) {
  const m = select.match(SELECT);
  if (!m || m[1] || m[2] || m[4])
    throw new SyntaxError("Illegal child select: " + select);
}

function parse$ChildShort(str) {
  let [select, value] = str.split(/_/);
  check$ChildSelect(select);
  return { select, value };
}

function parse$Short(short) {
  let [value, ...childShorts] = short.split("|");
  childShorts = childShorts.map(parse$ChildShort);
  return { value, childShorts };
}

function parse$Variable(variable) {
  const m = variable.match(VARIABLE);
  if (m)
    return { variable, valueType: m[1] };
}

//:hover$flex_row|_1_0_auto|div.something#alice[bob="dothis"]:focus:first_0|:focus_1_2_auto|div_1|.bob_none$red500_blue500
export function parse$Expression(expression) {
  if (expression.indexOf("$") < 0)
    return;
  let [select, ...shorts] = expression.split("$");
  select = parse$Select(select, expression);
  shorts = shorts.map(str => parse$Variable(str) ?? parse$Short(str));
  return { expression, select, shorts };
}

export function parseDirections(trblxy) {
  const res = new Set();
  for (let [d] of trblxy.matches(/top|left|bottom|right|t|l|r|b|x|y/g)) {
    if (d === "t") res.add("top");
    else if (d === "b") res.add("bottom");
    else if (d === "l") res.add("left");
    else if (d === "r") res.add("right");
    else if (d === "x") res.add("left").add("right");
    else if (d === "y") res.add("top").add("bottom");
    else res.add(d);
  }
  return [...res];
}

function parseNumber(sign, number, zeros, type, hex) {
  if (hex) return { hex, num: parseInt(hex.slice(1)) };
  const num = Number(zeros.length ? "." + number.slice(1) : number);
  return { fullNumber: number + type, number, type, sign, num };
}

export function extractNumbers(str, defaultNumType) {
  const args = [];
  str = str.replaceAll(NUMBERS, (_, sign, num, zeros, type, hex) =>
    (args.push(parseNumber(sign, num, zeros, type ?? defaultNumType, hex)), "#"));
  return { args, str };
}





