## 3 Chaining definitions

- How to chain reactions
  In doubledots you chain reactions like this:

  `event:reaction1:reaction2:...`. When the `event` triggers, it is first passed to `:reaction1`, then `:reaction2`, etc.etc.

  - Defining custom reactions

  The define function takes in a name and a callback function

  ```html
  <div click:console.log>hello</div>
  <script>
    customReactions.define("log", console.log("Hi"));
  </script>
  ```

- Passed props

  The first reaction in the chain is passed a single argument: the event object. But, when the second reaction is called, it is passed _two_ arguments: the event object _and_ the output of the previous reaction.

  Note. In the documentation, we often refer to the two arguments of the custom reactions as `e` for "event" and `oi` for "output-input".

  ```html
  <p click:get_text:log>Loggin this</p>
  <script>
    customReactions.define("get_text", () => {
      text = this.ownerElement.textContent;
      return text;
    });
    customReactions.define("log", (e, oi) => {
      console.log(oi);
    });
  </script>
  ```

- Using `This` in customReactions.

  Inside a reaction function `this` points to the attribute object (the `Attr`).

  ```html
  <div click:log_name:log_value:log_tagname="hello">sunshine</div>
  <script>
    customReactions.define("log_name", () => console.log(this.name));
    customReactions.define("log_value", () => console.log(this.value));
    customReactions.define("log_tagname", () =>
      console.log(this.ownerElement.tagName)
    );
  </script>
  ```

## 4. Breaking chain reaction

- Ways of breaking the chain

  There are two ways a chain reaction can be broken:

  1. if the custom reaction function `return` a special object `customReaction.break`, or
  2. if the custom reaction function `throws` an `Error`.

- `customReactions.break`
  By returning `customReactions.break`, the custom reaction chain will simply stop running and let the next custom reaction chain continue.

  ```html
  <div click:one:stop:two>hello sunshine</div>
  <script>
    customReactions.define("one", () => console.log("one"));
    customReactions.define("stop", () => customReactions.break);
    customReactions.define("two", () => console.log("two"));
  </script>
  ```

  When somebody `click` on the `<div>`, then:

  1. the `:one` reaction will run and print `one` in the console,
  2. the `:stop` reaction will run and return `customReactions.break`, which
  3. will halt the execution of the reaction chain blocking the `:two` reaction from ever being invoked.

- Filters
  Custom reaction functions that sometimes break the reaction chain are called filters. Filters check the state of for example:

  1. the event,
  2. the attribute `.value`,
  3. the surrounding dom and/or
  4. Some other external source (such as a web database, a sensor, or similar).

  If some state conditions are (not) met, then the filter will `.break` the custom reaction, otherwise it will let the chain reaction continue.

- Filter, parsers, extractors, etc.
  sda


## 5. Event Loop

- Virtual event loop rules.

  1. Only triggers custom reactions and attributes: no `setTimeout` callbacks, no JS MutationObserver. The only callbacks that are not marked with an event are the web component

- Types of events.

  1. Single attribute events.
  2. "elements in all documents" events.
  3. "elements in a single document" events.

  The single attribute events are callbacks on _one_ isolated custom reaction. They replace the need for `setTimeout()`, `MutationObserver`s, loading `<script>`s, and a few others.

  The path for "elements in all documents" and "elements in a single document" events are calculated starting with the "target" element and then listing ancestors. Much the same as the calculation of the path for native events. However, there are slight differences:

  1. HTML doubledots only trigger custom reactions. And custom reactions can only be added to html elements. Therefore, the virtual event loop in doubledots do not include neither the `window`, `document`, nor any `shadowRoot`s in the propagation path.

  2. "Elements in all documents" events propagate fully. They are like `{bubbling: true, composed: true}` in the native sense. Examples of such events are `click` and `error`.

  3. "Elements in a single document" events only propagate to elements within the same document. This means that if the event occurs within a shadowRoot, then it will not trigger any custom reactions inside any other document.

