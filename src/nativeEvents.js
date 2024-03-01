window.domEvents = function* domEvents() {
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
};

window.windowEvents = function* windowEvents() {
  for (let prop in window)
    if (prop.startsWith("on"))
      if (!(prop in HTMLElement.prototype))
        if (!(prop in Element.prototype))
          yield prop.substring(2);
};

window.documentEvents = function* documentEvents() {
  for (let prop in Document.prototype)
    if (prop.startsWith("on"))
      if (!(prop in HTMLElement.prototype))
        if (!(prop in Element.prototype))
          if (!(prop in window))
            yield prop.substring(2);
};