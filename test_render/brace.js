function dotPathGet(dotPath, obj){
  for (let p of dotPath.split(".")) 
    if(!(obj = obj?.[p]))
      return obj === 0 ? obj : "";
  return obj;
}

function processBraces(txt, post){
  return txt.replace(/\{\{([^}{]+)\}\}/g, (_, expr) => dotPathGet(expr, post));
}

function* hostTasks(el){
  for(let {name, value} of el.attributes)
    if(value.indexOf("{{")>=0)
      yield (n, now) => n.setAttribute(name, processBraces(value, now));       
}

function* bodyTasks(el, skips = "template, [p\\:]", ii = []){
  for (let i = 0; i < el.childNodes.length; i++) {
    let n = el.childNodes[i];
    if (n instanceof Element) {
      if (n.matches(skips))
        continue;
      const ii2 = [...ii, i];
      for(let {name, value} of n.attributes)
        if(value.indexOf("{{")>=0)
          yield (n, now) => ii2.reduce((e,i)=>e.childNodes[i], n).setAttribute(name, processBraces(value, now));       
      yield* bodyTasks(n, skips, ii2);
    } else if (n instanceof Text) {
      const txt = n.textContent;
      const ii2 = [...ii, i];
      if(txt.indexOf("{{")>=0)
        yield (n, now) => ii2.reduce((e,i)=>e.childNodes[i], n).textContent = processBraces(txt, now);
    }
  }
}

function makeTasks(head, body){
  head = [...hostTasks(head)];
  body = [...bodyTasks(body)];
  const all = [...head, ...body];
  return { all, head, body };
}

function brace({post: now}){
  this.__tasks ??= makeTasks(this.ownerElement, this.ownerElement);
  for (let cb of this.__tasks.all)
    cb(this.ownerElement, now);
}

function tBrace(template, {post: now}){
  if(this.__tasks){
    for (let cb of this.__tasks.all)
      cb(this.ownerElement, now);
    return;
  }
  this.__tasks = makeTasks(this.ownerElement, template);
  this.ownerElement.textContent = null;
  for (let cb of this.__tasks.head)
    cb(this.ownerElement, now);
  const clone = template.cloneNode(true);
  for (let cb of this.__tasks.body)
    cb(clone, now);  
  this.ownerElement.append(clone);
}

document.Reactions.define("brace", brace);
document.Reactions.define("tbrace", tBrace);

function getHoistTemplate(el, name = el.tagName.toLowerCase()){
  let res = document.head.querySelector(`template[name="${name}"]`);
  if(res)
    return res;
  el = el.firstElementChild;
  if(!(el instanceof HTMLTemplateElement))
    return;
  el.setAttribute("name", name);
  document.head.append(el);
  return el;
}

function template(){
  return this.__template ??= getHoistTemplate(this.ownerElement)?.content;
}
document.Reactions.define("template", template);


//1. the p_: is triggered on every post change.
//2. the p: is still the passive owner of the data. This gives us cleaner and shorter reactions.
//3. brace can get only (data) or (template, data).
//3a. if only data, then simply run the braceAdvanced against the element.
//3b1. if template, we can have two situations: data is an array, then we will loop and clone in array
//3b2. else we will clone in template, while we change the content.

 
//2. if there is no input element, then  given
//1. we have a situation when the post changes, and then we get the template, and then we populate with a clone of that template. We mark us as oneTimeDone.
//We then remember that we have cloned a copy, and then we reuse that copy 