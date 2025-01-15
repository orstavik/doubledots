//we can put the directions at the beginning or the end of the ctxSelect
//and then we can imagine the :root (<.name>) infront or after the direction.
//and if there is no direction, then it should likely be a <.name>.class:pseudo[attr] selector

/************/
/** SELECT **/
/************/
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

/***********/
/** VALUE **/
/***********/
const ZERO = /(-|)0([0-9]+)/.source; //neg, zeroInt
const FLOAT = /-?[0-9]*\.?[0-9]+(?:e[+-]?[0-9]+)?/.source;
const LENGTH = /[a-z]+|%/.source;
//prefix shorts
const NUMBER = `(${ZERO}|${FLOAT})(${LENGTH}|)`; //num, neg, zeroInt, len
const HEX = /#[0-9a-f]{3,6}/.source;
const VEC = /([a-z]+|)\[/.source;
//non-prefix shorts
const WORD = /[-]*[a-z]+[a-z0-9-]*/.source; //word allows for --var syntax. but not prefix.
const QUOTE = /(?:[`'"])(?:\\.|(?!\1).)*?\1/.source; //sign, textBody
const CALC_EXPR = /[^,\]]+/.source;
const TOKENS = new RegExp(`(\,)|(\])|${VEC}|(${HEX})|(${NUMBER})|(${WORD})|(${QUOTE})|(${CALC_EXPR})`, "g");

function processToken([, c, end, prefix = "", hex, N, num, neg, zInt, length, word, quote, expr]) {
  return c ? "" : end ? end : word ? word :
    prefix ? { prefix, args: [] } :
      num ? { N, num, n: Number(zInt ? neg + "." + zInt : num), length } :
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