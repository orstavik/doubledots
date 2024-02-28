// class NativeAttr /*extends CustomAttr*/ {
  // get passive() {
  //   return !(this.chain.indexOf("prevent"));
  // }

  export function * domEvents() {
    yield "touchstart";
    yield "touchmove";
    yield "touchend";
    yield "touchcancel";
    for (let prop in HTMLElement.prototype)
      if (prop.startsWith("on"))
        yield prop.substring(2);
    for (let prop in Element.prototype)
      if (prop.startsWith("on"))
        if (!(prop in HTMLElement.prototype))
          yield prop.substring(2);
  }

  export function * windowEvents() {
    for (let prop in window)
      if (prop.startsWith("on"))
        if (!(prop in HTMLElement.prototype))
          if (!(prop in Element.prototype))
            yield prop.substring(2);
  }

  export function * documentEvents() {
    for (let prop in Document.prototype)
      if (prop.startsWith("on"))
        if (!(prop in HTMLElement.prototype))
          if (!(prop in Element.prototype))
            if (!(prop in window))
              yield prop.substring(2);
  }

  //note! This map can be generated declaratively, on the server.
  // static allNativeEvents() {
  //   const res = {};
  //   for (let type of NativeAttr.domEvents()) {
  //     res[type] = NativeBubblingEvent;
  //     res["_" + type] = ShadowRootEvent;
  //   }
  //   for (let type of NativeAttr.documentEvents())
  //     res["_" + type] = NativeDocumentEvent;
  //   for (let type of NativeAttr.windowEvents())
  //     res["_" + type] = NativeWindowEvent;
  //   res["_domcontentloaded"] = NativeDCLEvent;
  //   return res;
  // }
// }