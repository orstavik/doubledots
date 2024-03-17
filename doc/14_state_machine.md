# State machines

State machines are everywhere in the browser. And a key to creating manageable and scalable application is to correctly identify and to be able to reuse proper statemachines. This is something Doubledots take great pride in. A lot of the more complex functionality of Doubledots is oriented towards making statemachines simple, transparent, safe, and reusable.

When we look at state machines in the web browser, there are three binary categories that are helpful in order to understand them.

1. **single-trigger** vs. **multi-trigger** state machine: Do the state machine listen to only one *trigger type*? If so, it is a "single-trigger" statemachine. If the state machine listens to multiple types of triggers, such as a "hover" that listens for both `mouseenter` and `mouseleave`, then it is a multitrigger statemachine.

2. **Simple** vs. **Complex**: Do the state machine have *more than* two states? If they have *three or more* states, we call them **complex**. If they only have *two* states, we call them **simple**. (If they only have one state, they are not statemachines, but just a simple reaction(chain)).

3. **Gestures** vs. "plain statemachines": Gestures are statemachines that react to UI events and describe the state of user interaction. They are commonly complex, multi-trigger, and focus on dispatching events, but exceptions do exists to all these rules: `click` is simple, a naive `doubleclick` is single-trigger, `hover` outputs no events, only update CSS (pseudo) class.

## Examples of single trigger state machines

If a statemachine only has a single trigger type, it can and *should be* implemented as a reaction(chain). These statemachines *commonly* toggles a css class or attribute on an element. They can be complex and switch between several different states as for example form validation can do, but this has not such a big impact on implementation strategy as the variety of trigger types do. Single trigger state machines should be implemented using a single reaction (rule).

Examples of single-trigger state machines:
1. Form Validation: HTML form elements can have different states, such as valid, invalid, pristine, dirty, touched, and untouched. These states can be managed by JavaScript to provide real-time feedback to the user. For instance, a form field might start in a pristine state, transition to dirty once edited, and then become valid or invalid based on the input's conformance to validation rules. If you can accomplish your validation task only triggered by `change` or `input` for example, then use a reaction (rule).

2. Media Player Controls: A media player on a web page has states like play, pause, stop, fast forward, and rewind. Interacting with the controls transitions the media player between these states. For example, clicking the play button transitions the player from the paused state to the playing state. State machines such as media players are commonly implemented as shadowRoot in a web component. But if you want, you most likely can implement this as single-trigger statemachine on `click` for example. 

3. Accordion Menus: An accordion menu has states for each section, such as expanded or collapsed. Clicking on a section header might toggle the state, expanding or collapsing the corresponding content area. The native `<details>` element is an example of such a statemachine. 

4. Tabbed Interfaces: In a tabbed interface, each tab can be considered a state. Clicking a tab changes the active state, showing the content associated with that tab and hiding the others.

5. Dropdown Menus: A dropdown menu has at least two states: open and closed. Interacting with the dropdown (e.g., clicking or hovering) transitions it between these states.

6. Modal Dialogs: A modal dialog is either open or closed. Opening the dialog changes the state of the application by overlaying the dialog above the main content and often disabling interaction with the underlying page until the dialog is closed.

7. CSS Pseudo-Classes: As you mentioned, CSS pseudo-classes like :hover, :active, :focus, and :checked represent different states of an element based on user interaction. These states can be styled differently to provide visual feedback.

8. Animation States: CSS animations and transitions can be considered state machines, where an element transitions between states defined by keyframes or changes in properties.

9. Online/Offline Status: Web applications can react to the browser's online and offline events, changing state accordingly to provide feedback to the user or to queue actions until connectivity is restored.

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

