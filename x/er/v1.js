class ER {
  constructor(posts) {
    this.posts = posts;
  }

  * parents(ref, type, prop) {
    for (let [k, v] of Object.entries(this.posts))
      if (!type || k.startsWith(type))
        if (prop && Array.isArray(v[prop]) && v[prop].includes(ref))
          yield k;
  }

  parent(ref, type, prop) {
    return this.parents(ref, type, prop).next().value;
  }

  //todo this can loop forever, when we have a person with a friend 
  //     that has a friend that is the first person. This won't work.
  //
  //todo 1. we need to go width first.
  //todo 2. we need to check the path. If we are going from:
  //        person / [friends] / person / [friends]
  //        then we need to stop at the 2nd [friends].
  //        we should only resolve person[friends] relationship *once*.
  //        when we meet person[friends] 2nd time, we should just skip it.
  //        this means that when we meet "person" the second time, 
  //        we should skip all the arrays.
  resolve(key, vars) {
    const res = Object.assign({}, vars, this.posts[key]);
    for (let p in res)
      if (res[p] instanceof Array)
        res[p] = res[p].map(k => this.resolve(k, vars));
    return res;
  }
}


class ErTyped extends ER {

  //step 1
  static entitiesToTypeValue(posts) {
    const res = {};
    for (let id in posts) {
      const post = posts[id];
      const type = post.type;
      const entityType = res[type] ??= {};
      for (let prop in post) {
        const values = entityType[prop] ??= [];
        values.push(post[prop]);
      }
    }
    return res;
  }

  //step 2
  static extractTypeList(list) {
    const types = [...new Set(list.map(ErTyped.extractType))].sort();
    if (types.includes("text") && types.includes("textmd"))
      types.splice(types.indexOf("text"), 1);
    if (types.includes("int") && types.includes("float"))
      types.splice(types.indexOf("int"), 1);
    if (types[0].startsWith("list: ")) {
      let refs = types.map(t => t.slice(6).split(","));
      return [...new Set(refs.flat().filter(Boolean))];
    }
    if (types.length === 1)
      return types[0];
    debugger;
    throw new Error("should be fixed..");
  }

  static isMarkDown(value) {
    if (!(/[#*_~`]/.test(value)))
      return;
    const markdownPatterns = [
      /\*\*.*?\*\*/,         // bold (**text**)
      /\*.*?\*/,             // italics (*text*)
      /~~.*?~~/,             // strikethrough (~~text~~)
      /`.*?`/,               // inline code (`code`)
      /#+\s+.+/,             // headings (# heading, ## subheading, etc.)
      /\[.*?\]\(.*?\)/,      // links ([text](url))
      /!\[.*?\]\(.*?\)/,     // images (![alt](url))
      /^>\s+.+/m             // blockquotes (> quote)
    ];
    for (const pattern of markdownPatterns)
      if (pattern.test(value))
        return "textmd";
  }

  static extractType(value) {
    if (Array.isArray(value))
      return "list: " + [...new Set(value.map(str => str.split("/")[0]))].join(",");
    // if (typeof value === 'string' && !isNaN(Date.parse(value)))
    //   return "date";
    try {
      // only absolute urls
      // not relative urls. so "./hello.png" is not a url... todo
      if (decodeURI(new URL(value).href) === decodeURI(value)) return "url";
    } catch (_) { }
    if ((/^#([0-9A-F]{3}){1,2}$/i).test(value))
      return "color";
    if (Number(value) + "" === value)
      return "number";
    return ErTyped.isMarkDown(value) ?? "text";
  }

  static valuesToTypes(typeValueSchema) {
    const res = {};
    for (let type in typeValueSchema) {
      const entityType = res[type] = {};
      const propValues = typeValueSchema[type];
      for (let prop in propValues)
        entityType[prop] = ErTyped.extractTypeList(propValues[prop]);
    }
    return res;
  }

  //step 3 relations
  static topologicalSort(schemas, cp) {
    const sortedSchemas = [];
    const visited = new Set();
    const tempMarked = new Set();

    function visit(schema) {
      if (tempMarked.has(schema))
        throw new Error("Cycle detected, schema relationships form a loop.");
      if (!visited.has(schema)) {
        tempMarked.add(schema);
        const referencedSchemas = cp[schema] || new Set();
        for (const referred of referencedSchemas)
          visit(referred);
        tempMarked.delete(schema);
        visited.add(schema);
        sortedSchemas.push(schema);
      }
    }
    for (const schema in schemas)
      visit(schema);
    return sortedSchemas;
  }

  static bottomUpRelations(schemaType) {
    const res = {};
    for (let type in schemaType)
      for (let prop in schemaType[type])
        if (schemaType[type][prop] instanceof Array)
          for (let referred of schemaType[type][prop])
            (res[referred] ??= new Set()).add(type);
    return res;
  }

  get schemas() {
    const schemaTypeValues = ErTyped.entitiesToTypeValue(this.posts);
    const schemaTypedUnsorted = ErTyped.valuesToTypes(schemaTypeValues);
    const relationsUp = ErTyped.bottomUpRelations(schemaTypedUnsorted);
    const entitySequence = ErTyped.topologicalSort(schemaTypedUnsorted, relationsUp);
    return entitySequence.map(type => [type, schemaTypedUnsorted[type]]);
  }
}

export function er(posts) {
  return new ErTyped(posts);
}