- Propagation sequence.

  Single attribute events do not propagate. They only trigger the *one* custom reaction attribute. But for the element events (both the single document and all documents events), the custom reactions are executed in the following sequence:

  **Pre-propagation:** _global reactions. Each reaction is run in the sequence it was added. _global reactions only run on elements and custom reaction attributes that are connected to the DOM.

  **Propagation:** bubble the path, target and up. The path is calculated at the beginning of the bubble propagation. This means that if you insert an ancestor element in an event reaction, then this element will not be included in the propagation path. However, if you remove an ancestor element, then this change will be registered, and any event reactions on it will not be triggered. And the final note: if an ancestor is added in the _global reaction stage, then those ancestors will trigger the propagation. Also, if a _global reaction removes the target element of the event from the DOM, then that will remove the entire path.

  For each element, the custom reaction attributes are triggered left to right. As with elements in the path, the list of custom reactions are calculated at the beginning of propagation, and then custom reaction attributes can be removed from the list, but not added. 

  **Post-propagation:** After the event has finished bubbling, the default action will be triggered. Default actions are cancellable, ie. if the `e.preventDefault()` has been called on a default action, then no default action reactions will be triggered.


- No more `.stopPropagation()` 

  `.stopPropagation()` and `.stopImmediatePropagation()` is not part of the virtual event loop. The reason for this is that it is a problematic concept when different developers are supposed to collaborate across shadowDom boundaries.

## 6. Async 

- Sync mode
  
  At its core, the virtual event loop is *sync*. This means that any custom reaction will be completed *before* the any other custom reaction is run. You *can* halt *all* execution of custom reactions if you need to wait for a `Promise` inside a custom reaction. You can force the browser to freeze and wait for something, when and if you really want.

```html
<web-comp click:call_web-comp_method>
  <div click:load:define_web-comp="WebComp.js">hello race</div>
</web-comp>
```

If you did this, then the event loop would essentially *halt* all its other operations while waiting for `:load` to complete, thus ensuring that `:call_web-comp_method` would not be triggered until the definition was ready.

- Async mode , `::`
  But, at its fringes, the virtual event loop is also *async*. If you add the empty reaction `":"` in your reaction chain, then the event loop will *not* pause and wait for any `Promise`s in the rest of that reaction chain, but allow the rest of that reaction chain to be run in a thread.
  
  The empty reaction looks like a double colon prefix: `::load`. Essentially the double colon says that if the virtual event loop encounters a `Promise` *after* the `::`, then it will not halt the progression of the event loop, but instead create a thread that the rest of this reaction chain can run in. Between events, the virtual event loop will process and complete these loose threads.

  This means that we in Doubledots would do the following:

  ```html
  <web-comp click::known-element:call_web-comp_method>
    <div click::load:define_web-comp="WebComp.js">hello race</div>
  </web-comp>
  ```

  Here we are add `::` before `::load` and a new `::known-element` reaction. This means that the `::load:define_web-comp` reaction will run in parallel with the event loop. At the same time, the `::known-element:call_web-comp_method` will also run in a thread. This second thread will for example poll to check if the `<web-comp>` has been given a definition yet, or not.

## 7. Default Actions

- Default action reactions
  The virtual event loop has three different custom reactions to control default actions.

  1. `::da`
  2. `:prevent-da`
  3. `:nda`

- `:da`
  You can add your own a default actions by using the `::da` custom reaction. The `::da` must always be preceded by `::`. This is because it is an async that will not continue until the sync event loop has finished the propagation of the event.

  You can add `:da` multiple times. It is *only* the *last default action* from the *top-most* document, that will run.

