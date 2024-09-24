(function () {

  class RootTrigger extends AttrListenerGlobal {
    get target() {
      return this.getRootNode();
    }
  }

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
        // eventLoop.dispatch(e, ...this.getAttributes(e.type, path));
        eventLoop.dispatchBatch(e, this.getAttributes(e.type, path));
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
        return [...downs, ...targets, ...elems, ...ups, da];
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

  const BubbleTrigger = complexListener(AttrListener);
  const TargetTrigger = typeSlice(complexListener(AttrListener), 0, -2);
  const PrePropTrigger = typeSlice(complexListener(AttrListenerGlobal), 1, 0);
  const PostPropTrigger = typeSlice(complexListener(AttrListenerGlobal), 0, -1);
  const PreRootTrigger = typeSlice(complexListener(RootTrigger), 2, 0);
  const PostRootTrigger = typeSlice(complexListener(RootTrigger), 0, -1);

  for (let type of DoubleDots.nativeEvents.element) {
    document.Triggers.define(type, BubbleTrigger);
    document.Triggers.define(type + "_t", TargetTrigger);
    document.Triggers.define("_" + type, PrePropTrigger);
    document.Triggers.define(type + "_", PostPropTrigger);
    document.Triggers.define("_." + type, PreRootTrigger);
    document.Triggers.define(type + ".", PostRootTrigger);
  }

})(DoubleDots?.nativeMethods || window);

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
document.documentElement.setAttribute(":dd-filter-da:dd-run-da");
