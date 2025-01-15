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

const PRE = /[a-z]+/.source;
const WORD = /-([a-z][a-z0-9-]*)/.source;
const VEC = /\[(.*)\]/.source;
const INT = /[0-9]+/.source;
const FLOAT = /0?\.[0-9]+/.source; //.07 and 0.07
const SIGN = /[+*/]/.source;   //only +*/. If you want to do a calc(-num), then you do calc(+-num)
const SUF = /[a-z]+(?:-[a-z0-9]+)*/.source;
const NUM = new RegExp(`(${SIGN}|)(-|)(?:(${INT})|(${FLOAT}))(${SUF}|%|)`).source;
const ARG = new RegExp(`^(${PRE})?(?:${VEC}|${WORD}|${NUM}|)$`);


// export function cssTopLevelComma(str, start = 0) {
//   const res = [];
//   for (let i = 0; i < str.length; i++) {
//     const c = str[i];
//     if (c === '[')
//       i = findParenthesisEnd(str, i + 1);
//     else if (c === ',') {
//       res.push(str.slice(start, i).trim());
//       start = i + 1;
//     }
//   }
//   res.push(str.slice(start).trim());
//   return res;
// }


function replaceInPlace(ar, quotes) {
  //todo iterate the quotes instead, so it is faster
  for (let i = 0; i < ar.length; i++) {
    const strAr = ar[i];
    if (strAr instanceof Array)
      replaceInPlace(strAr, quotes);
    if (typeof strAr == "string")
      ar[i] = strAr.replaceAll(/"(\d+)"/g, (_, d) => quotes[d]);
  }
}

function commaArray(str, I = 0) {
  let b = I, a = I, res = [];
  while (b < str.length) {
    const c = str[b];
    if (c === ",") {
      res.push(str.substring(a, b));
      a = ++b;
    } else if (c === "[") {
      const [inner, B] = commaArray(str, b + 1);
      res.push(inner);
      a = b = B;
    } else if (c === "]") {
      if (!I)
        throw new SyntaxError("Ending a [vector] too quickly? " + str);
      res.push(str.substring(a, b - 1));
      return [res, b + 1];
    }
    b++;
  }
  if (I)
    throw new SyntaxError("[] must end with a ]: " + str);
  res.push(str.substring(a));
  return res;
}

function parse$vec(str) {
  const qs = [];
  str = str.replaceAll(/([`'"])((?:\\.|(?!\1).)*?)\1/g, m => `"${qs.push(m) - 1}"`);
  const res = commaArray(str, 0);
  replaceInPlace(res, qs);
  return res;
}

function parse$arg(arg) {
  const m = arg.match(ARG);
  if (!m)
    return;
  let [, prefix, vector, word, sign, neg, int, float, suffix] = m;
  if (vector)
    return { prefix, vector: parse$vec(vector) };
  if (int || float) {
    const num = Number(neg + (float ?? int.replace(/^0/, ".")));
    return { prefix, sign, neg, float, int, suffix, num };
  }
  if (word)
    return { prefix, word };
  return { prefix: "", word: prefix };
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

/**************************
 * CSS value functions parsing 
 */
const VAR = /--[a-z][a-z0-9-]*/.source;
const KEYWORD = /[a-z]+(-(?:[a-z]+))*/.source;
const Q = /\?\?/.source;
const NULL_COALESCE = new RegExp(`\\b(${VAR}((${Q + VAR})*((${Q + NUM}|${Q + VAR}|${Q + KEYWORD})))?)`);

// function findParenthesisEnd(str, i = 0, d = 0) {
//   for (let c = str[i]; i < str.length; c = str[++i]) {
//     if (c === ")" && !d)
//       return i;
//     c === "(" ? d++ : c === ")" && d--;
//   }
// }

function convertToVar(chain) {
  const last = chain.pop();
  const vars = chain.map(c => `var(${c},`);
  return vars + last + ")".repeat(chain.length);
}

//var??var??varAlt
//var = /--[a-z][a-z0-9-]*/
//varAlt = number|keyword|var|expr
//number = /^(0?\.?[0-9]+|)([a-z]+|%|)/
//keyword = 
//expr = (keyword|)
export function parseCssVarInCssExpr(str) {
  const splits = str.split(NULL_COALESCE);
  let res = splits[0];
  for (let i = 1; i < splits.length; i += 2) {
    let a = splits[i], b = splits[i + 1];
    const chain = a.split("??");
    if (b[0] === "(") {
      let last = chain.at(-1);
      if (!last.startsWith(/a-z/))
        throw new SyntaxError(`"${str}" has invalid tail: ${last + b}`);
      const end = findParenthesisEnd(b, 1);
      chain[chain.length - 1] += b.slice(0, end);
      b = b.slice(end);
    }
    res += convertToVar(chain) + b;
  }
  return res;
}

// //splits string into topLevel dividers
// export function cssTopLevelComma(str, start = 0) {
//   const res = [];
//   for (let i = 0; i < str.length; i++) {
//     const c = str[i];
//     if (c === '(')
//       i = findParenthesisEnd(str, i + 1);
//     else if (c === ',') {
//       res.push(str.slice(start, i).trim());
//       start = i + 1;
//     }
//   }
//   res.push(str.slice(start).trim());
//   return res;
// }

// //returns true if it encounters a "," outside a "(,,,)" expr, or a space in a string.
// export function topLevelDivider(str){
//   str = str.trim();
//   for (let i = 0; i < str.length; i++) {
//     const c = str[i];
//     if (c === '(')
//       i = findParenthesisEnd(str, i + 1);
//     else if (c === ',' || c === " ") 
//       return true;
//   }
//   return false;
// }


