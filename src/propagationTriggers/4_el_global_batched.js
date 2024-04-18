(function (HTMLElement_p, Element_p, Document_p) {

  //depends on
  AttrListener, AttrListenerGlobal, AttrListenerRoot;

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
        const type_t = type + "_t";
        const _type = "_" + type;
        const __type = "_." + type;
        const type_ = type + "_";
        const type__ = type + ".";
        const elems = [], downs = [], ups = [], targets = [];
        let slotLevel = 0, prev;
        for (let n of path) {
          if (n instanceof Element) {
            for (let at of n.attributes)
              at.trigger === type && elems.push(at);
            if (prev?.assignedSlot === n) /*n instanceof HTMLSlotElement &&*/
              slotLevel++;
            if (prev?.host === n)  /*prev instanceof ShadowRoot &&*/
              if (slotLevel)
                slotLevel--;
              else 
                targets.unshift(
                  ...Array.prototype.filter.call(n.attributes, at => at.trigger === type_t));
          }
          else {
            const pre = n.triggers?.get(n === window ? _type : __type);
            const post = n.triggers?.get(n === window ? type_ : type__);
            pre && downs.unshift(...pre);
            post && ups.push(...post);
          }
          prev = n;
        }
        //todo here we need to add the defaultAction trigger somewhere.
        return [...downs, ...targets, ...elems, ...ups];
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


  const Listeners = {
    "click": complexListener(AttrListener),
    "click_t": typeSlice(complexListener(AttrListener), 0, -2),

    "_click": typeSlice(complexListener(AttrListenerGlobal), 1, 0),
    "click_": typeSlice(complexListener(AttrListenerGlobal), 0, -1),
    "_.click": typeSlice(complexListener(AttrListenerRoot), 2, 0),
    "click.": typeSlice(complexListener(AttrListenerRoot), 0, -1),
  };

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
    document.Triggers.define(type, Listeners["click"]);
    document.Triggers.define(type + "_t", Listeners["click_t"]);
    document.Triggers.define("_" + type, Listeners["_click"]);
    document.Triggers.define(type + "_", Listeners["click_"]);
    document.Triggers.define("_." + type, Listeners["click"]);
    document.Triggers.define(type + ".", Listeners["click."]);
  }

})(DoubleDots?.nativeMethods || window, HTMLElement.prototype, Element.prototype, Document.prototype);

// <html default-action:reduce-default-action:run-default-action>
// we can add a special `default-action:reduceda:runda` attribute.
// this is immutable, you can't take it in/out.
// we can then add this default-action attribute to the end of the getAttributes() list, so to run at the end of the batch.