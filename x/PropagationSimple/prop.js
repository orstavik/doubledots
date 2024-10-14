export class WindowTrigger extends AttrListener {
  get target() { return window; }
}

export class DocumentTrigger extends AttrListener {
  get target() { return document; }
}

export class DCLTrigger extends DocumentTrigger {
  get type() { return "DOMContentLoaded"; }
}

export class PrePropTrigger extends WindowTrigger { //global _click
  get type() { return this.trigger.slice(1); } //remove prefix so returns "click"
  get options() { return true; }
}

export class PostPropTrigger extends WindowTrigger { //global click_
  get type() { return this.trigger.slice(-1); } //remove postfix so returns "click"
}

function makeAll() {
  const upCase = s => s[0].toUpperCase() + s.slice(1);
  const res = {};
  for (let type of DoubleDots.nativeEvents.element) {
    type = upCase(type);
    res[type] = AttrListener;
    res["_" + type] = PrePropTrigger;
    res[type + "_"] = PostPropTrigger;
  }
  for (let type of DoubleDots.nativeEvents.window)
    res[upCase(type)] = WindowTrigger;
  for (let type of DoubleDots.nativeEvents.document)
    res[upCase(type)] = DocumentTrigger;
  delete res["DOMContentLoaded"];
  res["Domcontentloaded"] = DCLTrigger;
  return res;
}
export const dynamicSimpleProp = makeAll();

/**
# SimplePropagation

>> Note!! You must register the triggers for `custom-event`s too, such as `document.Triggers.define("custom-event", AttrListener);`.

In HTML events "propagate" in the DOM. These events are small data messages that trigger reactions in the form of JS event listener functions.

## Propagation triggers

In DoubleDots events also propagate in the DOM. DoubleDots use propagation triggers to react to them. For example `click:toggle_open` uses a `click` propagation trigger to react to `click` event and invoke the `:toggle_open` reaction chain.

## `AttrListener`

The `AttrListener` is a special subtype of `AttrCustom` that handle native event listeners. Most commonly you will only import a set of propagation triggers for native events, and maybe add some of the propagation triggers to your own `custom-event` types. Most DoubleDots environments will deprecate the native event listeners and only allow event listeners to react to propagation triggers that `extends AttrListener`. Both for native events and custom events. 

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

## HowTo: `extends AttrListener`

If you need to implement your own propagation triggers, the `AttrListener` provide the following interface:
1. `get target()` (default: `this.ownerElement`)
2. `get type()` (default: `this.trigger`)
3. `get options()` (default: undefined)
4. `run(e){...}` (default: `eventLoop.dispatch(e, this)`)

## Performance and consistency

SimplePropagation follows the same logic as native event listeners. This means that:
1. listeners/triggers can always be removed. This makes sense.
2. But, *sometimes* listeners can be added and triggered during the same event propagation cycle, *sometimes* not. Listeners added later in the propagation cycle will be triggered, except when they are on the same element in the same phase as the current element.
3. The sync/async behavior can be confusing, as sometimes each event listener is given its own macro task, sometimes all event listeners are considered *one* macro task, and sometimes the event listeners are considered sync (when dispatched via `dispatchEvent`).

The overhead per native event listener is not that big. It is quite performant. The only cost is resolving the reaction chain and maintaining the eventLoop state.

## `Event.activeListeners()`

The AttrListener keeps track of how many listener are active for any event type at any time. Asking `Event.activeListeners("click")` will return the number of active `click` event listeners in the DOM. This method can be used to for example:

1. debug an app to see what it does,

2. to throw error if `dispatchEvent` is called for an event no one is listening for:

```js
EventTarget.prototype.dispatchEvent(e){
  if(Event.activeListeners(e.type))
    throw new DoubleDots.PropagationError(`dispatching event "${e.type}" when no one is listening.`);
  OG.call(this, e);
}
```
*/