(function (nativeMethods, HTMLElement_p, Element_p, Document_p) {

  const registers = new WeakMap();
  function getRegister(node, type) {
    let dict = registers.get(node);
    !dict && registers.set(node, dict = {});
    return dict[type] ??= DoubleDots.AttrWeakSet();
  }

  class GlobalTrigger extends CustomAttr {

    get target() {
      throw "GlobalTrigger is just an Interface, you must extends GlobalTrigger and override 'get target(){...}'.";
    }

    upgrade() {
      Object.defineProperty(this, "__l", { value: this.run.bind(this) });
      this.target.addEventListener(this.trigger, this.__l);
      getRegister(this.target, this.trigger).add(this);
    }

    remove() {
      getRegister(this.target, this.trigger).delete(this);
      this.target.removeEventListener(this.trigger, this.__l);
      super.remove();
    }

    run(e) {
      if (!this.isConnected)
        return this.remove();
      nativeMethods.Event.prototype.stopImmediatePropagation.call(e);
      eventLoop.dispatch(e, ...getRegister(this.target, this.trigger));
    }
  }

  class WindowTrigger extends GlobalTrigger {
    get target() {
      return window;
    }
  }

  class DocumentTrigger extends GlobalTrigger {
    get target() {
      return document;
    }
  }

  class DCLTrigger extends DocumentTrigger {
    get trigger() {
      return "DOMContentLoaded";
    }
  }

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

  // for (let type of onElement)
  //   document.Triggers.define(type, ElementTrigger);
  for (let type of onWindow)
    document.Triggers.define(type, WindowTrigger);
  for (let type of onDocument)
    document.Triggers.define(type, DocumentTrigger);
  document.Triggers.define("domcontentloaded", DCLTrigger);

})(DoubleDots?.nativeMethods || window, HTMLElement.prototype, Element.prototype, Document.prototype);
