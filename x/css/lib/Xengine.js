import { flex, _flex } from "./Xlayout.js";
import { border, size, color } from "./Xfunc.js";

export class Expression {

  constructor(name, args) {
    this.args = args;
    this.name = name;
  }
  toString() {
    return `${this.name}(${this.args.join(",")})`;
  }
  get signature(){
    return this.name + "/" + this.args.length;
  }
}

const shortFuncs = { flex, _flex, border, size, color };

export const toCss = txt => [...toCssText(txt, interpretClass(txt))].join("\n");

function interpret(exp) {
  const obj = shortFuncs[exp.name](exp);
  return Object.fromEntries(Object.entries(obj)
    .filter(kv => kv[1] != null)
    .map(([k, v]) => [k.replace(/[A-Z]/g, "-$&").toLowerCase(), v])
  );
}

export function interpretClass(txt) {
  const { container: { selector, shorts }, items } = parse$Expression(txt);
  const res = {
    [selector]: Object.assign({}, ...shorts.map(x => interpret(x)))
  };
  for (let { selector, shorts } of items)
    res[selector] = Object.assign({}, ...shorts.map(x => interpret(x)));
  return res;
  // const superShorts = container.shorts.map(s => superShorts[s.name]).filter(Boolean);
  //merge the superShorts objects with the .results objects from container and items
  // return { container, items };
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
      if (a === ")" && !res.length)
        throw new SyntaxError("empty function not allowed in CSSs");
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

/**
 * $short specificity
 */

//dynamic element
const elUix = /hover|active|focus|focus-visible|focus-within/.source;
const elMedia = /playing|paused|current|past|future/.source;
const elMediaSafari = /buffering|muted|seeking|stalled/.source;
const elForm = /default|autofill|checked|indeterminate|blank|valid|invalid|in-range|out-of-range|required|optional|user-valid|user-invalid/.source;
const elLink = /link|visited/.source;
const elModal = /fullscreen|modal|picture-in-picture/.source;
//actionable element
//These properties are structural, but they communicate to user about interaction. 
//Thus interactional/dynamic oriented.
const elForm2 = /enabled|disabled|read-only|read-write|placeholder-shown/.source;
const elLink2 = /any-link|local-link|target|target-within|scope/.source;

//dynamic window
const winDark = /dark|light/.source;
const winLang = /lang\([a-zA-Z0-9,-]+\)/.source;
const winDir = /dir\((?:rtl|ltr)\)/.source;

//static dom structure
const staticTree = /root|empty|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type/.source;
const staticTreeFunctions = /(?:nth-of-type|nth-of-last-type|nth-of-child|nth-of-last-child)/.source;
const AnPlusB = /\((?:odd|even|-?\d+(?:[+-]\d+)?)\)/.source;


let PSEUDO_EL = `:(?:${elUix}|${elMedia}|${elMediaSafari}|${elForm}|${elLink}|${elModal}|${elForm2}|${elLink2})`;
let PSEUDO_WIN = `:(?:${winDark}|${winLang}|${winDir})`;
let PSEUDO_STATIC = `:(?:${staticTree}|${staticTreeFunctions + AnPlusB})`;

const ATTR_OP = /[$*~|^]?=/.source;
const STRING = /"(?:\\.|[^"\\])*"/.source;
const ATTR = new RegExp(`\\[[^"\\]]+(?:${ATTR_OP + STRING})?\\]`).source;

const CLASS = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.source;
const TAG = /[a-z][a-z0-9-]*/.source;
//we use &=>and !=>not
const MEDIA = /@media\([a-z0-9:><=&!,-]+\)/.source;

