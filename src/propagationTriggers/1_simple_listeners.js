class WindowTrigger extends CustomAttr {
  upgrade() {
    Object.defineProperty(this, "__l", { value: this.run.bind(this) });
    window.addEventListener(this.trigger, this.__l);
  }

  remove() {
    window.removeEventListener(this.trigger, this.__l);
    super.remove();
  }

  run(e) {
    this.isConnected ? eventLoop.dispatch(e, this) : this.remove();
  }
}

class DocumentTrigger extends CustomAttr {
  upgrade() {
    Object.defineProperty(this, "__l", { value: this.run.bind(this) });
    document.addEventListener(this.trigger, this.__l);
  }

  remove() {
    document.removeEventListener(this.trigger, this.__l);
    super.remove();
  }

  run(e) {
    this.isConnected ? eventLoop.dispatch(e, this) : this.remove();
  }
}

class DCLTrigger extends CustomAttr {
  upgrade() {
    Object.defineProperty(this, "__l", { value: this.run.bind(this) });
    document.addEventListener("DOMContentLoaded", this.__l);
  }

  remove() {
    document.removeEventListener("DOMContentLoaded", this.__l);
    super.remove();
  }

  run(e) {
    this.isConnected ? eventLoop.dispatch(e, this) : this.remove();
  }
}

class ElementTrigger extends CustomAttr {
  upgrade() {
    Object.defineProperty(this, "__l", { value: this.run.bind(this) });
    this.ownerElement.addEventListener(this.trigger, this.__l);
  }

  remove() {
    this.ownerElement.removeEventListener(this.trigger, this.__l);
    super.remove();
  }

  run(e) {
    this.isConnected ? eventLoop.dispatch(e, this) : this.remove();
  }
}

//method 1. for registering all the native event types.
//          as long as there is no higher-order functions, this should work fine.
const nativeEventType = (function (HTMLElement_p, Element_p, Document_p) {
  function extractHandlerNames(obj) {
    return new Set(
      Object.keys(obj)
        .filter(k => k.startsWith("on"))
        .map(k => k.substring(2).toLowerCase())
    );
  }

  let onElement = extractHandlerNames(Element_p);
  const onHTMLElement = extractHandlerNames(HTMLElement_p);
  const nonHandler = new Set([
    "touchstart", "touchmove", "touchend", "touchcancel"
  ]);
  let onDocument = extractHandlerNames(Document_p);
  let onWindow = extractHandlerNames(window);

  onElement = onElement.union(onHTMLElement).union(nonHandler);
  onWindow = onWindow.difference(onElement);
  onDocument = onDocument.difference(onElement).difference(onWindow);

  for (let type of onElement)
    document.Triggers.define(type, ElementTrigger);
  for (let type of onWindow)
    document.Triggers.define(type, WindowTrigger);
  for (let type of onDocument)
    document.Triggers.define(type, DocumentTrigger);
  document.Triggers.define("domcontentloaded", DCLTrigger);

})(HTMLElement.prototype, Element.prototype, Document.prototype);
