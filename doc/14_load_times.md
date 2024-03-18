# How to trigger custom reactions when the document loads?

Two main issues:
1. document loading and parsing and waiting for initial resources
2. most often actually associated with waiting for definitions to be ready, not waiting for style and/or dom.

## ":" the empty load trigger

The empty trigger is simply the `attribute-loaded` trigger. As soon as the virtual event loop is informed that an attribute with an `":"` empty trigger name is added to the DOM, it will add an attribute event to the stack that will trigger the reaction chain asap.

```html
<web-comp :import:define="WebComp.js">Hello web-comp</web-comp>
```

In the example above, we want to load and then define the cusotm element `<web-comp>` asap. We do that by triggering the `:import:define` reaction chain, with an empty `""` trigger name.

## real-world use-cases

The empty load trigger is rarely used without the `::r` (ready reaction). Because the `:import` and `:define` reactions might not be ready at the time of initialization, then triggering the reaction chain immidiatly will be wrong, asap will be "as soon as the custom reactions in the chain are ready", not "as soon as the browser encounters the custom attribute.

Thus, the real world example of the functionality above would be:

```html
<web-comp ::r:import:define="WebComp.js">Hello web-comp</web-comp>
```

## How does this compare to:

1. React attributes enter() and leave() callback
2. `.connectedCallback()` `.disconnectedCallback()`