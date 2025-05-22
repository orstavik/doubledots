export function gatRule(name) {
  name = name.split(".")[1];
  return function gat() { return this.ownerElement.getAttribute(name); };
}
export function sat_Rule(name) {
  name = name.split(".")[1];
  if (!name)
    return function sat_(input) { return this.value = parseStringValue(input); }
  return function sat_(input) { return this.ownerElement.setAttribute(name, parseStringValue(input)); };
}
export function tat_Rule(name) {
  name = name.split(".")[1];
  if (!name)
    throw new SyntaxError("In :DD you can't do tat_ on the current attribute.");
  return function tat_(input) { return this.ownerElement.toggleAttribute(name); };
}
export function rat_Rule(name) {
  name = name.split(".")[1];
  return function rat_(input) { return this.ownerElement.removeAttribute(name); };
}