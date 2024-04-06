# Event loop times

## Queue-time

At **queue-time** the `event` and the `target` is added to the event loop queue as a coming task. If the event loop is currently empty (nothing is going on), then the task is run immediately. If the event loop is busy doing something else, the task waits in the queue. These per-event tasks in the event loop are called macro-tasks in HTML.

In DoubleDots all callbacks are queued as such event/macro-tasks. In DoubleDots you can think of queue-time as when `dispatchEvent()` is called. In native HTML it is much more confusing, see other chapter.

## Start-propagation-time

At **start-propagation-time** the `composedPath()` is calculated. The `composedPath()` is a list of all the ancestor nodes beginning with the `target`.

Below is an example in native HTML/js that illustrate this behavior. A non-cancellable default action of two fast `click`s is to queue a `dblclick` event. And the cancellable default action of a `click` on a `<summary>` is to toggle the `[open]` attribute on the `<details>` parent. *When* the `[open]` attribute is changed, this queues another native event `toggle` in the eventLoop. *Both* the `dblclick` and the `toggle` event tasks are queued during the `click` event. And when we *move* the `target` during the `dblclick` event, then we see that the `composedPath()` has changed when the `toggle` event runs. This illustrates that the `composedPath()` is calculated at start-propagation-time, not queue-time.

```html
<details>
  <summary>dblclick me</summary>
  hello sunshine
</details>

<script>
  const el = document.querySelector("details");
  el.addEventListener("click", e => console.log(e.type, e.composedPath()));
  el.addEventListener("dblclick", e => el.remove());
  el.addEventListener("dblclick", e => console.log(el.hasAttribute("open")));
  el.addEventListener("dblclick", e => console.log(e.type, e.composedPath()));
  el.addEventListener("toggle", e => console.log(e.type, e.composedPath()));
</script>
```

Outputs:

```
click    [summary, details, body, html, document, Window]
toggle   [details, body, html, document, Window]
click    [summary, details, body, html, document, Window]
dblclick [summary, details, body, html, document, Window]
toggle   [details]
```

## next-reaction-chain

Propagation is not really to go to next element. When we propagate, we might actually jump elements, and we freeze the list of attributes, and we also set the first (or next) attribute. So, the next-reaction-chain is the step.
1. if there are more attributes on `.currentElement`, then get and set next attribute. Check if this attribute `.isConnected`. otherwise repeat.
2. else get the next `.currentElement`. see if it has any matching `.reactions`. This is a `.trigger` property. Same as `.reactions` property on the `Attr`.
3.  and locking in the `reactions` for the current event. This will iterate the `composedPath` until it finds the next element with one or more `reactions` that fit the event type. The `currentElement`, `attributes`, `currentReaction`, `currentAttribute`, index = `[currentElementIndex,  currentAttributeIndex, currentReactionIndex]` are all updated? think so, yes.

## run-reaction-loop-mode

## run-reaction-thread-mode

## new stack frame in js

If we call our functions nestedly, we will blow the stack. So we need to create a new stack every time we `.then()`. We also need

## run-reaction-loop-mode-time

Once the event is popped, the event needs  of the task  of the 


## DoubleDots stop events when `isConnected === false`.

In DoubleDots all elements and attributes are *immediately* considered *garbage* when they are disconnected from the DOM. This means that DoubleDots can and should stop any reaction from running when either the custom attribute or the owner element of that custom attribute becomes `.isConnected === false`. DoubleDots checks for `isConnected !== false` at the following points:

1. If the `target` element or attribute of an event has been disconnected *before* start-propagation-time, then the queued event will not run.
2. If an ancestor element in the `composedPath` is removed from the DOM *before* propagation reaches this element, then DoubleDots will skip this element during bubbling.
3. If at any time an attribute becomes `isConnected === false`, then any subsequent reaction will not run on that attribute. This will result in a `DoubleDotsError("Reaction chain removed from DOM while active")`.
4. If a previous reaction within the same reaction chain has removed the `currentTarget` from the  this element during bubbling on of the  or the s have been disconnected from the DOM before the event is dispatched *or* has been disconnected while waiting in queue. This also that any element in the DOM that has been disconnected during a reaction on a previous reaction will immediately cancel any more propagation mutations that *remove* an element in the `composedPath` will  This means that , element events (events that bubble past elements) does not propagate when they 
  the elements, beginning with the `target` and following the ancestor chain all the way up to `contains a list of all the elements required two things happen:
1. a test to see if the `event` and `target` is still valid.
2. the `composedPath()` for the event is calculated.

 when the task is popped out of the event loop, more happens:


