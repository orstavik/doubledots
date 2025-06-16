async function getModuleFunctions(url) {
  const module = await import(url);
  if (!module || typeof module !== "object" && !(module instanceof Object))
    throw new TypeError(`URL is not an es6 module: ${this.url}`);
  const moduleFunctions = {};
  for (let [k, v] of Object.entries(module))
    if (typeof v === "function")
      moduleFunctions[k] = v;
  return moduleFunctions;
}

//definitions from the attr itself first, then from the src attribute searchParams, then from the filename.
function srcAndParams(at, name, src) {
  name = typeof name === "string" ? name : at.value;
  try {
    src = src instanceof URL ? src : new URL(src, location.href);
  } finally {
    src = new URL(at.ownerElement.getAttribute("src"), location.href);
  }
  return {
    src,
    params: name ?
      new URLSearchParams(name) :
      src.searchParams ??
      new URLSearchParams(src.pathname.split("/").pop().replace(/\.m?js$/, ""))
  };
}

async function loadRuleDefs(src, name) {
  const module = await getModuleFunctions(src);
  const rule = module[name];
  const defs = Object.entries(module).filter(([k, v]) => k.startsWith(name));
  if (!rule && !defs.length)
    throw new ReferenceError(`"${src}" does not export rule "${name}".`);
  if (rule && !defs.length)
    return rule;
  return { rule, defs: Object.fromEntries(defs) };
}

async function loadDef(src, name) {
  const module = await getModuleFunctions(src);
  const def = module[name];
  if (def) return def;
  throw new ReferenceError(`"${src}" does not export "${name}".`);
}

const camelCase = str => str.replace(/-[a-z]/g, c => c[1].toUpperCase());
const PascalCase = str => str.replace(/^(_*[a-z])|-([a-z])/g, (_, a, c = a) => c.toUpperCase());

function defineReaction(name, module) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid definition name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Reactions.define(name, loadDef(src, value || camelCase(name)));
}

function defineTrigger(name, module) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid definition name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Triggers.define(name, loadDef(src, value || PascalCase(name)));
}

function defineReactionRule(name, module) {
  if (!name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/))
    throw new SyntaxError(`Invalid rule name: "${name}". name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Reactions.defineRule(name, loadRuleDefs(src, value || camelCase(name)));
}

function defineTriggerRule(name, module) {
  if (!name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/))
    throw new SyntaxError(`Invalid rule name: "${name}". name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    this.getRootNode().Triggers.defineRule(name, loadRuleDefs(src, value || PascalCase(name)));
}

function definePortal(name, module) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid portal name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries()) {
    const reaction = value || camelCase(name);
    const trigger = reaction.replace(/^_*[a-z]/, c => c.toUpperCase());
    this.getRootNode().Reactions.define(name, loadDef(src, reaction));
    this.getRootNode().Triggers.define(name, loadDef(src, trigger));
    this.getRootNode().Reactions.defineRule(name + "_", loadRuleDefs(src, reaction));
    this.getRootNode().Reactions.defineRule(name + ".", loadRuleDefs(src, reaction));
    this.getRootNode().Reactions.defineRule(name + "_", loadRuleDefs(src, reaction));
    this.getRootNode().Triggers.defineRule(name + "_", loadRuleDefs(src, trigger));
    this.getRootNode().Triggers.defineRule(name + ".", loadRuleDefs(src, trigger));
    this.getRootNode().Triggers.defineRule(name + "_", loadRuleDefs(src, trigger));
  }
}

//todo cannot end with .-_
export {
  defineReaction,
  defineTrigger,
  defineReactionRule,
  defineTriggerRule,
  definePortal,
  definePortal as "define"
}