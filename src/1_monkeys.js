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

  //setAttribute
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
    Element_p.getAttributeNode = deprecated.bind("Element.getAttributeNode");
    Element_p.setAttributeNode = deprecated.bind("Element.setAttributeNode");
    Element_p.removeAttributeNode = deprecated.bind("Element.removeAttributeNode");
    Element_p.getAttributeNodeNS = deprecated.bind("Element.getAttributeNodeNS");
    Element_p.setAttributeNodeNS = deprecated.bind("Element.setAttributeNodeNS");
    document.createAttribute = deprecated.bind("document.createAttribute");
  })(Element.prototype, document.createAttribute);

  //adding elements. Can only be done via innerHTML/outerHTML, but js methods still allow moving elements inside the same document while if they are connected to the DOM when they are moved.
  (function (Doc_p, Element_p, Node_p) {
    Doc_p.createElement = deprecated.bind("Document.prototype.createElement");
    Doc_p.createTextNode = deprecated.bind("Document.prototype.createElement");
    Doc_p.createDocumentFragment = deprecated.bind("Document.prototype.createDocumentFragment");
    Doc_p.importNode = deprecated.bind("Document.prototype.createElement");
    // Doc_p.createRange = deprecated.bind("Document.prototype.createRange"); //todo ivar research
    Doc_p.createComment = deprecated.bind("Document.prototype.createElement");
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
  })(Document.prototype);

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



/*
JavaScript provides a variety of methods for dynamically adding elements to the Document Object Model (DOM). These methods are available on different prototypes, such as Document, Element, and Node. Below is a categorized list of these functions based on the prototype they belong to:

Document Prototype
The Document object represents any web page loaded in the browser and serves as an entry point to the web page's content, which is the DOM tree.

createElement(tagName): Creates a new element with the given tag name.
createTextNode(data): Creates a new text node with the given data.
createDocumentFragment(): Creates a new, empty DocumentFragment into which DOM nodes can be added to build an offscreen DOM tree.
importNode(externalNode, deep): Imports a node from another document to this document.
createRange(): Creates a new Range object.
createComment(data): Creates a new comment node with the specified data.
Element Prototype
The Element interface represents an object within a document. This interface describes methods and properties common to all kinds of elements.

appendChild(newNode): Adds a new child node to the end of the list of children of a specified parent node.
insertBefore(newNode, referenceNode): Inserts a node before a reference node as a child of a specified parent node.
insertAdjacentElement(position, element): Inserts a given element node at a given position relative to the element it is invoked upon.
replaceChild(newChild, oldChild): Replaces one child node of the specified element with another.
Node Prototype
The Node interface is an abstract base class upon which many other DOM API objects are based, thus it might not directly appear in the DOM tree.

cloneNode(deep): Creates a duplicate of the node on which this method was called.
removeChild(child): Removes a child node from the DOM and returns the removed node.
DocumentFragment Prototype
DocumentFragment is a lightweight, minimal document object that can be used as a container to hold DOM elements in memory before appending them to a document.

No specific methods for adding elements directly, but you can use appendChild() and insertBefore() (inherited from Node) to add elements to the fragment before adding the fragment to the DOM.
*/