- `:prevent-da` and `e.preventDefault()`

  To stop the default action, you can use the `:prevent-da` custom reaction. You can also call `e.preventDefault()` inside one of your own custom reactions.

  > Rule of thumb: the `:prevent-da` should be positioned before the `::` async-/thread-mode marker.

  The `:prevent-da` cannot prevent a default action added in document above. Ie. if `:prevent-da` is called from a shadowDom, that will not be able to block a default action added on a child element in the lightDom.

  ```html
  <web-comp>
    <h1 click::da:open="bbc.com">bbc.com</h1>
  </web-comp>

  <script>
  customElements.define("web-comp", class WebComp extends HTMLElement{
    constructor(){
      super();
      this.shadowRoot.innerHTML = 
      `<slot click:prevent-da></slot>`
    }
  });
  </script>
  ```

  If the default action commands from all the documents were equal, then the `<web-comp>` would cancel the default action in the document above. In contrast, in the virtual event loop, default actions are sorted in the hierarchy they are added.

- `:nda` Native Default Action

  By default, native default actions run as normal. However, like your custom `::da`, you can *re-enable* the native default action even after a custom reaction has been added or `:prevent-da` has been called. This enables you to override any `e.preventDefault()` calls taking place inside a shadowDom.

  To re-enable the native default action, a special `:nda` reaction is called. `:nda` *must end* the reaction chain. This reaction can run sync; it doesn't have to run  after `::` in async mode.

  > `:nda` stands for "native default action", but it is also a reminder that the inner workings of the native default actions are as hidden and magical to us  regular developers as if they were sealed behind an Non-Disclosure Agreement.

### `:nda` example

```html
<a href="bbc.com" click:is_active:nda>
  <web-comp>
    hello sunshine
  </web-comp>
</a>
```
Even if a custom reaction inside `<web-comp>` called `.preventDefault()`, the browser would still run the native default action on the event.

>> There is a problem with timing of native default actions. If a native event has native default actions, then a macro-task break should occur in the virtual event loop *before* the next event is processed. This break will enable the browser to correctly time the native default action. This break can be achieved by adding a `nextTick` (using ratechange) at the end of the event loop cycle when `:nda` is encountered.

## Note on implementation

```js
customReactions.define("da", function(e,i){
  const daDelayer = new Promise();
  e.customDefault(daDelayer);
  return daDelayer;
});
```

When the virtual event loop processes the default action list, it will `promis.resolve(oi)` on the chosen default action, and `promise.resolve(customReactions.break)` on all the default actions that were prevented or not resolved.

### `Event` implementation

The below code illustrates how the virtual event loop manages the 

```js
class Event {
  private static prevent = {};
  private static nda = {};
  private defaultActionList = []; 
  preventDefault(){
    this.defaultActionList.push({action: Event.prevent, document: this.currentElement.getRoot()});
  }
  nativeDefault(){
    this.defaultActionList.push({action: Event.nda, document: this.currentElement.getRoot()});
  }
  customDefault(promise, oi){
    //outside check that the attribute is preceeded by `::`
    this.defaultActionList.push({action: this.currentAttribute, document: this.currentElement.getRoot(), promise, oi});
  }

  stopProgation(){
    //after the current element
    //restricted to only work within the current document    
  }

  stopProgationElementOnly(){
    //stop the rest of  the reactions on this element, but let the reactions on ancestor elements run as before
    //restricted to only work within the current document    
  }

  stopImmediateProgation(){
    //current element and rest of document
    //restricted to only work within the current document
  }

  processDefaultActions(){
    //the findTheLastDAofTopMostDocument algorithm is a bit tricky as levels between different slotting web comps play as one.
    //<slotting-a>
    //  <slotting-b>
    //    target
    //
    //the document depth alone between the default action commands inside slotting-a and slotting-b is not sufficient. If there are actions inside slotting-a, they should always win over commands in slotting-b, regardless of document depth.
    const singleDa = this.defaultActionList.filter(findTheLastDAofTopMostDocument);
    const listOfPreventedDas = this.defaultActionList.filter(notSingleDa);
    returns {singleDa, listOfPreventedDas};
  }
}
```


## 8. Custom triggers.

## 9. Defining reactions

## 10. Defining reaction rules

## 11. Dot rules

## 12. Dash rules

## 13. Schedulers

## 14. Load times

## 15. State machine

## 16. Gestures

