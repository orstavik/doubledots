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

function* parseEntities(key, value) {
  const m = key.match(
    /^([_.-]*)(?:([A-Z]{2}[A-Z0-9_.-]*)|([a-z][a-zA-Z0-9_.-]*)|([A-Z][a-zA-Z0-9_.-]*))(~)?(~)?([_.-])?$/);
  if (!m)
    throw new SyntaxError("bad name in doubleDots url definition: " + key + "=" + value);
  let [, pFix, portal, reaction, trigger, rule, square, _] = m;
  rule = rule ? "defineRule" : "define";
  if (reaction || trigger) {
    const type = trigger ? "Triggers" : "Reactions";
    fullname = pFix +
      DoubleDots.pascalToKebab(reaction || trigger.replace(/[A-Z]/, c => c.toLowerCase()));
    value ||= reaction || trigger;
    yield { type, fullname, rule, value };
  } else if (portal) {
    portal = portal.toLowerCase().replaceAll(/_[a-z]/g, m => m[1].toUpperCase());
    reaction = pFix + portal;
    let rValue = value ? value[0].toLowerCase() + value.slice(1) : reaction;
    fullname = pFix +
      DoubleDots.pascalToKebab(reaction.replace(/[A-Z]/, c => c.toLowerCase()));
    portal = portal.replace(/[a-z]/, m => m.toUpperCase());
    trigger = pFix + portal;
    let tValue = value || trigger;
    _ = square ? _ || "_" : "";
    if (square || rule === "define")
      yield { type: "Triggers", rule: "define", fullname, value: tValue };
    if (square || rule === "defineRule")
      yield { type: "Triggers", rule: "defineRule", fullname: fullname + _, value: tValue + _ };
    if (square || rule === "define")
      yield { type: "Reactions", rule: "define", fullname, value: rValue };
    if (square || rule === "defineRule")
      yield { type: "Reactions", rule: "defineRule", fullname: fullname + _, value: rValue + _ };
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