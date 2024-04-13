(function () {
  function listNativeEvents(HTMLElementProto, ElementProto, DocumentProto) {
    function* nativeElementEvents() {
      yield* ["touchstart", "touchmove", "touchend", "touchcancel"];
      for (let prop in HTMLElementProto)
        if (prop.startsWith("on"))
          yield prop.slice(2);
      for (let prop in ElementProto)
        if (prop.startsWith("on"))
          if (!(prop in HTMLElementProto))
            yield prop.slice(2);
    };

    function* nativeWindowEvents() {
      for (let prop in window)
        if (prop.startsWith("on"))
          if (!(prop in HTMLElementProto))
            if (!(prop in ElementProto))
              yield prop.slice(2);
    };

    function* nativeDocumentEvents() {
      yield "DOMContentLoaded";
      for (let prop in DocumentProto)
        if (prop.startsWith("on"))
          if (!(prop in HTMLElementProto))
            if (!(prop in ElementProto))
              if (!(prop in window))
                yield prop.slice(2);
    };
    return { nativeElementEvents, nativeDocumentEvents, nativeWindowEvents };
  }
  Object.assign(Event, listNativeEvents(
    HTMLElement.prototype, Element.prototype, Document.prototype));
})();
