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

function parseSelect(select) {
  const regex = new RegExp(`^(${selectsKeywords.join("|")})(.*)$`);
  const [_, key, arg] = select.match(regex);
  return { key, arg };
}

function parseSelects(selects) {
  selects = selects.split(":");
  return selects;
}

//VALUE
function parseArg(arg) {
  const TYPES = /(%|em|ex|ch|rem|vw|vh|vmin|vmax|px|cm|mm|in|pt|pc|fr|)/;
  const HEX = /#[0-9a-f]+/;
  const SIGN = /[+*\/-]?/;    // + - * / can come infront of the number
  const DIGITS = /(0\.|\.|)[0-9]+/; //007 is an ok number, it would mean 0.07
  const regex = new RegExp(`^(${SIGN.source})?((${HEX.source})|(${DIGITS.source}))${TYPES.source}$`);
  const [, sign, num, hex, normal,, numberType] = arg.match(regex);
  return { arg, sign, num, type: hex ? "hex" : "normal", numberType };
}

function parseValue(value) {
  const regex = /^(--|-|)([a-z]+(?:-[a-z]+)*)?(.*)$/;
  let [_, type, direction, args] = value.match(regex);
  if (args && !type)
    args = args.split(/(?<!^)-(?:-)/g)?.map(parseArg);
  return { type, direction, args, value };
}

export function parseValueGroup(group) {
  let values = group.split("_");
  values = values.map(parseValue);
  return values;
}

//select$value
function parseCluster(name) {
  let valueGroups = name.split("$");
  const select = valueGroups.length > 1 && parseSelects(valueGroups.shift());
  valueGroups = valueGroups.map(parseValueGroup);
  return { name, select, valueGroups };
}

export function parseClassAttribute(txt) {
  return txt.trim().split(/\s+/g).map(parseCluster);
}