const EL = `${PSEUDO_EL}|${ATTR}`;
const WIN = `${PSEUDO_WIN}|${MEDIA}`;
const DOM = `${PSEUDO_STATIC}|${CLASS}|${TAG}`;
const DIVIDER = />>|[\s>+~]/.source;
const NOT_START = /:not\(/.source;
const HAS_START = /:has\(/.source;
const END = /\)/.source;
let SELECTOR_TOKENS = `(${EL})|(${WIN})|(${DOM})|(${DIVIDER})|(${NOT_START})|(${HAS_START})|(${END})|(%)|(.)`;
SELECTOR_TOKENS = new RegExp(SELECTOR_TOKENS, "g");

function countSpecificity(tokens, res, depth = 0, isHas = false) {
  for (let [, el, win, dom, divider, not, has, end, percent, any] of tokens) {
    if (divider)
      (res[1] += res[0]), (res[0] = 0);
    else if (el)
      res[isHas ? 1 : 0]++;
    else if (win)
      res[2]++;
    else if (dom)
      res[3]++;
    else if (not)
      countSpecificity(tokens, res, depth + 1, isHas);
    else if (has)
      countSpecificity(tokens, res, depth + 1, true);
    else if (end) {
      if (depth) return res;
      throw new SyntaxError("Missing parenthesis start '('.");
    }
    // else if(percent) ; //do nothing
  }
  if (!depth) return res;
  throw new SyntaxError("Missing parenthesis start ')'.");
}

export function selector$specificity(selector) {
  const res = countSpecificity(selector.matchAll(SELECTOR_TOKENS), [0, 0, 0, 0]);
  return res[0] * 1000 + res[1] * 100 + res[2] * 10 + res[3];
}

/**
 * $SHORT_ABBREVIATIONS
 */
const SHORT_ABBREVIATIONS = {
  ">>": " ",
  ":sm": "@media(min-width:640px)",
  ":md": "@media(min-width:768px)",
  ":lg": "@media(min-width:1024px)",
  ":xl": "@media(min-width:1280px)",
  ":2xl": "@media(min-width:1536px)",
  ":dark": "@media(prefers-color-scheme:dark)",
  ":first": ":first-child",
  ":last": ":last-child",
  ":edge": ":is(:first-child,:last-child)",
};

const ABBREVIATIONS = new RegExp(Object.keys(SHORT_ABBREVIATIONS).join("|"), "g");
function selector$abbrivations(selector) {
  return selector.replaceAll(ABBREVIATIONS, t => SHORT_ABBREVIATIONS[t]);
}

/**
 * $short SELECTOR
 * 
 * NO-SPACE-PERCENT-selector
 * 1. ">>" is the descendant space selector.
 * 2. "%" is a placeholder for implied selector. 
 *
 * TODO not supported
 *  :where(), :state(), :has-slotted, :host, :host-context(), :slotted()   
 */

const testSelector = (function () {
  const styleSheet = new CSSStyleSheet();
  return function testSelector(selector, txt = selector) {
    try {
      selector = selector.replaceAll("%", ".HELLO-SUNSHINE");
      styleSheet.insertRule(selector + " { border-width: 2px; }");
      styleSheet.deleteRule(0);
    } catch (err) {
      throw new SyntaxError("Illegal no-space-percent selector: " + txt);
    }
  };
})();

function parse$Selector(txt) {
  txt = txt.trim();
  const cssSelector = selector$abbrivations(txt);
  //todo extract media queries!!
  testSelector(cssSelector, txt);
  const specificity = selector$specificity(cssSelector);
  return cssSelector + "$$" + specificity;
}

function parse$ContainerSelector(txt) {
  txt = txt.split(",").map(txt => txt.includes("%") ? txt : "%" + txt).join(",");
  return parse$Selector(txt);
}

function parse$ItemSelector(txt) {
  if (txt.includes("%"))
    throw new SyntaxError("$short item selector cannot contain %: " + txt);
  return "|" + (parse$Selector(txt || "*"));
}

/**
 * toCssText
 */
function ruleToString(selector, props) {
  let str = selector + " {";
  for (let [k, v] of Object.entries(props))
    str += `\n  ${k}: ${v};`;
  return str + "\n}";
}

function* toCssText(shortName, dict) {
  const cssName = "." + shortName.replaceAll(/[^a-z0-9_-]/g, "\\$&");
  let specificity, sel, props, rule;
  //container
  [sel, props] = Object.entries(dict).find(([k]) => !k.startsWith("|"));
  [sel, specificity] = sel.split(/\$\$(\d+$)/);
  const conSel = `:where(${sel.replaceAll("%", cssName)})`;
  rule = ruleToString(conSel, props);
  yield `/*container ${specificity}*/\n/*${shortName}*/\n${rule}`;
  //items
  for ([sel, props] of Object.entries(dict)) {
    if (!sel.startsWith("|"))
      continue;
    [, sel, specificity] = sel.match(/\|(.*)\$\$(\d+)$/s);
    sel = `${conSel} >\n:where(${sel || "*"})`;
    rule = ruleToString(sel, props);
    yield `/*item ${specificity}*/\n/*${shortName}*/\n${rule}`;
  }
}