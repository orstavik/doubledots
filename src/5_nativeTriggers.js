class WeakRefSet extends Set {

  add(at) {
    super.add(new WeakRef(at));
    return this;
  }

  delete(at) {
    for (let ref of super.values())
      if (ref.deref() === at)
        return super.delete(ref);
  }

  * iterate() {
    for (let ref of this) {
      const at = ref.deref();
      at?.isConnected ? yield at : super.delete(ref);
    }
  }
}

class NativeEventSyntaxErrorTrigger extends CustomAttr {
  upgrade(name) {
    throw `${name} is only a document or window event, and so cannot be listened for on the element itself.`;
  }
}

function makeNativeTriggerClasses(type, winDoc, globalsOnly) {

  const global = new WeakRefSet();
  const global_p = new WeakRefSet();
  const locals = new WeakMap();
  const locals_p = new WeakMap();

  function propagateAll(e) {
    const path = e.composedPath();
    const roots = path.filter(n => n instanceof ShadowRoot);

    for (let at of global.iterate())
      at.dispatchEvent(e);

    for (let i = roots.length - 1; i >= 0; i--)
      if (locals.has(roots[i]))
        for (let at of locals.get(roots[i]))
          at.dispatchEvent(e);

    path[0].dispatchEvent(e);

    for (let root of roots)
      if (locals.has(root))
        for (let at of locals_p.get(root))
          at.dispatchEvent(e);

    for (let at of global_p.iterate())
      at.dispatchEvent(e);
  }

  function propagateGlobals(e) {
    for (let at of global.iterate())
      at.dispatchEvent(e);
    for (let at of global_p.iterate())
      at.dispatchEvent(e);
  }

  const propagate = globalsOnly ? propagateGlobals : propagateAll;

  function runTriggers(e) {
    if (!this.isConnected)
      return this.remove();
    DoubleDots.native.stopImmediatePropagation.call(e);
    propagate(e);
  }


  class NativeEventTrigger extends CustomAttr {

    upgrade() {
      this.__l = runTriggers.bind(this);
      DoubleDots.native.addEventListener.call(this.ownerElement, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(this.ownerElement, type, this.__l, true);
      super.remove();
    }
  }

  class GlobalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      global.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      global.delete(this);
      super.remove();
    }
  }

  class PostGlobalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      global_p.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      global_p.delete(this);
      super.remove();
    }
  }

  class LocalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      let reg = locals.get(this.getRootNode());
      if (!reg)
        locals.set(this.getRootNode(), reg = new WeakRefSet());
      reg.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      locals.get(this.getRootNode()).delete(this);
      super.remove();
    }
  }

  class PostLocalTrigger extends CustomAttr {
    upgrade() {
      this.__l = runTriggers.bind(this);
      let reg = locals_p.get(this.getRootNode());
      if (!reg)
        locals_p.set(this.getRootNode(), reg = new WeakRefSet());
      reg.put(this);
      DoubleDots.native.addEventListener.call(winDoc, type, this.__l, true);
    }

    remove() {
      DoubleDots.native.removeEventListener.call(winDoc, type, this.__l, true);
      locals_p.get(this.getRootNode()).delete(this);
      super.remove();
    }
  }

  return { NativeEventTrigger, GlobalTrigger, PostGlobalTrigger, LocalTrigger, PostLocalTrigger };
}

  