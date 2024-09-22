(function () {
  function fetch_(name) {
    const [_, type] = name.split("_");
    if (!["json", "text"].includes(type))
      throw new Error("Invalid fetch type: " + type);
    return async function fetchFunc() {
      return await (await fetch(this.value))[type]();
    };
  }

  /*
  * `p_:first-child:for_p.._of_property`
  */
  function for_(rule) {
    let [_, attrName, of, listName] = rule.split("_");
    attrName = attrName.replaceAll("..", ":");
    const previous = new WeakMap();
    return function (templ, { post }) {
      const now = post[listName];
      if (!Array.isArray(now) || !now.length) {
        this.ownerElement.innerHTML = "";
        previous.delete(this);
        return;
      }
      const el = this.ownerElement;
      templ = templ.content.children[0];
      const old = previous.get(this) || [];
      previous.set(this, now);

      const res = new Array(now.length);
      //1. reuse and clone identical values
      let ol = old.length;
      for (let i = 0; ol && i < now.length; i++) {
        let j;
        if ((j = old.indexOf(now[i])) >= 0) {      //100% reuse
          old[j] = null;
          res[i] = el.children[j];
          ol--;
        } else if (j = now.indexOf(now[i]) < i) { //clone identical
          res[i] = el.insertAdjacentClone("beforeend", res[i]);
        }
      }
      //2. reuse non-identical old children, or clone when missing
      for (let i = 0, j; i < res.length; i++) {
        if (!res[i]) {
          if ((j = old.findIndex(Boolean)) >= 0) {
            old[j] = null;
            res[i] = el.children[j];
            res[i].setAttribute(attrName, now[i]); //doing the update on the 
          } else {
            el.insertAdjacentClone("beforeend", templ, el => el.setAttribute(attrName, now[i]));
            res[i] = el.lastElementChild;
          }
        }
      }
      //3. remove extra old children
      for (let i = old.length - 1; i >= 0; i--)
        old[i] && this.children[i].remove();
      //4. sort
      for (let c of res)
        el.append(c);
    };
  }

  // document.Reactions.defineRule("for_", for_);
  document.Reactions.defineRule("fetch_", fetch_);
})();
