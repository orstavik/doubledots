function parseStringValue(input) {
  return input?.toString instanceof Function ? input = input.toString() :
    input?.toJSON instanceof Function ? input = input.toJSON() :
    input && input instanceof Object ? input = JSON.stringify(input) :
    input;
}

function gatRule(name) {
  name = name.split(".")[1];
  return function gat() { return this.ownerElement.getAttribute(name); };
}

function sat_Rule(name) {
  name = name.split("_")[1];
  if (!name)
    return function sat_(input) { return this.value = parseStringValue(input); }
  return function sat_(input) { return this.ownerElement.setAttribute(name, parseStringValue(input)); };
}

function tat_Rule(name) {
  name = name.split("_")[1];
  if (!name)
    throw new SyntaxError("In :DD you can't do tat_ on the current attribute.");
  return function tat_(input) { return this.ownerElement.toggleAttribute(name); };
}

function rat_Rule(name) {
  name = name.split("_")[1];
  return function rat_(input) { return this.ownerElement.removeAttribute(name); };
}

export {
  gatRule as "gat.",
  sat_Rule as "sat_",
  tat_Rule as "tat_",
  rat_Rule as "rat_"
}
