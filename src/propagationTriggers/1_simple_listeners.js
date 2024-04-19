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

//global pre-propagation listener: "_click"
class PrePropTrigger extends WindowTrigger {
  get type() {
    return this.trigger.slice(1); //remove prefix "_click"
  }
  get options() {
    return true;
  }
}

//global post-propagation listener: "click_"
class PostPropTrigger extends WindowTrigger {
  get type() {
    return this.trigger.slice(-1); //remove postfix "click_"
  }
}

const nativeEventType = (function () {

  for (let type of DoubleDots.nativeEvents.element) {
    document.Triggers.define(type, AttrListener);
    document.Triggers.define("_" + type, PrePropTrigger);
    document.Triggers.define(type + "_", PostPropTrigger);
  }
  for (let type of DoubleDots.nativeEvents.window)
    document.Triggers.define(type, WindowTrigger);
  for (let type of DoubleDots.nativeEvents.document)
    document.Triggers.define(type, DocumentTrigger);
  document.Triggers.define("domcontentloaded", DCLTrigger);

})();

/**

## HowTo: use `custom-event`s in this SimplePropagation setup?

To `dispatch` and listen for a `custom-event` using SimplePropagation, 
you must first and only register their triggers:

1. If you only wish to have normal bubble triggers for them, you only register their bubble triggers.
```js
  document.Triggers.define("custom-event", AttrListener);  
```

2. If you wish the event to be a global, you register it as a WindowTrigger.
```js
  document.Triggers.define("custom-global-event", WindowTrigger);  
```
3. If you wish the event to be global, and you want to use pre- and post-propagation triggers, register all needed triggers.
```js
    document.Triggers.define("custom-event", AttrListener);
    document.Triggers.define("_custom-event", PrePropTrigger);
    document.Triggers.define("custom-event_", PostPropTrigger);
```

## DefaultActions, `stopPropagation()` and SimplePropagation

The SimplePropagation setup enables you to use native default actions normally.
This means that you can call `e.preventDefault()` within any reaction chain for that event.

DoubleDots recommend *against* using `e.stopPropagation()` and `e.stopImmediatePropagation()`. But when you use SimplePropagation, you can allow stopPropagation().

## Performance and consistency

SimplePropagation follows the same logic as native event listeners. This means that:
1. listeners/triggers can always be removed. This makes sense.
2. But, *sometimes* listeners can be added and triggered during the same event propagation cycle, *sometimes* not. Listeners added later in the propagation cycle will be triggered, except when they are on the same element in the same phase as the current element.
3. The sync/async behavior can be confusing, as sometimes each event listener is given its own macro task, sometimes all event listeners are considered *one* macro task, and sometimes the event listeners are considered sync (when dispatched via `dispatchEvent`).

The overhead per native event listener is not that big. It is quite performant. The only cost is resolving the reaction chain and maintaining the eventLoop state.
*/