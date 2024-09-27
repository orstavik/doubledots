(function () {

  class DefMap {
    constructor(hashSearch) {
      if (!hashSearch)
        throw DoubleDots.SyntaxError("DoubleDot.Definition map missing in  url: " + url);
      hashSearch = hashSearch.entries?.() ?? hashSearch.split("&").map(s => s.split("="));
      for (let [name, value] of hashSearch) {
        const type = name[0] === name[0].toLowerCase() ? "Reactions" : "Triggers";
        const rule = name.endsWith("_") ? "Rule" : "";
        this[name] = { type, rule, value };
      }
    }
  };
  DoubleDots.DefMap = DefMap;

  async function getModuleProp(url, module, prop) {
    module = await module;
    if (!module || typeof module !== "object" && !(module instanceof Object))
      return definitionError(`Module is not an object: ${url}`);
    return module[prop] ?? module.default ?? definitionError(`No property "${prop}" in module: ${url}`);
  }

  async function define(url, root = this.ownerDocument) {
    const modulePromise = import(url);
    const defs = new DefMap((url.hash || url.search).slice(1));
    for (let [def, { type, rule, value }] of Object.entries(defs))
      root[type]["define" + rule](def, getModuleProp(url, modulePromise, value || def));
  };
  DoubleDots.define = define;

  DoubleDots.definitionError = function definitionError(err, fullname, rule, RuleFun) {
    err = new DoubleDots.AsyncDefinitionError(err, fullname, rule, RuleFun);
    document.documentElement.dispatchEvent(new ErrorEvent(err));
    return err;
  };

  //todo any define reactions should only be called :once.
  //todo if it is triggered many times, things will always error
  document.Reactions.define("define", function defineReaction() {
    const src = this.ownerElement.getAttribute("src");
    const base = src ? new URL(src, location) : location;
    define(new URL(this.value, base), this.ownerDocument);
  });
})();