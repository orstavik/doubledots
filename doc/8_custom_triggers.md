# custom `trigger:`

## Undefined event triggers: `click:` and `_click:`

When an event propagates, it will trigger reaction chain that contain the 

## Define a `trigger:`

In Doubledots you can also define your own `trigger:`. Triggers are event factories, sort of. Some are atomic and simple, like `set-timeout_10:` or `attr-change_style:` for example. Others are complex state machines like `swipeable` and `drag-n-drop`. In this chapter we start with the simple ones.

To define a trigger is very similar to defining a reaction rule, except that the definition is not a function, but a `class` that `extends Attr`. This is what it looks like:

```js
customReactions.defineTrigger("prefix", class MyTrigger extends Attr{
  this;//=> the attribute node
});
```

Inside the trigger `class` you must implement *one* function called `upgrade(fullname)`. The `upgrade(fullname){...}` function is the constructor of the trigger (and if it wasn't impossible to invoke constructors using reflection in JS, it would have been called the `constructor(...)` too). 

The `"prefix"` is the start of the trigger names that this definition will be applied to. No trigger prefix can overlap with another trigger prefix, but the reaction names and rule prefixes are completely separate from the trigger prefixes. 

The `prefix` *cannot* startsWith `_`, `-`, or `.`. This will cause conflict with `_global` triggers, or come into conflict with HTML parsing of attributes. 

The `prefix` *should* endsWith either `_` (if it parses name string arguments) or `able` (common for gestures). If the `prefix` does not endsWith the above, it should include either a `_`, or `.` so that it will not overlap with event names.

The `upgrade(fullname)` callback is called immediately/asap when the trigger is created. Inside the `upgrade(){...}` the `this` is the attribute node that the custom trigger is part of. (In a previous version of Doubledots, custom triggers were named custom attributes, but we have changed this to make it clearer that the trigger is not the full attribute, but only part of it.) The argument `fullname` is the full name of the trigger. So, as with reaction rules, it is possible to pass arguments to your triggers as the tail of the trigger name.

## `this.dispatchEvent()` and `this.ownerElement.dispatchEvent()`

The purpose of triggers is to `dispatchEvent()`. There are two targets that the trigger *should* dispatch events too:
1. `this` (the attribute)
2. `this.ownerElement` (the element)

> It is possible to dispatch events on other targets too, but you should try to avoid this if you can. The golden rule is that triggers dispatch events on either the attribute or element they are attached to.

Events that are dispatched to an attribute only trigger the reactionchain on that particular attribute. No bubbling. No _global reactions. Triggers that dispatch single attribute only events are therefore "simpler" and "atomic". Technically, the event type name and the trigger name do not have to match, but in practice it is common to give the custom attribute event the same name as the trigger prefix.

Events that are dispatched on the element will trigger all reactionchains for _global reactions and for trigger names matching its type name on other elements that it bubbles to. For such triggers you should therefore *not* give their custom event's the same type name as the prefix or full name of the trigger. For example, `swipeable` will dispatch `swipe` and `swipe-end` events.

Triggers that dispatch full, normal, propagating element events are commonly more complex and stateful than triggers that dispatch simple, atomic attribute events. We will therefore discuss these triggers in subsequent chapters and here only focus on simple, atomic, stateless triggers.

Event type names *cannot* startsWith `_`. Event type names *should not* contain `.` nor `_` and endsWith `able`.

## Simple, atomic, (almost) stateless triggers

### `attr_xyz:`

Custom triggers replace all the native Observers in JS. In this example we use the Doubledots implementation of the attribute-change-trigger called `attr_xyz:`. This trigger essentially maps the behavior of `MutationObserver.observe(el, {attribute: true, attributeList: [x,y,z]})` into Doubledots:

```html
<script>
  class AttrTrigger extends Attr{

    async upgrade(attr_xyz) {
      const [_, ...list] = attr_xyz.split("_");
      const mo = new MutationObserver(mrs=>{
        if (!this.isConnected)
          return mo.disconnect();
        for (let mr of mrs) {
          const e = new Event("attr");
          //e.changedAttributes = {name: oldValue,...};
          this.dispatchEvent(e);
        }
      });
      const settings = list.length? 
        {attribute: true, attributeList: list} :
        {attribute: true};
      mo.observe(this.ownerElement, settings);
    }
  }
  customReactions.defineTrigger("attr_", IntervalAttr);
  customReactions.defineReaction("log", console.log);
</script>

<h1 attr_class:log class="sun shine">hello</h1>
```

### `inview:`

In this example we use the `IntersectionObserver` to create a custom `inview:` trigger. `inview:` dispatches a new attribute event and triggers the reaction chain on the custom attribute every time the element it is attached to switches from out-of-view to in-view:

```html
<script>
  class InviewTrigger extends Attr{

    async upgrade(inview_thresholdPerc) {
      const threshold = parseInt(inview_thresholdPerc.split("_")[1]) / 100;
      const iso = new IntersectionObserver(_ => {
        if (!this.isConnected)
          return iso.disconnect();
        this.dispatchEvent(new Event("inview"));
      });
      const options = { threshold, root: null, rootMargin: '0px' };
      iso.observe(this.ownerElement, options);
    }
  }
  customReactions.defineTrigger("inview_", IntervalAttr);
  customReactions.defineReaction("hello", _ => console.log("sunshine"));
</script>

<div style="height: 130vh">scroll for it</div>
<h1 inview_1:hello>hello sunshine</h1>
```

### `timeout_x:` 

The atomic `timeout_x:` trigger dispatches an attribute event type `timeout` that will run its reaction chain once after delay of x ms.

```html
<script>
  class TimeoutTrigger extends Attr{
    async upgrade(timeout_time) {
      const delay = timeout_time.split("_")[1];
      await sleep(delay);
      if(this.isConnected) //Doubledots adds this method to Attr too
        this.dispatchEvent(new Event("timeout"));
    }
  }
  customReactions.defineTrigger("timeout_", TimeoutAttr);
  customReactions.defineReaction("log", console.log);
</script>

<h1 timeout_1000:log>hello sunshine</h1>
```

The `timeout_x:` does not use `setTimeout`, but `await sleep()` instead. The reason for this is that Doubledots deprecates `setTimeout()` and instead provides an `await sleep()` instead. There are two reasons why `setTimeout()` is deprecated:
1. It enables a new event to be added from JS without any trace in the HTML template,
2. To use `await sleep()` inside `async function`s yield easier to read code.

However. In Doubledots, it is recommended to use `::sleep_x:` reaction rule instead:

```html
<script>
  customReactions.defineReactionRule(":sleep_", function(sleep_x){
    const delay = parseInt(sleep_x.split("_")[1]);
    return async function(e, oi){
      await sleep(delay);
      return oi;
    }
  });
  customReactions.defineReaction("log", console.log);
</script>

<h1 ::sleep_1000:log>hello sunshine</h1>
```

The benefits of using the `::sleep_x` instead of a `timeout_x:` are:
1. The reaction chain will be added to the event loop. This means that any tooling that illustrate the event loop, will also illustrate when the reaction chain is awaiting the `setTimeout`.
2. The `::sleep_x` is more versatile. You can add other reactions infront of it, and with one reaction rule you can solve more use-cases than with the `timeout_x:`.

### `interval_x:`

```html
<script>
  class IntervalTrigger extends Attr{
    async upgrade(timeout_time) {
      const delay = timeout_time.split("_")[1];
      while (true) {
        await sleep(delay);
        if (!this.isConnected)
          return;
        this.dispatchEvent(new Event("interval"));
      }
    }
  }
  customReactions.defineTrigger("interval_", IntervalAttr);
  customReactions.defineReaction("log", console.log);
</script>

<h1 timeout_1000:log>hello sunshine</h1>
```

The `interval_x:` works better than `timeout_x:` as a trigger. But, we can also implement `interval_x:` using `::sleep_x` and `:..-x`:

```html
<script>
  //customReactions.defineReactionRule(".", dotReactionRule) //see later chapter
  customReactions.defineReactionRule(":sleep_", function(sleep_x){
    const delay = parseInt(sleep_x.split("_")[1]);
    return async function(e, oi){
      await sleep(delay);
      return oi;
    }
  });
  customReactions.defineReaction("log", console.log);
</script>

<h1 ::sleep_1000:log:..-2>hello sunshine</h1>
```

This implementation is using the `.` reaction rule to step -2 positions in the reaction rule, ie. back to the `:sleep_1000` reaction. This is more difficult to read, and it is easy to make a typo using the `:..-2` loop/goto mechanism. However, the benefit is still:
1. The reaction chain will be added to the event loop. And it is visible to any tooling that show the state of the event loop.
2. Again, we only use `:sleep_x` and `:.`, two reaction rules that are part of the Doubledots core (as opposed to `timeout_x:` and `interval_x:` that are not).

## Trigger destruction and cleanup

In Doubledots, neither attribute nor element nodes can be put back into the DOM once they have been disconnected. In Doubledots, the concept is that if an HTML node is no longer in the DOM, it should be considered garbage.

This means that:
1. if an internal callback in a trigger is triggered, and
2. the trigger attribute is either has no `.ownerElement` or that `.ownerElement.isConnected === false`, then
3. the trigger should be considered garbage, and
4. that any active stop, cleanup, or other garbage collection tasks can and should be performed.



## We skip `destructor()`

>> todo: can we skip this? Will MutationObserver work as a WeakSet allowing elements to be gc'ed? or is the 

In addition, you *can* implement another function called `destructor()`. The `destructor()` is as the name implies the method called when the trigger is removed.

The `destructor()` is necessary in *some* custom triggers. No, I think when we can't take attributes and elements in and out of the DOM, this is no longer necessary.