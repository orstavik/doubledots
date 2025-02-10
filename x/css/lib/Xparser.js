import { parse$ContainerSelector, parse$ItemSelector } from "./parseSelector.js";
export { toCssText } from "./parseSelector.js";

export class Expression {

  constructor(name, args) {
    this.args = args;
    const ALIASES = {
      p: "padding",
      m: "margin",
      snap: "scrollSnapType",
    };
    this.name = ALIASES[name] ?? name;
    this._name = name;
  }
  toString() {
    return `${this.name}(${this.args.join(",")})`;
  }
}

const WORD = /[-a-z][a-z0-9-]*/;
const CPP = /[,()]/.source;
const nCPP = /[^,()]+/.source;
const QUOTE = /([`'"])(?:\\.|(?!\3).)*?\3/.source;
const TOKENS = new RegExp(`(${QUOTE})|(\\s+)|(${CPP})|(${nCPP})`, "g");
const SUPERSHORT = new RegExp(
  `\\s*([^{]+)\\s*\\{((?:(["'])(?:\\\\.|(?!\\3).)*?\\3|[^}])+?)\\}`, "g");


function processToken([m, , , space]) {
  return space ? undefined : m;
}

function diveDeep(tokens, top) {
  const res = [];
  while (tokens.length) {
    let a = tokens.shift();
    if (top && a === ",") throw "can't start with ','";
    if (top && a === ")") throw "can't start with ')'";
    if (a === "," || a === ")") {         //empty
      res.push(undefined);
      if (a === ")")
        return res;
      continue;
    }
    let b = tokens.shift();
    if (top && b === ",") throw "top level can't list using ','";
    if (top && b === ")") throw "top level can't use ')'";
    if (b === "(" && !a.match(WORD)) throw "invalid function name";
    if (b === "(") {
      a = new Expression(a, diveDeep(tokens));
      b = tokens.shift();
    }
    if (b === ")" || (top && b === undefined))
      return res.push(a), res;
    if (b == ",")
      res.push(a);
    else
      throw "syntax error";
  }
  throw "missing ')'";
}

function parseNestedExpression(short) {
  const tokensOG = [...short.matchAll(TOKENS)].map(processToken).filter(Boolean);
  if (tokensOG.length === 1)
    return tokensOG[0];
  const tokens = tokensOG.slice();
  try {
    const res = diveDeep(tokens, true);
    if (tokens.length)
      throw "too many ')'";
    return res[0];
  } catch (e) {
    const i = tokensOG.length - tokens.length;
    tokensOG.splice(i, 0, `{{{${e}}}}`);
    const msg = tokensOG.join("");
    throw new SyntaxError("Invalid short: " + msg);
  }
}

export function parse$Expression(txt) {
  let [container, ...items] = txt.split("|").map(seg => seg.split("$"));
  const [cSelect, ...cShorts] = container;
  container = {
    selector: parse$ContainerSelector(cSelect),
    shorts: cShorts.map(parseNestedExpression)
  };
  items = items.map(([iSelect, ...iShorts]) => ({
    selector: parse$ItemSelector(iSelect),
    shorts: iShorts.map(parseNestedExpression)
  }));
  return { container, items };
}

export function* parseSuperShorts(txt) {
  txt = txt.replace(/\/\*[\s\S]*?\*\//g, ""); //remove comments
  for (let [, name, body] of txt.matchAll(SUPERSHORT))
    yield { [name]: parse$Expression(body) };
}

export function cssClassName(shortName) {
  return "." + shortName.replaceAll(/[^a-z0-9_-]/g, "\\$&");;
}