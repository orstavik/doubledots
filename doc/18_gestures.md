# gestures

Or complex state machines. State machines that spawn 

,  But, they can listen for other types of events, and sometimes do. Gestures are often complex, multi-trigger, and focus on dispatching events, but exceptions do exists to all these rules: `click` is simple, a naive `doubleclick` is single-trigger, `hover` outputs no events, only update CSS (pseudo) class.

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


## Examples of gestures

1. Drag-and-Drop Interfaces: In drag-and-drop interactions, the draggable elements and drop targets go through a series of states: idle, dragging, over a target, and dropped.

2. `click` and `press`

3. Swipe and fling and pinch and pan

In this chapter we will only look at the simpler 

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

>> old text: A "hover" statemachine listens for UI events, and you can easily see that statemachine dispatching "hover" events if you want to. However, a "hover" statemachine is both small, simple, and would commonly only listen for UI events, update a css (pseudo) class or attribute, and it would commonly *not* dispatch events. Therefore, the term statemachin (simple, non event oriented effects) would better fit "hover" than the term gesture (complex, mostly event oriented effects).

And done! Two triggers tracks the mouse movements entering and leaving an element and add/remove a css class `hover` on the element.

This is fine. But if there are more than just *two* triggers involved, this can quickly become unwieldy. To tackle more complex scenarios, we use custom triggers set up as state machines.


### old text
4. **Gestures** vs. plain statemachines: Gestures are complex statemachines that ***dynamically spawn and remove*** other reactions. We call them "gestures" because they commonly monitor the state of user interaction and spawn UI event reactions, but they are not restricted to UI and UI events. The main thing is that they dynamically erect and take down event listeners during their life cycle. In the next chapter we will talk about gestures.

3. multiple triggers? yes. multiple triggers for dom events? yes. binary or multistate? doesn't matter. triggered by outside-dom occurrences too? doesn't matter. Controllable by outside reactions? doesn't matter. => Gesture. complex beast.
