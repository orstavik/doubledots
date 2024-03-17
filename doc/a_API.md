# API of DoubleDots

## MonkeyPatched

### Partially deprecated JS methods

* `setTimeout` and `setInterval` are no longer accessible. Instead a new window method `window.sleep = async function(ms){...}` is made available. This can be used in any trigger: and :reaction definition.

### `Event.prototype`

* `Event.stopPropagation()`: or this could be altered so that it only works within the current document, and we can have 
1. `stopPropagationImmediately()` for the currentDocument.
2. `stopPropagation()` after the current element reactions.
3. `stopPropagationOnElement()` for only the currentElement.


### `Node.prototype`

1. `Node.append()` and `Node.prepend()` and the other js methods that enable you to attach a single or set of js elements to another element. These methods will first run through and check that the `toBeAddedElement.getRoot() === toBeAppendedElement.getRoot()`, ie. that the elements added are only moved, not coming from the js space.

### `Element.prototype`

* `.outerHTML`: can no longer be used to `set` HTML content, only to read from the DOM.


## Deprecated JS methods

2. `document.createElement` and `document.createAttribute`.