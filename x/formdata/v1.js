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