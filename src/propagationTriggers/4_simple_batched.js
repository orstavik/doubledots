(function (HTMLElement_p, Element_p, Document_p) {

  //depends on
  AttrListener, AttrListenerGlobal;

  let da;
  for (da of document.documentElement.attributes)
    if (da.trigger === "da")
      break;

  
  function complexListener(Listener) {
    return class ComplexListener extends Listener {
      get options() {
        return true;
      }

      run(e) {
        !this.isConnected && this.remove();
        stopProp.call(e);
        this.propagate(e);
      }

      propagate(e) {
        let path = e.composedPath();
        !e.composed && (path = this.fixNonComposedPaths(path));
        eventLoop.dispatch(e, ...this.getAttributes(e.type, path));
      }

      fixNonComposedPaths(path) {
        const res = [path[0]];
        let inSlot = 0;
        for (let i = 1; i < path.length; i++) {
          const prev = path[i - 1], node = path[i];
          node === prev.assignedSlot && inSlot++;
          node === prev.host && inSlot--;
          !inSlot && res.push(node);
        }
        return res;
      }

      getAttributes(type, path) {
        let globals;
        const res = [];
        for (let n of path) {
          if (n instanceof Element)
            for (let at of n.attributes)
              at.trigger === type && res.push(at);
          else if (n === window)
            if (globals = n.triggers?.get(type + "_"))
              res.push(...globals);
        }
        res.push(da); //adding the default-action attribute from <html>
        return res;
      }
    };
  }

  function typeSlice(Listener, start, end) {
    return class TypeSliceListener extends Listener {
      get type() {
        return this.trigger.slice(start, end);
      }
    };
  }

  const ElementListener =complexListener(AttrListener);
  const GlobalListener =typeSlice(complexListener(AttrListenerGlobal), 0, -1);

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

  for (let type of onElement) {
    document.Triggers.define(type, ElementListener);
    document.Triggers.define(type + "_", GlobalListener);
  }

})(DoubleDots?.nativeMethods || window, HTMLElement.prototype, Element.prototype, Document.prototype);

// <html default-action:reduce-default-action:run-default-action>
// we can add a special `default-action:reduceda:runda` attribute.
// this is immutable, you can't take it in/out.
// we can then add this default-action attribute to the end of the getAttributes() list, so to run at the end of the batch.


//todo how do we want this to 
document.Triggers.define("default-action", AttrImmutable);
document.Reactions.define("dd-filter-da", function (e) {
  //process the default actions to see if we should run any default actions
  return "something";
});
document.Reactions.define("dd-run-da", function (something) {
  //set null in the list
});
document.Reactions.define("nda", function (oi) {
  //set the string "nda" in the list
});
document.Reactions.define("prevent-default", function () { });
document.Reactions.define("da", function () {
  //set the attr in the list
});
document.documentElement.setAttribute("da:dd-filter-da:dd-run-da");
