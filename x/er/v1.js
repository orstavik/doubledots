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

  resolve(key, vars) {
    const res = Object.assign({}, vars, this.posts[key]);
    for (let p in res)
      if (res[p] instanceof Array)
        res[p] = res[p].map(k => this.resolve(k, vars));
    return res;
  }
}

let triggers = new DoubleDots.AttrWeakSet();

export class Er extends AttrCustom {
  upgrade() {
    triggers.add(this);
  }
}

export function erUpdate(posts) {
  const e = new Event("er");
  e.er = new ER(posts);
  eventLoop.dispatchBatch(e, triggers);
}