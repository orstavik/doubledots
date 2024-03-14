# state machines

There are several forms of statemachines in a browser. two types of Gestures and css pseudo classes is one way the browser creates and manages state machines. A gesture is a statemachine that listens for UI events such as `click`, `mouseenter`, `pointermove`, etc. and then produce new events. CSS pseudo class reflect a state of something in the browser, and that will turn on and off as that state changes.

## Demo: `hover` state switches

In this example we will illustrate a statemachine spread out over two custom reactions, working in sync, to update a state on another attribute.  we will implement a hover reaction for our html with doubledots that updates the hover attribute on an element.

```html
<h1 mouseenter:hover-on mouseleave:hover-off>Hello sunshine</h1>
<script>
customReaction.define('hover-on', function() {
  this.ownerElement.classList.add('hover');
});
customReaction.define('hover-off', function() {
  this.ownerElement.classList.remove('hover');
});
</script>
```
And done! Two triggers tracks the mouse movements entering and leaving an element and add/remove a css class `hover` on the element.

This is fine. But if there are more than just *two* triggers involved, this can quickly become unwieldy. To tackle more complex scenarios, we use custom triggers set up as state machines.

## Example gesture: `trippleclickable`

`trippleclickable` is a small statemachine dispatches a custom event `trippleclick` when a user clicks an element three times in quick succession.

```html
<div trippleclick:log>
  <h1 trippleclickable_300>hello sunshine</h1>
</div>

<script>
class TrippleClickable extends Attr {
  private let lastTime=0;
  private let count=0;
  private let duration;
  private static const child = "click:--trippleclickable:.click";
  
  upgrade(name) {
    this.duration = parseInt(name.split("_")[1]) || 300;
    this.ownerElement.setAttribute(child);
  }

  remove() {
    this.ownerElement.removeAttribute(child);
    super.remove();
  }

  click(e) {
    if(!this.isConnected))
      return this.remove();
    const now = performance.now();
    if(now-lastTime>duration)
      lastTime = count = 0;
    else if (this.count == 2){
      lastTime = count = 0;
      this.ownerElement.dispatchEvent(new MouseEvent("trippleclick", e));
    } else{
      lastTime = now;
      this.count++;
    }
  }
}
customReaction.defineTrigger('trippleclickable_', TrippleClickable);
customReaction.defineReaction('log', console.log);
</script>
```

Here is how it works:
1. On the `<h1>` element a `trippleclickable_` gesture/statemachine is added. 
2. The `trippleclickable_` statemachine will spawn a child custom reaction on its `element` called `click:--trippleclickable:.click`.
3. The `click:--trippleclickable:.click` is the active arm of the statemachine. Whenever a `click` event happens on the element, then first the `:--trippleclickable` uses the `-`rule to transpose the origin of the reaction chain to the `trippleclickable_` attribute/statemachine. Once the location of the reaction chain has moved to the statemachine, the reaction chain uses the `.` rule to access and call the `click()` method on the statemachine, passing it the `(e, oi)` arguments.
4. The statemachine now gets all the `click` events, registers their time and duration between them, and if three `click` events has occured since its last inception, then it will dispatch a `trippleclick` `MouseEvent` on its `.ownerElement`.

> There is also some slight cleanup taking place. If the `click` is registered *after* the element has been removed from the DOM, then the statemachine attribute will remove itself and its spawned `click:` reaction. The same happens if another script removes only the `trippleclickable` statemachine, then this will be intercepted by the `remove()` function. Doubledots implements `.remove()` as part of its extension of the platform, and all methods of removing just a single attribute from the DOM is routed through this method.

## `click:tripplable`

We can also implement the `trippleclickable` as a custom reaction rule, instead of a trigger. The reason we can do that is that we only have a single trigger event for our statemachine.

```html
<div trippleclick:log>
  <h1 trippleclickable_300>hello sunshine</h1>
</div>

<script>
customReaction.defineReactionRule('trippleable_', function(name){
  const duration = parseInt(name.split("_")[1]) || 300;
  return function(e, oi){
    const [count, lastTime] = this.value?.split("_") || [0, 0];
    const now = new Date().getTime();
    if(now-lastTime>duration)
      this.value = "0_0";
    else if(count == 2){
      this.value = "0_0";
      this.ownerElement.dispatchEvent(new MouseEvent("trippleclick", e));
    } else 
      this.value = `${count+1}_${now}`;
  }
});
customReaction.defineReaction('log', console.log);
</script>
```

As you might see, this is simpler and better. We make an assumption here that we are alone in using the attribute `.value`. This can be a good choice, for simplicity and transparency. But you could just as easily have stored the values in a `WeakMap()` using the `attribute` as key.


## Example gesture: `longpressable`

The `longpressable` state machine dispatches a custom event `longpress` when a user presses and holds an element for a minimum specified duration without releasing.

```html
<div longpress:log>
  <button longpressable_500>Hello sunshine</button>
</div>
<script>
class LongPressable extends Attr {
  private let downTime;
  private let duration;
  private static const downer = "mousedown:--longpressable:.down";
  private static const upper = "mouseup:--longpressable:.up";

  upgrade(name) {
    this.duration = name.split("_")[1] || 500;
    this.ownerElement.setAttribute(downer);
  }

  down(e) {
    if(e.button !== 1)
      return;
    downTime = e.timestamp;
    this.ownerElement.removeAttribute(downer);
    this.ownerElement.setAttribute(upper);
  }

  up(e) {
    if(e.button !== 1)
      return;
    this.ownerElement.removeAttribute(upper);
    this.ownerElement.setAttribute(downer);
    if(e.timestamp - downTime > this.duration)
      this.dispatchEvent(new MouseEvent("longpress", e));
    downTime = 0;
  }
}

customReaction.defineTrigger('log', (event) => {
  console.log('Long press detected:', event);
});
</script>
```

`trippleclickable` and `longpressable` do much the same. But there is one thing worth noting the in `longpressable` example: the alternating `upper` and `downer` spawned listeners.

When the `longpressable` statemachine begins, it starts with the `down` listener. As with the `trippleclickable`, the spawned listener uses the `-` and `.` rules to transpose and call a method on the statemachine attribute. But when the `mousedown` event triggers the `down(e)` method, the statemachine will not only register a new state, but also remove a spawned listener and add a new one.

