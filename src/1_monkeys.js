(function () {
  function deprecated() {
    throw `${this}() is deprecated`;
  }

  function monkeyPatch(proto, prop, monkey) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    desc.value = monkey;
    Object.defineProperty(proto, prop, desc);
  }

  function monkeyPatchSetter(proto, prop, monkey) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    desc.set = monkey;
    Object.defineProperty(proto, prop, desc);
  }

  //remaining methods
  //setAttribute, getAttribute, hasAttribute, getAttributeNode
  (function (Element_p, documentCreateAttributeOG) {
    const setAttributeNodeOG = Element_p.setAttributeNode;
    const setAttributeOG = Element_p.setAttribute;

    function setAttributeMonkey(name, value) {
      value === undefined ?
        setAttributeNodeOG.call(this, documentCreateAttributeOG.call(document, name)) :
        setAttributeOG.call(this, name, value);
    }
    monkeyPatch(Element_p, "setAttribute", setAttributeMonkey);

    Element_p.hasAttributeNS = deprecated.bind("Element.hasAttributeNS");
    Element_p.getAttributeNS = deprecated.bind("Element.getAttributeNS");
    Element_p.setAttributeNS = deprecated.bind("Element.setAttributeNS");
    Element_p.removeAttributeNS = deprecated.bind("Element.removeAttributeNS");
    Element_p.setAttributeNode = deprecated.bind("Element.setAttributeNode");
    Element_p.removeAttributeNode = deprecated.bind("Element.removeAttributeNode");
    Element_p.getAttributeNodeNS = deprecated.bind("Element.getAttributeNodeNS");
    Element_p.setAttributeNodeNS = deprecated.bind("Element.setAttributeNodeNS");
    document.createAttribute = deprecated.bind("document.createAttribute");
  })(Element.prototype, document.createAttribute);

  //adding elements. Can only be done via innerHTML/outerHTML, but js methods still allow moving elements inside the same document while if they are connected to the DOM when they are moved.
  (function (Document_p, Element_p, Node_p) {
    Document_p.createElement = deprecated.bind("Document.prototype.createElement");
    Document_p.createTextNode = deprecated.bind("Document.prototype.createElement");
    Document_p.createDocumentFragment = deprecated.bind("Document.prototype.createDocumentFragment");
    Document_p.importNode = deprecated.bind("Document.prototype.createElement");
    // Doc_p.createRange = deprecated.bind("Document.prototype.createRange"); //todo ivar research
    Document_p.createComment = deprecated.bind("Document.prototype.createElement");
    Node_p.cloneNode = deprecated.bind("Node.prototype.cloneNode");

    const msg = "can only *move* elements within the same document, not append previously removed elements OR elements from another document";

    //todo append/prepend

    const appendChildOG = Element_p.appendChild;
    function appendChildMonkey(aChild) {
      const root = this.getRoot();
      if (aChild.getRoot() !== root)
        throw new SyntaxError("appendChild " + msg);
      appendChildOG.call(this, aChild);
    }
    monkeyPatch(Element_p, "appendChild", appendChildMonkey);

    const insertAdjacentElementOG = Element_p.insertAdjacentElement;
    function insertAdjacentMonkey(position, element) {
      const root = this.getRoot();
      if (root !== element.getRoot())
        throw new SyntaxError("insertAdjacentElement " + msg);
      insertAdjacentElementOG.call(this, position, element);
    }
    monkeyPatch(Element_p, "insertAdjacentElement", insertAdjacentMonkey);

    const replaceChildOG = Element_p.replaceChild;
    function replaceChildMonkey(newChild, oldChild) {
      const root = this.getRoot();
      if (root !== newChild.getRoot())
        throw new SyntaxError("replaceChild " + msg);
      replaceChildOG.call(this, newChild, oldChild);
    }
    monkeyPatch(Element_p, "replaceChild", replaceChildMonkey);

    const insertBeforeOG = Node_p.insertBefore;
    function insertBeforeMonkey(newNode, referenceNode) {
      const root = this.getRoot();
      if (root !== newNode.getRoot())
        throw new SyntaxError("insertBefore " + msg);
      insertBeforeOG.call(this, newNode, referenceNode);
    }
    monkeyPatch(Node_p, "insertBefore", insertBeforeMonkey);

    //append+prepend
    const appendOGe = Element_p.append;
    const prependOGe = Element_p.prepend;
    function appendMonkeyE(...elements){
      const root = this.getRoot();
      for (let el of elements) 
        if (root !== el.getRoot())
          throw new SyntaxError("append " + msg);
      appendOGe.call(this, ...elements);
    }
    function prependMonkeyE(...elements){
      const root = this.getRoot();
      for (let el of elements) 
        if (root !== el.getRoot())
          throw new SyntaxError("prepend " + msg);
      prependOGe.call(this, ...elements);
    }
    monkeyPatch(Element_p, "append", appendMonkeyE);
    monkeyPatch(Element_p, "prepend", prependMonkeyE);

    const appendOGd = Document_p.append;
    const prependOGd = Document_p.prepend;
    function appendMonkeyD(...elements){
      const root = this.getRoot();
      for (let el of elements) 
        if (root !== el.getRoot())
          throw new SyntaxError("append " + msg);
      appendOGd.call(this, ...elements);
    }
    function prependMonkeyD(...elements){
      const root = this.getRoot();
      for (let el of elements) 
        if (root !== el.getRoot())
          throw new SyntaxError("prepend " + msg);
      prependOGd.call(this, ...elements);
    }
    monkeyPatch(Document_p, "append", appendMonkeyD);
    monkeyPatch(Document_p, "prepend", prependMonkeyD);

    const appendOGdf = DocumentFragment_p.append;
    const prependOGdf = DocumentFragment_p.prepend;
    function appendMonkeyDF(...elements){
      const root = this.getRoot();
      for (let el of elements) 
        if (root !== el.getRoot())
          throw new SyntaxError("append " + msg);
      appendOGdf.call(this, ...elements);
    }
    function prependMonkeyDF(...elements){
      const root = this.getRoot();
      for (let el of elements) 
        if (root !== el.getRoot())
          throw new SyntaxError("prepend " + msg);
      prependOGdf.call(this, ...elements);
    }
    monkeyPatch(DocumentFragment_p, "append", appendMonkeyDF);
    monkeyPatch(DocumentFragment_p, "prepend", prependMonkeyDF);

  })(Document.prototype, Element.prototype, Node.prototype);

  //shadowRoots => "open". Necessary to capture the full composedPath of customEvents.
  (function (HTMLElement_p) {
    const attachShadowOG = HTMLElement_p.attachShadow;
    function attachShadowMonkey(options) {
      (options ??= {}).mode = "open";
      return attachShadowOG.call(this, options);
    }
    monkeyPatch(HTMLElement_p, "attachShadow", attachShadowMonkey);

    //there is no need to explicitly deprecate adoptionCallback. Hard to do, require a check in the constructor, slow and cumbersome.
  })(HTMLElement.prototype);

  //document.write()
  (function (d) {
    d.write = deprecated.bind("document.write");
  })(document);

  //Event.stopPropagation()
  (function (Event_p) {
    Event_p.stopPropagation = deprecated.bind("Event.stopPropagation");
    Event_p.stopImmediatePropagation = deprecated.bind("Event.stopImmediatePropagation");
  })(Event.prototype);
})();

