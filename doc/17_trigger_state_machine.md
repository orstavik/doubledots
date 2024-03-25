# trigger state machines

Transient trigger state machines were extensively described in the previous chapter of custom triggers. This chapter will essentially build on the previous trigger chapter and just add more examples.

## Go over defining trigger state machines

Trigger state machines are defined by extending the Attr class. They are placed in the attribute chain just like a normal (??) trigger. When the event is fired, depending on the logic implemented, the event chain will fire or not.

Let's look at the next example, taken from the previous documentation on state machines (LINK).

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
      else if (this.count == 2) {
        lastTime = count = 0;
        this.ownerElement.dispatchEvent(new MouseEvent("trippleclick", e));
      } else {
        lastTime = now;
        this.count++;
      }
    }
  }
  customReaction.defineTrigger('trippleclickable_', TrippleClickable);
  customReaction.defineReaction('log', console.log);
</script>
```

Here is how it is made:

1. The state machine is added to the parent element, this is so as to be triggered by it's children. It has the necesary variables for its logic and a `child` attribute that will be placed where it is invoked, defined on the upgrade method. We also define the `click` method and the logic that fires the `trippleclick` event.
2. On the `<h1>` element a `trippleclickable_` gesture/statemachine is added.
3. The `trippleclickable_` statemachine will spawn a child custom reaction on its `element` called `click:--trippleclickable:.click`. This attribute is defined on the state machine.
4. The `click:--trippleclickable:.click` is the active arm of the statemachine. Whenever a `click` event happens on the element, then first the `:--trippleclickable` uses the `-`rule to transpose the origin of the reaction chain to the `trippleclickable_` attribute/statemachine. Once the location of the reaction chain has moved to the statemachine, the reaction chain uses the `.` rule to access and call the `click()` method on the statemachine, passing it the `(e, oi)` arguments.
5. The statemachine now gets all the `click` events, registers their time and duration between them, and if three `click` events has occured since its last inception, then it will dispatch a `trippleclick` `MouseEvent` on its `.ownerElement`.

6. This event is caught by the parrent element, logging to console.

## Best use cases

The best uses for trigger state machines are when the interactions with the state machine involve various events, get triggered in more than one way, or involve off-dom events.

## Bad use cases

State machines are better placed in reactions when they are fired by a single event, involve a single element, and have isolated logic from other state machines, being able to be read by other state machines but not being altered by them.

## Caveats

## Examples

### `inView:`

In this example we use a trigger state machine to handle the fading of items according the visibility of children.

```html
<div inView:changeVis>
  <div id="1" inView="1">Item 1</div>
  <div id="2" inView="2">Item 2</div>
  <div id="3" inView="3">Item 3</div>
</div>

<script>

  class inView extends Attr {
    private let observer = new IntersectionObserver((entries) => {
      for (let entry of entries) {
        if (entry.isIntersecting) {
          this.ownerElement.dispatchEvent(new Event("inView"));
        }
      }
    });

    upgrade() {
      this.observer.observe(this.ownerElement);
    }

    remove() {
      this.observer.disconnect();
    }

    observer.observe(this.ownerElement);
  }

  customReaction.defineTrigger("inView", inView);
  customReaction.defineReaction("changeVis", (e) => {
    e.target.style.opacity = 1;
  });
</script>
```

### `apiReady:`

In this example, we will fire an event when an API call has been completed to display the data.

```html
<div textFetch:loadText>
  <button click:textFech::.fetch>LOAD TEXT</button>
  <div>Sprinner</div>
</div>
<script>

  class textFetch extends Attr {
    fetch(){
      fetch("https://api.example.com/text")
        .then(response => response.json())
        .then(response => this.ownerElement.dispatchEvent(new CustomEvent("textFetched", response)));
    }
  }

  customReactions.define("loadText", (e,oi) => {
    let response = oi
    let text = response.text
    let date = response.date
    let title = response.title
    this.innerHTML = `
    <div>
    <h1>${Title}</h1>
    <p>${text}</p>
    <p>${date}</p>
    </div>
    `
  })

</script>
```

### `loose:`

In this custom trigger, we will finish a game after a loss or timeout. We will change styles and handle the according logic.

```html
<div gameChange:handleStatus:changeLayout click:handleGame>
  <h3>Guess the number!</h3>
  <button>Start Game</button>
  <div>1</div>
  <div>2</div>
  <div>3</div>
  <div>
    <h2>You lost</h2>
  </div>
  <div>
    <h2>You won!</h2>
  </div>
</div>
<script>

class gameChange extends Attr {
  private let status = "idle"
  private let options = [1,2,3]
  private let correct

  upgrade(){}

  remove(){
    this.ownerElement.removeAttribute();
    super.remove()
  }

  start(){
    // Start the game
    this.status = "playing";
    //choose a random number from the options array
    this.correct = this.options[Math.floor(Math.random() * this.options.length)]; 
    //start timmer
  }

  guess(){
    // Check if the guess is correct
    if (/* condition for correct guess */) {
      // Handle correct guess logic
    } else {
      // Handle wrong guess logic
      this.loss();
    }
  }

  loss(){
    // Handle loss logic
    this.status = "lost";
  }

  win(){
    // Handle win logic
    this.status = "won";
  }
}

</script>
```

- observers,
- interval loop
- callbacks

1. single or multiple triggers? doesn't matter. binary or multiple states? doesn't matter. Triggered _only_ by the occurrence of events that are not propagating in the dom? yes. (this can be timers (sleep, raf), observers (mutationObserver), a custom callback generator/event emitter that is not a DOM propagating event). Controllable by outside reactions? yes. => Simple trigger state (no gesture). Since it is triggered by occurrenced not propagating in the DOM, it doesn't need to spawn any custom listeners. The outside control is supported by the `changeCallback(oldValue)`.
