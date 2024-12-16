//selector => (qsDir)?word(-word)*(pseudo|.class|#id|[attr])*
//qsDir => (~~|~|+|-|>>|>)  
//qsDir is only used for mainSelector.
//qsDir for childSelector: inherit implies descendant. non-inherit has implies child.
//pseudo = ^pseudo or ..pseudo
//tag = ^tag(-name)*
//class = .class
//attr = [...]
//id = #id
const DIR = /(~~|~|\+|-|>>|>)/.source;
const IDENTIFIER = /[a-z][a-z0-9-]*/.source;  //our names cannot have "_"!
const ATTR = /\[[\]\s]+\]/.source;
const SUB_SELECT = new RegExp(`(\.${IDENTIFIER}|#${IDENTIFIER}|${ATTR})`);
const SELECT = new RegExp(`^${DIR}?${IDENTIFIER}${SUB_SELECT.source}*$`);

function parseSelect(select) {
  const m = select.match(SELECT);
  if (!m)
    throw new SyntaxError("select is wrong: " + select);
  let [, dir, word, subTxt] = m;
  // const subs = subTxt && [...SUB.exec(subTxt)].map(([sub]) => sub);
  const subs = [];
  if (subTxt)
    for (let [sub] of SUB_SELECT.exec(subTxt))
      subs.push(sub);
  return { dir, word, subs };
}

//short: w50px bold500 white250
//valvar = _-var_
//number = +-*/00.01289
//word = atoz
//hex = #123456
const TYPES = /(%|em|ex|ch|rem|vw|vh|vmin|vmax|px|cm|mm|in|pt|pc|fr)/.source;
// 0.07, .07, 700, 700.007, 007 (can mean 0.07), 00700 (can mean 0.0700)
const NUMBER = new RegExp(`((0*)[0-9]+|0?\\.[0-9]+)${TYPES}?`).source;
const SIGN = /[+*\/-]/.source;
const WORD = /[a-z]+/.source;
const HEX = /#[0-9a-f]+/.source;
const SHORT = new RegExp(`(${WORD})${NUMBER}`);
const VALVAR = /-[a-z][a-z0-9-]*/;
const SUB_VALUE = new RegExp(`^(?:(${WORD})|(${SIGN}?)(${NUMBER})|(${HEX}))$`);

function parseShort(value) {
  const m = value.match(SHORT);
  if (!m)
    return;
  const [, word, number, zeros, type] = m;
  const num = Number(zeros.length ? "." + number.slice(1) : number);
  return { value, subs: [word, { number, type, num }] };
}

function parseValVar(valvar) {
  return valvar.match(VALVAR) && { valvar };
}

function parseSubs(value) {
  const subs = value.split(/(?<!-)-/).map(parseSub);
  return { value, subs };
}

function parseSub(sub) {
  const m = sub.match(SUB_VALUE);
  if (!m)
    throw new SyntaxError("Invalid value: " + sub);
  const [, word, sign, fullNumber, number, zeros, type, hex] = m;
  if (word) return word;
  if (hex) return { hex, num: parseInt(hex.slice(1)) };
  const num = Number(zeros.length ? "." + number.slice(1) : number);
  return { number, type, sign, num };
}

function parseValue(value, i) {
  return (i == 0 && parseValVar(value)) || parseShort(value) || parseSubs(value);
}

//selects$valueGroup
//selects => :selector(:selector)*. Usually a single/bunch of mediaQuery UIXpseudo selectors
//valueGroup => a valueGroup(:childValueGroup)*
//childValueGroup => selector_valueGroup
//valueGroup => value(_value)*
export function parseValueGroup(valueGroup, ...childValueGroups) {
  valueGroup = valueGroup.split("_").map(parseValue);
  childValueGroups = childValueGroups.map(childGroup => {
    let [select, ...values] = childGroup.split("_");
    select = parseSelect(select);
    values = values.map(v => parseValue(v, true)); //no valvar in childValueGroups
    return { select, values };
  });
  return { valueGroup, childValueGroups };
}

export function parseExpression(name) {
  let valueGroups = name.split("$").map(g => g.split(":"));
  const ctxSelect = valueGroups.length > 1 && valueGroups.shift().map(parseSelect);
  valueGroups = valueGroups.map(group => parseValueGroup(...group));
  return valueGroups.map(valueGroup => ({ name, ctxSelect, ...valueGroup }));
}