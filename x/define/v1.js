/**
 * ## `DoubleDots.Reference` rules.
 * 
 * 1. the resource inside the module file is identified by the value||name.
 * 2. Names starting with upCase imply Triggers `/[^a-zA-Z]*[A-Z]/`
 *    Names starting with lowCase imply Reactions `/[^a-zA-Z]*[A-Z]/`
 * 3. Names ending with `/[a-zA-Z]/` are regular definitions.
 *    Names ending with non-letters such as `/_-\./` are rules.
 * 4. The refName is a snake-case of the CamelCaseName.
 *    The first letter (in trigger references) are not `-`prefixed.
 */
async function loadDef(url, lookup) {
  const module = await import(url);
  if (!module || typeof module !== "object" && !(module instanceof Object))
    throw new TypeError(`URL is not an es6 module: ${this.url}`);
  const def = module[lookup];
  if (def) return def;
  for (let [k, v] of Object.entries(module))
    if (k.startsWith("dynamic"))
      if (v[lookup])
        return v[lookup];
  throw new TypeError(`ES6 module doesn't contain resource: ${lookup}`);
}

function* parse(url) {
  const hashSearch = (url.hash || url.search).slice(1);
  if (!hashSearch)
    throw DoubleDots.SyntaxError("Missing DoubleDots.Reference in url: " + url);
  const refs = hashSearch.entries?.() ?? hashSearch.split("&").map(s => s.split("="));
  for (let [name, value] of refs)
    yield parseUnit(name, value);
}

function parseUnit(name, value) {
  return {
    value: value || name,
    fullname: DoubleDots.pascalToKebab(DoubleDots.pascalToCamel(name)),
    type: /^_*[A-Z]/.test(name) ? "Triggers" : "Reactions",
    rule: /[\._-]$/.test(name) ? "defineRule" : "define"
  };
}
// {Reactions: {define/defineRule: {fullname: r.url, r.value}, Triggers, }

async function defineImpl(url, root) {
  for (let r of parse(url))
    root[r.type][r.rule](r.fullname, loadDef(url, r.value));
};

//_:define  => must be installed to enable the loading of doubledots triggers and reactions.
function define() {
  const src = this.ownerElement.getAttribute("src");
  const base = src ? new URL(src, location) : location;
  defineImpl(new URL(this.value, base), this.ownerDocument);
}

document.Reactions.define("define", define);