(function () {
  function fetch_(name) {
    const [_, type] = name.split("_");
    if (!["json", "text"].includes(type))
      throw new Error("Invalid fetch type: " + type);
    return async function fetchFunc() {
      return await (await fetch(this.value))[type]();
    };
  }

  document.Reactions.defineRule("fetch_", fetch_);
})();
