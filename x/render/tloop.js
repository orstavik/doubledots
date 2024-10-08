class LoopCube {
  constructor(old = [], now = [], childNodes, templateDocFrag) {
    this.old = old;
    this.now = now;
    this.ol = old.length ?? 0;
    this.nl = now.length ?? 0;
    this.template = templateDocFrag;
    this.tl = templateDocFrag.childNodes.length;
    this.rl = this.nl * this.tl;
    this.oldChildNodes = childNodes;
    this.nowChildNodes = new Array(this.rl);
    this.oldTodoCount = this.ol;
  }

  moveToRes(nowI, oldI) {
    this.nowChildNodes.splice(nowI * this.tl, this.tl, ...this.oldChildNodes.slice(oldI * this.tl, this.tl));
    oldI = null;
    this.oldTodoCount--;
  }

  reuse1to1() {
    for (let i = 0; this.oldTodoCount && i < this.nl; i++)
      for (let j = 0; j < this.ol; j++)
        if (this.now[i] === this.old[j]) {
          this.moveToRes(i, j);
          break;
        }
  }

  reuseOthers() {
    for (let i = 0; this.oldTodoCount && i < this.nl; i++)
      if (!res[i * this.tl])
        for (let j = 0; j < this.ol; j++)
          if (this.old[j]) {
            this.moveToResTask(i, j);
            this.task?.(i);
            break;
          }
  }

  removeUnusedOld() {
    for (let i = this.old.length - 1; this.oldTodoCount && i >= 0; i--)
      if (this.old[i] !== null)
        for (let start = i * tl, j = this.tl, _ = --this.oldTodoCount; j > 0; j--)
          this.oldChildNodes[start].remove();
  }

  addNewNows() {
    for (let i = 0; i < this.nl; i++) {
      if (!this.nowChildNodes[i * this.tl]) {
        const news = this.template.cloneNode(true);
        this.nowChildNodes.splice(i * this.tl, this.tl, ...news.childNodes);
        this.task?.(i);
      }
    }
  }
}

class LoopCubeAttr extends LoopCube {
  constructor(old, now, childNodes, templDocFrag, attr, qs) {
    super(old, now, childNodes, templDocFrag);
    this.attr = attr;
    this.qs = qs;
  }

  task(i) {
    for (let j = 0, start = i * this.tl; j < this.tl; j++)
      if (this.nowChildNodes[start + j].matches?.(this.qs))
        for (let a of this.nowChildNodes[start + j].attributes)
          if (this.attr.sameType(a))
            return a.value = this.now[i];
    //we don't need to set the value. we might just duplicate random template/text.
  }
}
/*
* If this doesn't have a template, we might be f..ed.
* The loop might swing to 0!! elements. 
* If that happens, then we would need to take the element *out* of the DOM.
* When we do that, we would need to put it inside a template. And that would be a problem.
* Since the doubledots would clean it up. So we can't do that.
* 
* I think therefore that the only way to do this is to use a template. At least for now.
* That way, we can get a piece of DOM where we can reconstruct the elements without causing
* lifecycle issues.
* 
* `p_prop:tloop_p.._qs`
* 
* :tloop_attr_qs, => _qs defaults to *, _attr defaults to "trigger:"
* p_list:tloop => set the p:= list value on the first element in the list.
*/

//naive because it assumes no external changes of:
//1. no adding/removing in the children list
//2. no change of the value of the children _attr value
//3. we assume that templ first argument has at least one element child, here we set the 

//todo trim the template to remove ws text nodes before and after the template.
function tloop_(rule) {
  //todo add rule syntax checks
  let [_, _attr, _qs] = rule.split("_")[1];
  _attr = _attr?.replaceAll("..", ":");
  _qs ??= "*";

  return function (docFrag,  now) {
    if (!Array.isArray(now))
      throw new Error("tloop #2 argument is not an array.");
    if (!(docFrag instanceof DocumentFragment) || !docFrag.children.length)
      throw new Error("tloop #1 argument must be a DocumentFragment with at least one child element.");

    const old = this.__loop_cache;
    this.__loop_cache = now;
    if (!now?.length)
      return this.ownerElement.innerHTML = "";

    const cube = new LoopCubeAttr(old, now, this.ownerElement.childNodes, docFrag, this, _qs);
    cube.reuse1to1();
    cube.reuseOthers();
    cube.removeUnusedOld();
    cube.addNewNows();
    this.ownerElement.append(...cube.nowChildNodes);
  };
}
document.Reactions.defineRule("tloop_", tloop_);