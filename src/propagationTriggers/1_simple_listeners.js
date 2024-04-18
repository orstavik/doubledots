class WindowTrigger extends AttrListener {
  get target() {
    return window;
  }
}

class DocumentTrigger extends AttrListener {
  get target() {
    return document;
  }
}

class DCLTrigger extends DocumentTrigger {
  get type() {
    return "DOMContentLoaded";
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
    document.Triggers.define(type, AttrListener);
  for (let type of onWindow)
    document.Triggers.define(type, WindowTrigger);
  for (let type of onDocument)
    document.Triggers.define(type, DocumentTrigger);
  document.Triggers.define("domcontentloaded", DCLTrigger);

  //1. global element listeners: "_click" and "click_":
  class GlobalPreElementTrigger extends WindowTrigger {
    get type() {
      return this.trigger.slice(1); //removes the prefix "_"
    }
    get options() {
      return true;
    }
  }

  class GlobalPostElementTrigger extends WindowTrigger {
    get type() {
      return this.trigger.slice(-1); //removes the postfix "_"
    }
  }

  for (let type of onElement) {
    document.Triggers.define("_" + type, GlobalPreElementTrigger);
    document.Triggers.define(type + "_", GlobalPostElementTrigger);
  }

})(HTMLElement.prototype, Element.prototype, Document.prototype);

//2. custom events must be added as `AttrListener`.
document.Triggers.define("my-event", AttrListener);

//the problem here is that we struggle controlling the default action.
//if we only want to use the preventDefault(), then this is not a problem.
//but, if we need to add our own default actions, then this is a problem.