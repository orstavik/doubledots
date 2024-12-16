import { parseValueGroup, parseClassAttribute } from "./dollarValueParser.js";

class Rule {
  constructor(select, valueGroup) {
    this.select = select;
    this.valueGroup = valueGroup;
  }

  toString() {
    //todo here we would like to make the select do a toString() on the selector.
    return `${this.select} {
  ${this.valueGroup}
}`;
  }
}
//SELECT
const selectsKeywords = [
  "sm", "md", "lg", "xl", "xxl",
  "portrait", "landscape", "print",
  "motion-safe", "motion-reduce",

  "dark", "contrast-more", "contrast-less",

  "focus", "focus-visible", "focus-within",
  "hover", "active", "visited", "disabled", "checked",
  "required", "optional", "valid", "invalid", "read-only", "read-write",

  "first", "last", "odd", "even", "first-of-type", "last-of-type", "nth", "nth-of-type", "only-child", "only-of-type", "empty"
].sort((a, b) => a.length - b.length); //longest first?

class Select {
  constructor(name, args) {
    this.name = name;
    this.args = args; //false or an array of selects
    this.className = "." + this.name.replace(/[^a-zA-Z0-9_$-]/g, c => "\\" + c);
    //todo implement the stringification of this.args.
  }

  toString() {
    //todo implement the stringification of this.args.
    return this.className;
  }
}


function replaceVariables(values, directVariables, valueGroupVariables) {
  const res = [];
  for (let v of values) {
    const { type, value } = v;
    if (type === "-") {
      const variableTxt = directVariables[value];
      if (!variableTxt)
        throw new SyntaxError(`Cannot use the ${value} because it is not defined as 'html{ -${value}: hello_solid_gold_or_something; } this <style> sheet.`);
      const parsedVarValues = valueGroupVariables[value];
      if (!parsedVarValues)
        throw new SyntaxError(`cannot use the ${value} as a valueGroupVariable. '${variableTxt}' isn't a valid valueGroup.`);
      res.push(...parsedVarValues);
    } else if (type === "--") {
      const variableTxt = directVariables[value];
      if (!variableTxt)
        throw new SyntaxError(`Cannot use the ${value} because it is not defined as 'html{ -${value}: hello_solid_gold_or_something; } this <style> sheet.`);
      v.txt = variableTxt;
      res.push(v);
    } else {
      //if any of the variables are other type of variables, then we should replace them as such.
      //we should get the value..
      res.push(v);
    }
  }
  return res;
}

class FlexGroup {
  constructor(args) {
    let rowColumn = "row", reverse, gap;
    //we are whitelisting here..
    for (let { direction, args: aargs, txt } of args) {
      if (direction === "row" || direction === "column")
        rowColumn = direction;
      else if (direction === "reverse")
        reverse = "-reverse";
      else if (direction === "gap") {
        const [{ num, numberType }] = aargs;
        gap = num + (numberType || "rem");
      }
    }
    this.obj = {
      display: "flex",
      "flex-direction": rowColumn + reverse,
    };
    if (gap)
      this.obj.gap = gap;
  }

  toString() {
    return Object.entries(this.obj).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  }
}

class ColorGroup { }
//new Type({ type, direction, args: [...{ arg, sign, num, type: "hex/normal", numberType }], value, txt });
const TYPES = {
  "red": ColorGroup,
  "blue": ColorGroup,
  flex: FlexGroup,
};


function makeValueGroup(values) {
  const direction = values.find(v => v.direction)?.direction;
  const Type = TYPES[direction];
  if (Type)
    return new Type(values);
  throw new SyntaxError(`${direction} is not recognized as an identifying value.`);
}

//select$value
function extractGlobalVariables(styleEl) {
  const directVars = {};
  for (let rule of styleEl.sheet.cssRules)
    if (rule.selectorText === "html")
      for (let prop of rule.style)
        if (prop.startsWith("--"))
          directVars[prop] = rule.style.getPropertyValue(prop).trim();
  const valueGroupVars = {};
  for (let prop in directVars) {
    try {
      valueGroupVars[prop.slice(1)] = parseValueGroup(directVars[prop]);
    } catch (err) { }
  }
  return { directVars, valueGroupVars };
}


export function init(styleEl) {
  const { directVars, valueGroupVars } = extractGlobalVariables(styleEl);
  const res = {};
  for (let el of document.querySelectorAll("[class]")) {
    const txt = el.getAttribute("class");
    for (let { name, select, valueGroups } of parseClassAttribute(txt)) {
      select = new Select(name, select);
      valueGroups = valueGroups.map(group => replaceVariables(group, directVars, valueGroupVars));
      valueGroups = valueGroups.map(group => makeValueGroup(group));
      for (let valueGroup of valueGroups)
        res[valueGroup.constructor.name] = new Rule(select, valueGroup);
    }
  }
  for (let [TypeName, rule] of Object.entries(res)) {
    styleEl.textContent += rule.toString();
  }
}
