export function formdata_(rule) {
  const [, type] = rule.split("_");
  if (type === "json")
    return function formdata_json(form) {
      const obj = Object.create(null);
      for (const [key, value] of new FormData(form))
        !(key in obj) ? obj[key] = value :
          Array.isArray(obj[key]) ? obj[key].push(value) :
            obj[key] = [obj[key], value];
      return obj;
    };
  if (type === "urlencoded")
    return form => new URLSearchParams(new FormData(form));
  if(type === "multipart")
    return form => new FormData(form);
  if(type === "blob")
    return form => new Blob([new URLSearchParams(new FormData(form))], { type: "application/x-www-form-urlencoded" });
  throw new SyntaxError(`Invalid formdata type: ${type}. Must be "json" or "urlencoded".`);
}

export class Value extends AttrCustom {
  upgrade() {
    if (!this.ownerElement.getAttribute("name"))
      return;
    const proto = Object.getPrototypeOf(this.ownerElement);
    if ("value" in proto) { //or check against tagName of this.ownerElement
      return Object.defineProperty(this.ownerElement, "diffvalue", {
        get: function() { return this.value != this.defaultValue ? this.value: null },
        enumerable: true,
        configurable: true
      });
    }
    Object.defineProperty(this.ownerElement, "value", {
      get: function() { return [...this.children].filter(n => n.getAttribute("value")).map(n => n.getAttribute("value")) },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this.ownerElement, "defaultValue", {
      get: () => !this.value ? [] : this.value.split(","),
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this.ownerElement, "diffvalue", {
      get: function() { return JSON.stringify(this.value) != JSON.stringify(this.defaultValue) ? this.value: null },
      enumerable: true,
      configurable: true
    });
  }
  remove() {
    const proto = Object.getPrototypeOf(this.ownerElement);
    if ("value" in proto) //or check against tagName of this.ownerElement
      return;
    delete this.ownerElement.value;
    delete this.ownerElement.defaultValue;
  }
}
