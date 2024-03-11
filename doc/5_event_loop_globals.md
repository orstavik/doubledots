# The virtual event loop

>> See the chapter of native event loop problems if you are uncertain as to why the native event loop is *ripe* for simplification and what issues we are trying to solve with a virtual event 

Doubledots implements a virtual event loop. The virtual event loop captures and runs all* native events, all custom events, `MutationObserver`s and other observers, `setTimeout()` and other time callback triggers, `requestAnimationFrame()`, and the invocation of `<script>` tags.

There are several new rules for the virtual event loop in doubledots:
1. The virtual event loop only triggers custom reaction attributes: No js event listeners, no `setTimeout` callbacks, no JS MutationObserver. The only callbacks that are not marked with an event are the web component  

>> * It would be too costly for the virtual event loop to add event listeners for all events, always. If we don't want to listen for `mousemove` for example, we do not want to add a listener for it. Similarly, if we only want to listen for `mousemove` events over a narrow branch of the DOM, we add the event listeners there, and not everywhere. Therefore, doubledots only add event listeners for native events when there is a custom reaction needed.

## Types of events

In HTML doubledots there are three types of events:
1. single attribute events 
2. "elements in all documents" events
3. "elements in a single document" events

The single attribute events are callbacks on *one* isolated custom reaction. They replace the need for `setTimeout()`, `MutationObserver`s, loading `<script>`s, and a few others.

The path for "elements in all documents" and "elements in a single document" events are calculated starting with the "target" element and then listing ancestors. Much the same as the calculation of the path for native events. However, there are slight differences:

1. HTML doubledots only trigger custom reactions. And custom reactions can only be added to html elements. Therefore, the virtual event loop in doubledots do not include neither the `window`, `document`, nor any `shadowRoot`s in the propagation path.

2. "Elements in all documents" events propagate fully. They are like `{bubbling: true, composed: true}` in the native sense. Examples of such events are `click` and `error`.

3. "Elements in a single document" events only propagate to elements within the same document. This means that if the event occurs within a shadowRoot, then it will not trigger any custom reactions inside any other document. 

In terms of native events, this can be thought of as `{bubbling: true, composed: no-way-no-how!}`. But why do doubledots enforce this non-composed aspect stronger than the native platform? If you imagine that there is only *one* web developer that works with the DOM template inside the main .html document or the web component, then with a stricter composed scope, then this event will not go down into the shadowRoot of any web components that he is slotting in. This means that there will be no "hidden, slotted reactions" to a non-composed events, and that a `<slot>` element will not be able to spawn any non-composed events from the outside. `composed: no-way-no-how` thus means that such events truly only exists within a single document. And this will cause less confusion.

## Propagation sequence

Single attribute events do not propagate. They only trigger the *one* custom reaction attribute. That's that for those.

But for the element events (both the single document and all documents events), the custom reactions are executed in the following sequence:

1. _global reactions. Each reaction is run in the sequence it was added. _global reactions only run on elements and custom reaction attributes that are connected to the DOM.
2. bubble the path, target and up. The path is calculated at the beginning of the bubble propagation. This means that if you insert an ancestor element in an event reaction, then this element will not be included in the propagation path. However, if you remove an ancestor element, then this change will be registered, and any event reactions on it will not be triggered. And the final note: if an ancestor is added in the _global reaction stage, then those ancestors will trigger the propagation. Also, if a _global reaction removes the target element of the event from the DOM, then that will remove the entire path.
3. For each element, the custom reaction attributes are triggered left to right. As with elements in the path, the list of custom reactions are calculated at the beginning of propagation, and then custom reaction attributes can be removed from the list, but not added. 
4. After the event has finished bubbling, the default action will be triggered. 






1. the normal event loop, propagation as bubbling.
2. the _global reactions as pre-propagation.
3. postPropagation() actions, cancellable and non-cancellable
4. events on a custom reaction only
4. adding your own default actions.

### `stopPropagation()` and `preventDefault()` and `setDefault()`  and `hasDefault()` and `postPropagation(cb)`
this is a much more advanced set of properties for the event loop.
also. `stopPropagation()` is not allowed. And `e.preventDefault()` should still work.