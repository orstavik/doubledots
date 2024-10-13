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

  //todo this can loop forever, when we have a person with a friend that has a friend that is the first person. This won't work.
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

class ErEvent extends Event {
  constructor(type, er) {
    super(type);
    this.er = new ER(er);
  }
}

export function er(posts) {
  eventLoop.dispatchBatch(new ErEvent("er", posts), triggers);
}