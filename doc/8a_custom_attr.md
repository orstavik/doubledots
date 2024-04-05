# `CustomAttr`

DoubleDots implement a `class CustomAttr extends Attr`. All triggers *must be* subclasses `CustomAttr`.

## Implementation

```js
class CustomAttr extends Attr {

  get trigger() {
    this.#updateTriggerReactions();
    return this.trigger;
  }

  get reactions(){
    this.#updateTriggerReactions();
    return this.reactions;
  }

  isConnected(){
    return this.ownerElement.isConnected();
  }
  
  remove() {
    return this.ownerElement.removeAttribute(this.name);
  }

  #updateTriggerReactions(){
    const [trigger, ...reactions] = this.name.split(":");
    Object.defineProperties(this, {
      "trigger": {value: trigger, enumerable: true, configurable: false},
      "reactions": {value: reactions, enumerable: true, configurable: false},
    });
  }
}
```

`#updateTriggerReactions()` improves speed. It works by setting `.trigger` and `.reactions` on the object instance upon first request. The `.trigger` and `.reactions` properties are non-configurable as `.name` is non-configurable.