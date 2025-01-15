import { CHILD_SELECT, parse$Expression } from "./parser2.js";

import { Border } from "./shorts/Border.js";
import { BorderImage } from "./shorts/BorderImage.js";
import { Flex, FlexChild, InlineFlex } from "./shorts/Flex.js";
import { TextShadow } from "./shorts/TextShadow.js";
import { Palette } from "./shorts/Palette.js";
import { Color } from "./shorts/Color.js";

const TYPES = {
  color: Color,
  palette: Palette,
  border: Border,
  "border-image": BorderImage,
  flex: Flex,
  "inline-flex": InlineFlex,
  "text-shadow": TextShadow,
};
const CHILD_TYPES = {
  flex: FlexChild,
  "inline-flex": FlexChild,
};
const keysLongShort = Object.keys(TYPES).sort((a, b) => b.length - a.length);
const TYPE_NAMES = new RegExp(`^(${keysLongShort.join("|")})($|-)`);
function typeName(name) { return name.match(TYPE_NAMES)?.[1]; }
// function findType(name) {
//   const type = typeName(name);
//   return type && { type, Type: TYPES[type], ChildType: CHILD_TYPES[type] };
// }

function spaceJoin(dict){
  for (let prop in dict)
    if(dict[prop] instanceof Array) 
      dict[prop] = dict[prop].join(" ");
  return dict;
}

//todo push toTable back into the parser.
function interpret$short(short, rules) {
  const { name, args, childArgs } = short;
  // , rule, childRules 
  const { type, Type, ChildType } = rules[name] ?? rules[typeName(name)];
  const css = spaceJoin(Type.parse(args));

  const childCss = new Map();
  // for (let key in childRules)
  //   childCss.set(key, childRules[key]);
  for (let { select, args } of childArgs) {
    // const childRule = childRules[select];
    const childCss = spaceJoin(ChildType.parse(args)); //, childRule.style
    childCss.set(select, { select, childCss }); //childRule,
  }
  return { name, type, css, childCss, Type, ChildType }; // rule,childRules, 
}

function interpret$Expression(txt, rules) {
  try {
    const expr = parse$Expression(txt);
    expr.shorts = expr.shorts.map(short => interpret$short(short, rules));
    return expr;
  } catch (err) {
    return console.error(`C$$ short didn't manage to interpret expression with $: ${txt}.`);
  }
}

const commaStack = ["animation", "transition", "clip-path", "text-shadow", "box-shadow", "background"];
const div = document.createElement("div").style;
function stackOrSmash(main, rule, add) {
  for (let p in add)
    if (p in main && commaStack.includes(p))
      add[p] = main[p] + ",\n  " + add[p];
  div.style.setProperty(k, v);
  return div.style;
  return Object.assign(main, add);
}

function check$overlap(expr) {
  debugger;
  const res = document.createElement("div").style;
  // const res = {};
  const childRes = {};
  for (let { rule, css, childCss } of expr.shorts) {
    //todo check  that we don't have two overlapping rules. That should trigger a warning.
    res = stackOrSmash(res, rule.style, css);
    if (childCss)
      for (let { select, childRule, childCss } of childCss.values())
        childRes[select] = stackOrSmash(childRes[select] ?? {}, childRule.style, childCss);
  }
  return { expr, res, childRes };
}

export function filter$ChildRule(parent) {
  const rx = new RegExp(`^\\s*${parent}\\s*>\\s*${CHILD_SELECT.source.slice(1, -1)}\\s*($|,)`);
  return r => r.selectorText.match(rx);
}

const RULE = /^\s*(\.([a-z][a-z0-9-]*))\s*($|,)/;
function extract$Rules(cssRules) {
  const res = {};
  for (let rule of cssRules) {
    const m = rule.selectorText.match(RULE);
    if (!m)
      continue;
    //todo the rule  must be converted from text.. and we need to parse shorthands based on space..
    const [, select, name] = m;
    const type = typeName(name) ?? {};
    const Type = TYPES[type], ChildType = CHILD_TYPES[type];
    const childRules = ChildType && cssRules.filter(filter$ChildRule(select));
    res[name] = { name, rule, childRules, type, Type, ChildType };
  }
  return res;
}

function toNativeCssProps(cssStyle) {
  const el = document.createElement('div');
  for (let prop of cssStyle)
    el.style[prop] = cssStyle.getPropertyValue(prop);
  return el.style;
}

export function toCssText({ shorts, select: { name: selector } }) {
  const resultRules = { [selector]: [] };
  const main = resultRules[selector];
  for (let { css, childCss, Type } of shorts) {
    main.push(`\n  /**${Type.name}**/`);
    main.push(...Object.entries(css).map(([k, v]) => `\n  ${k}: ${v};`));
    for (let { select, css } of childCss) {
      const body = resultRules[selector + " > " + select] ??= [];
      body.push(...Object.entries(css).map(([k, v]) => `\n  ${k}: ${v};`));
    }
  }
  return Object.entries(resultRules).map(([s, b]) => `\n\n${s} {${b.join("")}\n}`);
}

export async function init(styleEl, defaultStyle) {

  styleEl.textContent =
    (await (await fetch(defaultStyle)).text()) +
    styleEl.textContent;

  //1. extract all referable Rules from the styleSheet {name: {name}}
  const rules = {};//extract$Rules([...styleEl.sheet.cssRules]);
  //2. add Types as rules, even if they have no default rule.
  main: for (let type in TYPES) {
    // for (let { type: t } of Object.values(rules))
    //   if (t === type)
    //     continue main;
    rules[type] = { name: type, type, Type: TYPES[type], ChildType: CHILD_TYPES[type] };
  }

  const newRules = [];
  let val;
  for (let el of document.querySelectorAll("[class]")) {
    for (let txt of el.getAttribute("class").split(/\s+/).filter(txt => txt.includes("$"))) {
      if (val = interpret$Expression(txt, rules))
        newRules.push({ ...val, txt });
    }
    // newRules.map(check$overlap); //todo don't know how to test.
  }
  //todo add the rule to the styleEl
  styleEl.textContent += newRules.map(toCssText).join("\n\n");

  return Object.assign({}, newRules);
}