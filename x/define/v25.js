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

function RestrictedTriggerDefinition(src, name) {
  const msg = `"${src}" does not export a rule with prefix: "${name}" and therefore cannot create trigger: `;
  return class RestrictedTriggerDefinition extends AttrCustom {
    upgrade() { throw new ReferenceError(msg + this.trigger); }
  };
}

async function loadRuleDefs(src, name) {
  const module = await getModuleFunctions(src);
  const rule = module[name] ?? RestrictedTriggerDefinition(src, name);
  const defs = Object.entries(module).filter(([k]) => k.startsWith(name));
  return !defs.length ? rule : { rule, defs: Object.fromEntries(defs) };
}

async function loadDef(src, name) {
  const module = await getModuleFunctions(src);
  const def = module[name];
  if (def) return def;
  throw new ReferenceError(`"${src}" does not export "${name}".`);
}

const camelCase = str => str.replace(/-[a-z]/g, c => c[1].toUpperCase());
const PascalCase = str => str.replace(/^(_*[a-z])|-([a-z])/g, (_, a, c = a) => c.toUpperCase());

function define(register, name, Def) {
  if (!name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/))
    throw new SyntaxError(`Invalid definition name: "${name}". name.match(/^_*[a-z]([a-z0-9_.-]*[a-z])?$/)`);
  register.define(name, Def);
}

function defineRule(register, name, Def) {
  if (!name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/))
    throw new SyntaxError(`Invalid rule name: "${name}". name.match(/^_*[a-z][a-z0-9_.-]*[_.-]$/)`);
  register.defineRule(name, Def);
}

function defineReaction(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    define(this.getRootNode().Reactions, name, loadDef(src, value || camelCase(name)));
}

function defineTrigger(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    define(this.getRootNode().Triggers, name, loadDef(src, value || PascalCase(name)));
}

function defineReactionRule(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    defineRule(this.getRootNode().Reactions, name, loadRuleDefs(src, value || camelCase(name)));
}

function defineTriggerRule(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries())
    defineRule(this.getRootNode().Triggers, name, loadRuleDefs(src, value || PascalCase(name)));
}

function definePortal(name, module) {
  const { src, params } = srcAndParams(this, name, module);
  for (let [name, value] of params.entries()) {
    const reaction = value || camelCase(name);
    const trigger = reaction.replace(/^_*[a-z]/, c => c.toUpperCase());
    const REACTIONS = this.getRootNode().Reactions;
    const TRIGGERS = this.getRootNode().Triggers;
    define(REACTIONS, name, loadDef(src, reaction));
    define(TRIGGERS, name, loadDef(src, trigger));
    defineRule(REACTIONS, name + "-", loadRuleDefs(src, reaction));
    defineRule(REACTIONS, name + ".", loadRuleDefs(src, reaction));
    defineRule(REACTIONS, name + "_", loadRuleDefs(src, reaction));
    defineRule(TRIGGERS, name + "-", loadRuleDefs(src, trigger));
    defineRule(TRIGGERS, name + ".", loadRuleDefs(src, trigger));
    defineRule(TRIGGERS, name + "_", loadRuleDefs(src, trigger));
  }
}

export {
  defineReaction,
  defineTrigger,
  defineReactionRule,
  defineTriggerRule,
  definePortal as "define"
}