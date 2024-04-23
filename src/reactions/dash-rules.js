function dashOi(e, oi){
  if (oi instanceof Object)
    return new EventLoop.ReactionOrigin(oi);
  throw new DashReactionError(`"${oi}" is not an Object.`);
}

function attributeQuery(query, el){
  for (let a of el.attributes)
    if (a.name.replaceAll(":", "_").startsWith(query))
      return a;
}

function elQuerySelector(query){
  let [typeAttr, ...classes] = query.split(".");
  classes = classes.join(".");
  let [type, ...attr] = typeAttr.split(/(?<!_)_(?!_)/); 
  if(attr.length)
    attr = attr.map(a => a.split("__")).map(([n,v]) => v ? `[${n}="${v}"]`: `[${n}]`);
  return type + attr + classes;
}

function* upwardsIterator(el) {
  while (el instanceof Element) {
    yield el;
    el = el.parentNode;
  }
}

function* previousSiblingIterator(el) {
  while (el instanceof Element) {
    yield el;
    el = el.previousSiblingElement;
  }
}

// function* nextSiblingIterator(el) {
//   while (el instanceof Element) {
//     el = el.nextSiblingElement;
//     yield el;
//   }
// }

function upwardsNumber(number, root) {
  for (let i = 0; i < number; i++) {
    root = root.parentNode;
    if (!(root instanceof Element))
      throw new DashRuleError("iterating upwards index out of range");
  } 
  return root;
}

function dirQuerySelector(dir, elQuery) {
  const type = dir[0];
  const number = parseInt(dir.substring(1));
  
  if(type === "c") {
    const tail = isNaN(number) ? "" : `:nth-child(${number})`;
    const query = `:root > ${elQuery}${tail}`;
    return e => e.currentElement.querySelector(query);
  }
  if(type === "l") {
    const tail = isNaN(number) ? "" : `:nth-last-child(${number})`;
    const query = `:root > ${elQuery}${tail}`;
    return e => e.currentElement.querySelector(query);
  }
  if (type === "m") {
    if(isNaN(number) && !elQuery)
        return e => e.currentElement.previousSiblingElement;
    if(isNaN(number)/*&&elQuery*/){
      return function(e) {
        for (let p of previousSiblingIterator(e.currentElement.previousSiblingElement)) {
          if (!p)
            throw new DashRuleError("previousSibling direction with query didn't match");
          if (p.matches(elQuery))
            return p;
        }
        throw new DashRuleError("previousSibling direction with query didn't match");
      }
    }
    //todo not sure that the support for :has() is big enough for this to work yet..
    const plusStar = number > 0 ? '+*'.repeat(number) + '+' : '+';
    const query = `${elQuery}:has(${plusStar}:root)`;
    return e => e.currentElement.querySelector(query);
  }
  if (type === "n") {
    const plusStar = number > 0 ? '+*'.repeat(number) + '+' : '~';
    const query = `:root ${plusStar} ${elQuery}`;
    return e => e.currentElement.querySelector(query);
  }
  if (type === "p") {
    if ((isNaN(number) || number === 0) && !elQuery)
      return e => e.currentElement.parentNode;
    if(number && !elQuery){
      const func = upwardsNumber.bind(null, number);
      return e => func(e.currentElement.parentNode);
    }
    if(isNaN(number) && elQuery){
      return function(e) {
        for (let p of upwardsIterator(e.currentElement.parentNode)) {
          if (!p || !(p instanceof Element))
            throw new DashRuleError("parent direction with query didn't match");
          if (p.matches(elQuery))
            return p;
        }
      }
    }
    if(!isNaN(number) && elQuery){
      const func = upwardsNumber.bind(null, number);
      return function(e){
        const el = func(e.currentElement.parentNode);
        if(el.matches(elQuery))
          return el;
        throw new DashRuleError("parent direction with number and query didn't match");
      }
    }
  }
  if (type === "t") {
    if ((isNaN(number) || number === 0) && !elQuery)
      return e => e.target;
    if(number && !elQuery){
      const func = upwardsNumber.bind(null, number);
      return e => func(e.target);
    }
    if(isNaN(number) && elQuery){
      return function(e) {
        for (let p of upwardsIterator(e.target)) {
          if (!p || !(p instanceof Element))
            throw new DashRuleError("parent direction with query didn't match");
          if (p.matches(elQuery))
            return p;
        }
      }
    }
    if(!isNaN(number) && elQuery){
      const func = upwardsNumber.bind(null, number);
      return function(e){
        const el = func(e.target);
        if(!el.matches(elQuery))
          return el;
        throw new DashRuleError("parent direction with number and query didn't match");
      }
    }
  }
}

//todo memoize dashRule function
customReactions.defineRule("-", function dashRule(name) {
  if (name==="")
    return e => new EventLoop.ReactionOrigin(e.currentElement);
  // if (name==="-") There is an opening for `:--`
  //   return e => new EventLoop.ReactionOrigin(Free_notYetInUse);
  if (name==="--") 
    return e => new EventLoop.ReactionOrigin(e.currentAttribute);
  if (name===".") 
    return e => new EventLoop.ReactionOrigin(e);
  if (name==="..")
    return dashOi;
  
  //direct attribute query
  if (name.startsWith("--")){
    const funAttr = attributeQuery.bind(null, name.substring(2));
    return e => funAttr(e.currentElement);
  }
  
  const [dirEl, attr] = name.split("---");
  const funAttr = attr ? attributeQuery.bind(null, attr) : undefined;
  const [dir, el] = dirEl.split("--");
  if(!dir)
    return e => e.currentElement.querySelector("elQuery");
  const elQS = elQuerySelector(el);
  const funQS = dirQuerySelector(dir, elQS);
  
  return function dashReaction(e, oi){
    let o = e.currentElement;
    funQS && (o = funQS(e));
    if (!o)
      throw new DashRuleException("element not found");
    funAttr && (o = funAttr(o));
    if (!o)
      throw new DashRuleException("attribute not found");
    return new EventLoop.ReactionOrigin(o);
  }
});