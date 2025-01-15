//we can put the directions at the beginning or the end of the ctxSelect
//and then we can imagine the :root (<.name>) infront or after the direction.
//and if there is no direction, then it should likely be a <.name>.class:pseudo[attr] selector
const DIR = /~|\+|>>|>/.source;
const ANY = /[^:#[\]="]+/.source;
const TAG = /[a-z]+(?:-[a-z]+)/.source;
const HASHDOTS = /[#:\.]/.source;
const ATTR = /\[[^\]]+\]/.source;
const SELECT = new RegExp(`^(${DIR})?(${TAG})?(${HASHDOTS}${ANY}|${ATTR})*(${DIR})?$`);
export const CHILD_SELECT = new RegExp(`^(${HASHDOTS}${ANY}|${ATTR})*$`);

function parse$Select(txt, expression) {
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
  expression = "." + expression.replaceAll(/[^a-z0-9_-]/g, "\\$&");
  const css = post ? tag + select + post.replace(">>", " ") + expression :
    pre ? `${expression}:has(${pre.replace(">>", "")}${tag + select})` :
      expression + (select || "");
  return { expression: expression, name: expression, css };
}

function check$ChildSelect(txt) {
  if (!txt.match(CHILD_SELECT))
    throw new SyntaxError("Illegal child select: " + txt);
}

const INT = /[0-9]+/.source;
const FLOAT = /0?\.[0-9]+/.source; //.07 and 0.07
const HEX = /#[0-9a-f]+/.source;
const SIGN = /[+*/]/.source; //only +*/. If you want to do a calc(-num), then you do calc(+-num)
const FIX = /[a-z]+(?:-[a-z]+)*/.source;
// const PRESUFFIX = /^([a-z]+)-([a-z]+(-[a-z]+)*)$/;
const ARG = new RegExp(`^(${FIX}|)(${SIGN})?(-|)(?:(${HEX})|(${FLOAT})|(${INT}))?(${FIX}|%)?$`);

function parseNumber(neg, hex, float, int) {
  return hex ? parseInt(neg + hex.slice(1), 16) :
    float ? Number(float) :
      int ? parseInt(neg + (int[0] === "0" ? "." + int.slice(1) : int)) :
        undefined;
}

// { prefix, sign, neg, hex, float, int, suffix, num }
function parse$arg(arg) {
  const m = arg.match(ARG);
  if (!m)
    return;
  let [, prefix, sign, neg, hex, float, int, suffix] = m;
  if (prefix && !(sign || neg || hex || float || int || suffix)) {
    [prefix, suffix] = prefix.split(/_/);
    return { prefix, suffix };
  }
  const num = parseNumber(neg, hex, float, int);
  return { prefix, sign, neg, hex, float, int, suffix, num };
}

function parse$Short(short) {
  let [main, ...childArgs] = short.split("|");
  childArgs = childArgs.map(v => {
    let [select, ...args] = v.split("_");
    args = args.map(parse$arg);
    check$ChildSelect(select);
    return { select, args };
  });
  let [name, ...args] = main.split("_");
  args = args.map(parse$arg);
  return { name, args, childArgs };
}

//:hover$flex_row|_1_0_auto|div.something#alice[bob="dothis"]:focus:first_0|:focus_1_2_auto|div_1|.bob_none$red500_blue500
export function parse$Expression(expression) {
  let [select, ...shorts] = expression.split("$");
  select = parse$Select(select, expression);
  shorts = shorts.map(parse$Short);
  return { expression, select, shorts };
}