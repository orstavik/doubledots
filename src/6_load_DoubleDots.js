// const state = [...document.querySelectorAll("*")];
//1. Since the DoubleDots is the only script.
//   The DoubleDots then runs so, we can just iterate on the main document.
//   Listen for the native DCL, and then upgrade the branch of the document.
//2. the adding HTML template methods. innerHTML + insertAdjacentHTML.
//3. setAttribute.
//   remember to disallow override-x attribute names immutable. Anything that starts with `override-` is illegal from setAttribute? yes.
//4. AttrUnknown upgradeUpgrade
//   1. It can only happen when new Trigger Defs are added to the main document.Triggers. 
//      This is because the shadowRoot.Triggers are locked post register time.
//5. WaitForItAttr. Promise Definitions.

function monkeyPatchSetter(proto, prop, fun) {
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  desc.set = fun;
  Object.defineProperty(proto, prop, desc);
}

function monkeyPatch(proto, prop, fun) {
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  desc.value = fun;
  Object.defineProperty(proto, prop, desc);
}


(function (Element_p, ShadowRoot_p) {


  const Element_innerHTML_OG = Object.getOwnPropertyDescriptor(Element_p, "innerHTML").set;
  const innerHTML_DD_el = function innerHTML_DD(val) {
    Element_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(this);
  };

  const ShadowRoot_innerHTML_OG = Object.getOwnPropertyDescriptor(ShadowRoot_p, "innerHTML").set;
  const innerHTML_DD_sr = function innerHTML_DD(val) {
    ShadowRoot_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(this);
  };

  const insertAdjacentHTMLOG = Element_p.insertAdjacentHTML;
  function insertAdjacentHTML_DD(position, ...args) {
    //red bug!
    console.log("bob");
    const root = position === "beforebegin" || position === "afterend" ? this.parentNode : this;
    const index = root.children.indexOf(this);
    const length = root.children.length;
    insertAdjacentHTMLOG.call(this, position, ...args);
    const length2 = root.children.length;
    const added = length2 - length;
    const newRoots = root.children.slice(index, length); //, added);? not length?
    AttrCustom.upgradeBranch(...newRoots);
  }

  const setAttributeOG = Element_p.setAttribute;
  const getAttributeNodeOG = Element_p.getAttributeNode;
  function setAttribute_DD(name, value) {
    //0. syntax error for "override-"
    if (name.startsWith("override-"))
      throw new SyntaxError("You can only set [override-xyz] attributes on elements in HTML template: " + name);
    //1. treat the normal normal
    if (!name.includes(":"))
      return setAttributeOG.call(this, name, value);
    //2. if the name is 
    let at = getAttributeNodeOG.call(this, name);
    if (at) {
      at.value = value;
      return;
    }
    setAttributeOG.call(this, name, value);
    at = getAttributeNodeOG.call(this, name);
    AttrCustom.upgrade(at);
  }

  monkeyPatchSetter(Element_p, "innerHTML", innerHTML_DD_el);
  monkeyPatchSetter(ShadowRoot_p, "innerHTML", innerHTML_DD_sr);
  monkeyPatch(Element_p, "insertAdjacentHTML", insertAdjacentHTML_DD);
  monkeyPatch(Element_p, "setAttribute", setAttribute_DD);
})(Element.prototype, ShadowRoot.prototype);

(function (aelOG) {
  if (document.readyState !== "loading")
    return AttrCustom.upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", _ => AttrCustom.upgradeBranch(document.documentElement));
})(DoubleDots.nativeMethods.EventTarget.prototype.addEventListener);