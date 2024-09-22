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

  const Specializers = {
    "cloneNode": [Node.prototype, DocumentFragment.prototype],
    "innerHTML": [Element.prototype, HTMLTemplateElement.prototype],
    "insertAdjacentHTML": [Element.prototype, HTMLTemplateElement.prototype],
  };
  for (let [m, [TOP, DOWN]] of Object.entries(Specializers))
    Object.defineProperty(DOWN, m, Object.getOwnPropertyDescriptor(TOP, m));

  const Element_innerHTML_OG = Object.getOwnPropertyDescriptor(Element_p, "innerHTML").set;
  const innerHTML_DD_el = function innerHTML_DD(val) {
    Element_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(...this.children); //todo untested fix from project
  };

  const ShadowRoot_innerHTML_OG = Object.getOwnPropertyDescriptor(ShadowRoot_p, "innerHTML").set;
  const innerHTML_DD_sr = function innerHTML_DD(val) {
    ShadowRoot_innerHTML_OG.call(this, val);
    AttrCustom.upgradeBranch(...this.children); //todo untested fix from project
  };

  const insertAdjacentHTMLOG = Element_p.insertAdjacentHTML;
  function insertAdjacentHTML_DD(position, ...args) {
    //todo test the different versions here
    let root, index;
    if (position === "afterbegin")
      root = this, index = 0;
    else if (position === "beforeend")
      root = this, index = this.children.length;
    else if (position === "beforebegin")
      root = this.parentNode, index = Array.prototype.indexOf.call(root.children, this);
    else if (position === "afterend")
      root = this.parentNode, index = Array.prototype.indexOf.call(root.children, this) + 1;
    const childCount = root.children.length;
    insertAdjacentHTMLOG.call(this, position, ...args);
    const addCount = root.children.length - childCount;
    const newRoots = Array.from(root.children).slice(index, index + addCount);
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

(function () {
  //todo we need the innerHTML and insertAdjacentHTML and setAttribute to be added to the nativeMethods.

  //JS injections is allowed when we
  //1) move elements within the same rootNode (no upgrade of AttrCustom)
  //2) move elements from one DocumentFragment to another (no upgrade of AttrCustom)
  //3) inject elements *from* DocumentFragments to an .isConnected element (DO upgrade of AttrCustom)
  //* otherwise just fail.
  function checkRoot(root, child, r = root.getRootNode(), cr = child?.getRootNode()) {
    if (!(child instanceof Element) || cr === r || (cr instanceof DocumentFragment && r instanceof DocumentFragment))
      return false;
    if (root.isConnected && cr instanceof DocumentFragment)
      return true;
    throw new DoubleDots.InsertElementFromJSError(root, child);

  }
  const EMPTY = [];
  function sameRootFirstArg(child) {
    return checkRoot(this, child) ? [child] : EMPTY;
  }
  function sameRootSecond(_, child) {
    return checkRoot(this, child) ? [child] : EMPTY;
  }
  function sameRootSpreadArg(...args) {
    const r = this.getRootNode();
    return args.filter(child => checkRoot(this, child, r));
  }

  const Mask = {
    "Element.prototype": {
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,
      insertAdjacentElement: sameRootSecond,
    },
    "Document.prototype": {
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,
    },
    "DocumentFragment.prototype": {
      appendChild: sameRootFirstArg,
      insertBefore: sameRootFirstArg,
      append: sameRootSpreadArg,
      prepend: sameRootSpreadArg,
    }
  };

  function monkeyPatch(proto, prop, value) {
    Object.defineProperty(proto, prop, {
      ...Object.getOwnPropertyDescriptor(proto, prop), value
    });
  }

  function verifyAndUpgrade(OG, verify) {
    return function (...args) {
      const upgrades = verify.call(this, ...args);
      const res = OG.apply(this, args);
      upgrades.length && AttrCustom.upgradeBranch(...upgrades);
      return res;
    };
  }

  for (let [path, objMask] of Object.entries(Mask)) {
    path = path.split(".");
    const obj = path.reduce((o, p) => o[p], window);
    const nativeObj = path.reduce((o, p) => o[p] ??= {}, DoubleDots.nativeMethods);
    for (let [prop, verifyMethod] of Object.entries(objMask)) {
      const OG = nativeObj[prop] = obj[prop];
      const newFunc = verifyAndUpgrade(OG, verifyMethod);
      monkeyPatch(obj, prop, newFunc);
    }
  }
})();

(function (aelOG) {
  if (document.readyState !== "loading")
    return AttrCustom.upgradeBranch(document.htmlElement);
  aelOG.call(document, "DOMContentLoaded", _ => AttrCustom.upgradeBranch(document.documentElement));
})(EventTarget.prototype.addEventListener);