(function () {

  class Reference {
    constructor(url, name, value) {
      this.url = url;
      this.name = name;
      this.value = value || "";
      this.type = name.match(/^_*[A-Z]/) ? "Triggers" : "Reactions";
      this.rule = "define" + (name.endsWith("_") ? "Rule" : "");
    }

    async getDefinition() {
      const module = await import(this.url);
      if (!module || typeof module !== "object" && !(module instanceof Object))
        return definitionError(`URL is not an es6 module: ${this.url}`);
      if (this.value in module)
        return module[this.value];
      if (this.value)
        return definitionError(`ES6 module doesn't contain resource: ${this.value}`);
      return module[this.name] ?? module.default ?? definitionError(`ES6 module doesn't contain resource for name=value: ${this.name}=${this.value}`);
    }

    static *parse(url) {
      const hashSearch = (url.hash || url.search).slice(1);
      if (!hashSearch)
        throw DoubleDots.SyntaxError("DoubleDots.Reference not in url: " + url);
      const refs = hashSearch.entries?.() ?? hashSearch.split("&").map(s => s.split("="));
      for (let [name, value] of refs)
        yield new Reference(url, name, value);
    }
  }
  DoubleDots.Reference = Reference;

  async function define(url, root) {
    for (let ref of Reference.parse(url))
      root[ref.type][ref.rule](ref.name, ref.getDefinition());
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