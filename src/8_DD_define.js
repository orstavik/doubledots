(function () {

  //:reaction, trigger:, :reactionrule_, triggerrule_
  //if no value, then the value is the same as the name -":".
  function parseDef(def, value) {
    const type = def[0] === ":" ? "Reactions" : def.slice(-1) === ":" ? "Triggers" : null;
    if (!type)
      throw new SyntaxError("Doubledot def missing start or end ':' " + def);
    const name = type === "Reactions" ? def.slice(1) : def.slice(0, -1);
    if (name.includes(":"))
      throw new SyntaxError("Doubledot def missing with 2 ':' " + def);
    return {
      type,
      rule: name.endsWith("_") ? "defineRule" : "define",
      name,
      resource: value || name
    };
  }

  //prefix,:reaction,trigger:,:rule
  //prefix,:reaction,trigger:,:rule=,,custom-trigger-name
  function parseGroupDef(def, value) {
    const [name, ...names] = def.split(",");
    const [v, ...values] = value?.split(",") || [];
    const defs = names.map((n, i) => parseDef(n, values[i]));
    return { type: "group", name, resource: v || def, defs };
  }

  function processDefs(n, v) {
    return !n.includes(",") ? parseDef(n, v) : parseGroupDef(n, v);
  }

  async function getGroupModule(url, module, group, prefix, root) {
    const groupFun = await getModuleProp(url, module, group);
    if(groupFun instanceof DoubleDots.AsyncDefinitionError)
      return groupFun;
    if(!(groupFun instanceof Function))
      return definitionError(`DefinitionGroup "${group}" is not a function: ${url}`);
    return groupFun(prefix, root);
  }

  async function getModuleProp(url, module, prop) {
    module = await module;
    if(!module || typeof module !== "object")
      return definitionError(`Module is not an object: ${url}`);
    return module[prop] ?? module.default ?? definitionError(`No property "${prop}" in module: ${url}`);
  }

  async function define(url, root = this.ownerDocument) {
    url = new URL(url, this.ownerElement.getAttribute("src") || window.location);
    //todo will change in an SPA, but the definition should be a :once anyway...
    const modulePromise = import(url);
    const defs = (url.hash ?? url.search).slice(1).split("&")
      .map(s => s.split("="))
      .map(nv => processDefs(...nv));
    for (let { type, name, rule, resource, defs: innerDefs } of defs) {
      if (type === "group") {
        const groupModule = getGroupModule(url, modulePromise, resource, name, root);
        let innerUrl = `${url}#${group}`;
        for (let { type: t, rule: ru, name: n, resource: re } of innerDefs)
          root[t][ru](n, getModuleProp(innerUrl, groupModule, re));
      }
      root[type][rule](name, getModuleProp(url, modulePromise, resource));
    }
  };

  DoubleDots.define = define;

  //todo untested, but strategy is good I think.
  DoubleDots.definitionError = function definitionError(err, fullname, rule, RuleFun) {
    err = new DoubleDots.AsyncDefinitionError(err, fullname, rule, RuleFun);
    document.documentElement.dispatchEvent(new ErrorEvent(err));
    return err;
  };

  document.Reactions.define("define", function defineReaction() {
    define.call(this, this.value, document);
  });
})();