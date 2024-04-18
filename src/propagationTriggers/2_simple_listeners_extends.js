class ElementTrigger extends CustomAttr {
  upgrade() {
    Object.defineProperty(this, "__l", { value: this.run.bind(this) });
    this.eventTarget.addEventListener(this.eventType, this.__l);
  }

  get eventType() {
    return this.trigger;
  }

  get eventTarget() {
    return this.ownerElement;
  }

  remove() {
    this.eventTarget.removeEventListener(this.eventType, this.__l);
    super.remove();
  }

  run(e) {
    this.isConnected ? eventLoop.dispatch(e, this) : this.remove();
  }
}

class WindowTrigger extends EventTrigger {
  get eventTarget() {
    return window;
  }
}

class DocumentTrigger extends EventTrigger {
  get eventTarget() {
    return document;
  }
}

class DCLTrigger extends DocumentTrigger {
  get eventType() {
    return "DOMContentLoaded";
  }
}

//method 2. JiT definitions, overriding TriggerMap

const nativeEventType = (function (HTMLElement_p, Element_, Document_p) {
  return function nativeEventType(type) {
    const prop = "on" + type;
    if (prop in HTMLElement_p || prop in Element_ ||
      ["touchstart", "touchmove", "touchend", "touchcancel"].indexOf(type) >= 0)
      return "element";
    if (prop in window)
      return "window";
    if (prop in Document_p)
      return "document";
    if (type === "domcontentloaded")
      return "domcontentloaded";
  };
})(HTMLElement.prototype, Element.prototype, Document.prototype);

class NativeEventDefinitionMap extends DoubleDots.DefinitionsMapUnknownAttr {

  define(name, Class) {
    if (nativeEventType(name))
      throw new DoubleDots.SyntaxError(`${name}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    return super.define(name, Class);
  }

  defineRule(prefix, FunClass) {
    if (nativeEventType(prefix))
      throw new DoubleDots.SyntaxError(`${prefix}: is a native event trigger for event type "${type}", it is builtin, you cannot define it.`);
    return super.defineRule(prefix, FunClass);
  }

  #builtinDefs(name) {
    const type = nativeEventType(name);
    const Def =
      type === "element" ? ElementTrigger :
        type === "document" ? DocumentTrigger :
          type === "window" ? WindowTrigger :
            type === "domcontentloaded" ? DCLTrigger :
              null;
    super.define(name, Def);
    return Def;
  }

  get(name) {
    return super.get(name) || this.#builtinDefs(name);
  }
}

Object.defineProperty(Document.prototype, "Triggers", {
  configurable: true,
  get: function () {
    const map = new NativeEventDefinitionMap();
    Object.defineProperty(this, "Triggers", { value: map, enumerable: true });
    return map;
  }
});