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
  get [Event.data]() {
    return this.er;
  }
}

let lastPosts = {};
export function er(posts) {
  eventLoop.dispatchBatch(new ErEvent("er", lastPosts = posts), triggers);
}

export function erGet(){
  return new ER(lastPosts);
}