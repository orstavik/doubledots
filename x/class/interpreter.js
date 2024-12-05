import { extractNumbers, parseDirections, parse$Expression } from "./parser.js";
import { identify, findType, checkShorthandSignature } from "./dictionary.js";

class Border {
  static get default() {
    return /*css*/`
.\\$--border {
  border: 2px dotted;
  border-collapse: initial;
  border-spacing: initial;
  border-radius: 0;
  border-top-color: var(--border-top-color, var(--border-color, var(--color_3, black)));
  border-right-color: var(--border-right-color, var(--border-color, var(--color_3, black)));
  border-bottom-color: var(--border-bottom-color, var(--border-color, var(--color_3, black)));
  border-left-color: var(--border-left-color, var(--border-color, var(--color_3, black)));
}`;
  }

  static element({ direction, style, width, radius, color, collapse }) {
    const res = {};
    if (collapse) {
      let [colSep, { num, type }] = collapse;
      res["border-collapse"] = colSep;
      res["border-spacing"] = num + type;
    }
    const directions = direction ? parseDirections(direction).map(d => `${d}-`) : [""];
    for (let dir of directions) {
      if (style) res[`border-${dir}style`] = style;
      if (width) res[`border-${dir}width`] = width.fullNumber;
      if (radius) res[`border-${dir}radius`] = radius;
      if (color) res[`--border-${dir}color`] = color;
    }
    return res;
  }
}

const CLASSES = {
  border: Border
};

function interpret$Shorthand({ value, childShorts }) {
  const { valueType, defaultNumType } = identify(value);

  const typeStr = [], values = [];
  for (let v of value.split("_")) {
    const [, head, tail] = v.match(/(^[a-z]*)(.*)/);
    const type = findType(valueType, head);
    if (!type) {
      typeStr.push(v);
      values.push(undefined);
    } else {
      //todo should defaultNumType be a dict with {width: "px", radius: "%"}??
      //const defaultNumType = defaultNumTypes[type];
      let { args, str } = extractNumbers(tail, defaultNumType);
      args = !args.length ? head : args.length == 1 ? args[0] : args;
      typeStr.push(type + str);
      values.push({ type, args });
    }
  }
  checkShorthandSignature(valueType, value, typeStr.join("_"));
  return { valueType, values, childShorts };
}

function tryParseExpression(txt) {
  try { return parse$Expression(txt); } catch (err) { }
}

function toTable(values) {
  return values.reduce((o, v) => (v?.type && (o[v.type] = v.args), o), {});
}

function interpret$Variable({ variable }, valueVars) {
  if (variable) {
    if (variable in valueVars)
      return valueVars[variable]; //valueVars objects must be marked as variables.
    throw new SyntaxError("Variable is not defined: " + variable);
  }
}

function cloneCSSStyleDeclaration(cssStyle) {
  const el = document.createElement('div');
  for (let prop of cssStyle)
    el.style[prop] = cssStyle.getPropertyValue(prop);
  return el.style;
}


function interpret$Expression(txt, valueVars) {
  //todo manage big variables
  const m = tryParseExpression(txt.trim());
  if (!m)
    return;
  const { expression, select, shorts } = m;
  const shorts2 = shorts.map(short =>
    interpret$Variable(short, valueVars) ??
    interpret$Shorthand(short));

  //all valueTypes must have a default rule.
  //all valueTypes with children must have a default child rule.
  const cssDeclarations = {};
  for (let { valueType, values, childShorts } of shorts2) {

    const Type = CLASSES[valueType];

    if (childShorts.length && !Type.child)
      throw new SyntaxError(`The type '${valueType}' doesn't support childValue: ${expression}`);

    const values2 = Type.element(toTable(values), values);
    const target = cssDeclarations[valueType] ??=
      cloneCSSStyleDeclaration(valueVars[`.\\$--${valueType}`]);
    for (let k in values2)
      target[k] = values2[k];

    for (let { select, value } of childShorts) {

      const target = cssDeclarations[`${valueType} > ${select}`] ??=
        cloneCSSStyleDeclaration(valueVars[`--${valueType}_child`]);
      const values2 = Type.child(value);
      for (let k in values2)
        target[k] = values2[k];

    }
  }
  //todo now we can convert into css rules actually. The object is finished interpreting.
  return { cssDeclarations, expression, select };
}

function setupDefaultShorthandStyles(styleEl) {
  //todo make the getCssRule(...rule){} function
  //todo then try to find the cssRuleStyle first, remove the elements that are there
  //todo then add all the txt, and then rerun the rule
  let cssTxt = "";
  main: for (let [type, Type] of Object.entries(CLASSES)) {
    for (let rule of styleEl.sheet.cssRules)
      if (rule.selectorText === `.\\$--${type}`)
        break main;
    cssTxt += Type.default;
  }
  styleEl.textContent = cssTxt + styleEl.textContent;

  const valueVars = {};
  for (let rule of styleEl.sheet.cssRules)
    if (rule.selectorText.startsWith(".\\$"))
      valueVars[rule.selectorText] = rule.style;
  return valueVars;
}

//select$value
function parseValueVars(styleEl, valueVars) {
  let val;
  for (let rule of styleEl.sheet.cssRules)
    if (rule.selectorText === "html")
      for (let prop of rule.style)
        if (prop.startsWith("--"))
          if (val = interpret$Expression(rule.style.getPropertyValue(prop), valueVars))
            valueVars[prop] = { ...val, expression: prop };
}

function toCSS({ cssDeclarations, expression, select }) {
  const body = [];
  for (let type in cssDeclarations) {
    body.push(`/**${type}**/`);
    for (let prop of cssDeclarations[type])
      body.push(`${prop}:${cssDeclarations[type][prop]};`);
  }
  const bodyStr = `\n  ${body.join("\n  ")}\n`;
  return `

${select.css} {
  ${JSON.stringify(cssDeclarations)}
}`;
}

export function init(styleEl) {
  const valueVars = setupDefaultShorthandStyles(styleEl);
  parseValueVars(styleEl, valueVars);
  for (let unit of Object.values(valueVars))
    styleEl.textContent += toCSS(unit);

}

