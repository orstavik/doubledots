import { parseValueGroup, parseExpression } from "./dollParser.js";
import { BorderValueGroup } from "./BorderValueGroup.js";

// class Rule {
//   constructor(select, valueGroup) {
//     this.select = select;
//     this.valueGroup = valueGroup;
//   }

//   toString() {
//     //todo here we would like to make the select do a toString() on the selector.
//     return `${this.select} {
//   ${this.valueGroup}
// }`;
//   }
// }
// //SELECT
// const selectsKeywords = [
//   "sm", "md", "lg", "xl", "xxl",
//   "portrait", "landscape", "print",
//   "motion-safe", "motion-reduce",

//   "dark", "contrast-more", "contrast-less",

//   "focus", "focus-visible", "focus-within",
//   "hover", "active", "visited", "disabled", "checked",
//   "required", "optional", "valid", "invalid", "read-only", "read-write",

//   "first", "last", "odd", "even", "first-of-type", "last-of-type", "nth", "nth-of-type", "only-child", "only-of-type", "empty"
// ].sort((a, b) => a.length - b.length); //longest first?

// class Select {
//   constructor(name, args) {
//     this.name = name;
//     this.args = args; //false or an array of selects
//     this.className = "." + this.name.replace(/[^a-zA-Z0-9_$-]/g, c => "\\" + c);
//     //todo implement the stringification of this.args.
//   }

//   toString() {
//     //todo implement the stringification of this.args.
//     return this.className;
//   }
// }


// function replaceVariables(values, directVariables, valueGroupVariables) {
//   const res = [];
//   for (let v of values) {
//     const { type, value } = v;
//     if (type === "-") {
//       const variableTxt = directVariables[value];
//       if (!variableTxt)
//         throw new SyntaxError(`Cannot use the ${value} because it is not defined as 'html{ -${value}: hello_solid_gold_or_something; } this <style> sheet.`);
//       const parsedVarValues = valueGroupVariables[value];
//       if (!parsedVarValues)
//         throw new SyntaxError(`cannot use the ${value} as a valueGroupVariable. '${variableTxt}' isn't a valid valueGroup.`);
//       res.push(...parsedVarValues);
//     } else if (type === "--") {
//       const variableTxt = directVariables[value];
//       if (!variableTxt)
//         throw new SyntaxError(`Cannot use the ${value} because it is not defined as 'html{ -${value}: hello_solid_gold_or_something; } this <style> sheet.`);
//       v.txt = variableTxt;
//       res.push(v);
//     } else {
//       //if any of the variables are other type of variables, then we should replace them as such.
//       //we should get the value..
//       res.push(v);
//     }
//   }
//   return res;
// }

// class FlexGroup {
//   constructor(args) {
//     let rowColumn = "row", reverse, gap;
//     //we are whitelisting here..
//     for (let { direction, args: aargs, txt } of args) {
//       if (direction === "row" || direction === "column")
//         rowColumn = direction;
//       else if (direction === "reverse")
//         reverse = "-reverse";
//       else if (direction === "gap") {
//         const [{ num, numberType }] = aargs;
//         gap = num + (numberType || "rem");
//       }
//     }
//     this.obj = {
//       display: "flex",
//       "flex-direction": rowColumn + reverse,
//     };
//     if (gap)
//       this.obj.gap = gap;
//   }

//   toString() {
//     return Object.entries(this.obj).map(([k, v]) => `  ${k}: ${v};`).join("\n");
//   }
// }

// class ColorGroup { }
// //new Type({ type, direction, args: [...{ arg, sign, num, type: "hex/normal", numberType }], value, txt });


// function makeValueGroup(values) {
//   const direction = values.find(v => v.direction)?.direction;
//   const Type = TYPES[direction];
//   if (Type)
//     return new Type(values);
//   throw new SyntaxError(`${direction} is not recognized as an identifying value.`);
// }

// let valueGroups = [BorderValueGroup];
// valueGroups = valueGroups.reduce((res, Type) => ((res[Type.name.slice(0, -10)] = Type), res), {});

const ColorValueGroup = {}; //todo just to have some more.
const FlexValueGroup = {}; //todo just to have some more.

const TYPES = {
  "border": BorderValueGroup,
  "red": ColorValueGroup,
  "blue": ColorValueGroup,
  "flex": FlexValueGroup,
};

function interpret(name, ctxSelect, valueGroup, childValueGroups, valueVars) {
  if (valueGroup[0].valvar) {
    const varName = "-" + valueGroup[0].valvar;
    if (!(varName in valueVars))
      throw new Error("trying to use a valueVar that is not defined: ", name);
    if(!ctxSelect && valueGroup.length === 1 && !childValueGroups.length)
      return; //we don't need to make a rule for direct valVar
    return valueVars[varName].extend(name, ctxSelect, valueGroup, childValueGroups);
  }
  for (let { subs: [first] } of valueGroup) {
    if (first in TYPES)
      return new TYPES[first](name, ctxSelect, valueGroup, childValueGroups);
  }
}

function tryParseVariable(key, value, valueVars) {
  const { valueGroup, childValueGroups } = tryParseValueGroup(value.trim());
  const ruleSet = interpret(key.slice(1), undefined, valueGroup, childValueGroups, valueVars);
  if (!key.startsWith(("--" + ruleSet.type + "-")))
    throw new SyntaxError("the variable name must start with the group name it represents, for clarity.");
  return ruleSet;
}

function tryParseValueGroup(value) {
  try { return parseValueGroup(value); } catch (err) { }
}

//select$value
function parseValueVars(styleEl) {
  const valueVars = {};
  let val;
  for (let rule of styleEl.sheet.cssRules)
    if (rule.selectorText === "html")
      for (let prop of rule.style)
        if (prop.startsWith("--"))
          if (val = tryParseVariable(prop, rule.style.getPropertyValue(prop), valueVars))
            valueVars[prop] = val; //todo and here
  return valueVars;
}


export function init(styleEl) {
  const valueVars = parseValueVars(styleEl);
  for (let rule of Object.values(valueVars))
    styleEl.textContent += "\n" + rule.cssRules;

  const res = {};
  for (let el of document.querySelectorAll("[class]")) {
    const expressions = el.getAttribute("class").trim().split(/\s+/g);
    for (let exp of expressions) {
      const parsedGroups = parseExpression(exp);
      for (let { name, ctxSelect, valueGroup, childValueGroups } of parsedGroups) 
        res[name] = interpret(name, ctxSelect, valueGroup, childValueGroups, valueVars);
    }
  }
  for (let rule of Object.values(res).filter(Boolean))
    styleEl.textContent += "\n" + rule.cssRules;
}
