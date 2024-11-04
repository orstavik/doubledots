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
    yield* parseEntities(name, value);
}

function* parseEntities(name, value) {
  const rx = /^(~)?(?:([_.-]*[A-Z][a-zA-Z0-9_.-]*)|([_.-]*[a-z][a-zA-Z0-9_.-]*))(~)?([_.-])?$/;
  const m = name.match(rx);
  if (!m)
    throw new SyntaxError("bad name in doubleDots url definition: " + name + "=" + value);
  let [_, firstThilde, trigger, reaction, portal, divider = ""] = m;
  value = value || trigger || reaction;
  let rule = firstThilde ? "defineRule" : "define";
  fullname = DoubleDots.pascalToKebab(reaction || trigger.replace(/[A-Z]/, c => c.toLowerCase()));
  type = trigger ? "Triggers" : "Reactions";
  yield { type, fullname, rule, value };
  if (portal) {
    if (!trigger)
      throw new SyntaxError("Portal define syntax must use Trigger as its core.");
    type = "Reactions";
    if(firstThilde) 
      fullname = fullname.slice(0, -1);
    fullname += divider;
    rule = divider ? "defineRule" : "define";
    value = value.replace(/[A-Z]/, c => c.toLowerCase());
    yield { type, fullname, rule, value };
  }
}

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