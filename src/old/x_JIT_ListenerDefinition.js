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

class NativeEventDefinitionMap extends DoubleDots.DefinitionsMapAttrUnknown {

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
      type === "element" ? AttrListener :
        type === "window" ? WindowTrigger :
          type === "document" ? DocumentTrigger :
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

//The just-in-time TriggerDefinitionsMap is unnecessary. As the definitions in the simple method is just a set of string to reused object references, then jit can KISS my ass.