

<!-- ./README.md -->


# doubledots
The re-discovery of HTML





<!-- ./doc/1_intro.md -->


## Basic concept of _HTML doubledots_ (or `HTML:` or just "doubledots")

This framework enables you to write a full web application using only html. It does so by extending html attributes, so that they can represent event listeners.

### Example 1: `event:reaction`

In simplified terms, the `href` attribute of the `<a>` element acts as an event listener. When you wrap text or other elements in your code as 

```html
<a href="bbc.com"><div>hello bbc</div></a>
```

The "link" represented by the `<a>` element and `href` attribute, will listen to `click` events within, and then tell the browser to open the web page whose link is in the `href` attribute's value. The link. Most, if not all, functionality on any modern web page can be viewed as such an event reaction. An event occurs, and then a function is run as a reaction to that event. 

Keeping things simple for now, we illustrate this "event" => "reaction function" as an `event:reaction` pair. The `<a href="bbc.com"><div>...</div></a>` event listener could therefore be understood as the `<div click:open="bbc.com">` where `click:open` represents the `event:reaction` pair. 

```html
<div click:open="bbc.com">hello bbc</div>
```

### Example 2: `customReactions.define("open", ...)`

That sounds nice, you say. But how in the world would this work in practice? Well, to make this work is actually quite simple. You need only to do two steps:
1. load `<script src="html_doubledots.js">` at the top of your `.html` file, and
2. define the custom reaction "open" in a javascript code.

```html
<script src="www.htmldoubledots.com/topdoubledots.js"></script>
<script>
  customReactions.define("open", function(e){
    window.open(this.value);
  });
</script>

<div click:open="bbc.com">hello bbc</div>
```

Ok, still a little fudgy. No problem! It is quite easy:)

1. `<script src="www.htmldoubledots.com/topdoubledots.js"></script>` loads the doubledots framework. We recommend using `topdoubledots.js` and importing the framework at the beginning of your `.html` document, but you can also append `enddoubledots.js` near the bottom of your `.html` file, if you want.

2. The `topdoubledots.js` file  implements the special `attribute` => `eventListener` functionality. Now, you can listen for events via attributes by writing `click:do_something`, `offline:do_something_else`, `mousemove:another_action`, etc. etc. All the native events, or custom events, will now find and trigger the new `<element event:reaction>` attributes in your `.html` document.

### Example 3: how to filter and chain reactions

Now, in our .html document, we can add event listeners for any event (such as `click:`) and react to them (such as `open`). That is nice. But what else can we do?

```html
<div click:is_active:open="bbc.com">hello bbc</div>
```

In the example above, we add two reactions inside the same doubledot attribute: `is_active` and `open`. We are making a chain of reactions. Where each reaction can break the chain.

We can imagine the example above behaving as following: When a `click` event occurs, the `is_active` performs a check. If the `<div>` element is active, then continue and `open` the attribute value `bbc.com`. If the `<div>` element is not active, then break and do _not_ open bbc.com.

We can implement this as follows:

```html
<script src="www.htmldoubledots.com/topdoubledots.js"></script>
<script>
  customReactions.define("open", e => window.open(this.value));
  customReactions.define("is_active", function(e) {
    if (this.ownerElement.hasAttribute("off"))
      throw customReactions.break;
  }
</script>

<div click:is_active:open="bbc.com">hello bbc</div>
<div off click:is_active:open="foxnews.com">hello fox news</div>
```

Some technical details:
1. You can chain as many reactions as you would like to the reaction chain.
2. To break the chain reaction, you need to `throw` the special `customReactions.break` error. This might seem a little cumbersome, agree, but you will come to like it a little later on. Trust me. But the essence of the special break is that it frees your code to _freely_ `return` and `throw` _anything you want_.

>> this example 'click:open' is doing the same thing as the 'a href' would do. It is not doing something new.




<!-- ./doc/2_dynamic_html.md -->


## HTML changing HTML

The primary usecase for HTML doubledots is to add simple reactions that change the HTML document dynamically. Here are a few examples:

### Example 1: toggle attributes

A common, simple, yet powerful way to change the DOM is to add, remove, and toggle attributes on elements. We can do this to for example hide/show the content of child nodes.

This is exactly what the native `<details><summary>` do. When the `open` attribute is added to the `<details>` element (ie. `<details open>`), then all the childNodes of the `<details>` element will be visible; when there is no `open` attribute on the `<details>` element, then only the first `<summary>` child element will be visible. When the user `click`  on the `<summary>` element, this toggles the `open` attribute on the parent `<details>` element.

We can easily simulate this behavior with doubledots and apply it to any parent-child element pairs.

```html
<script src="www.htmldoubledots.com/topdoubledots.js"></script>
<script>
  customReactions.define("toggle_closed", function() {
    this.ownerElement.parentElement.toggle("closed");
  });
</script>

<style>
  [closed] > :not(:first-child) { display: none; }
</style> 

<div>
  <h3 click:toggle_closed>click to open/close</h3>
  <p>Here is some hideable content</p>
  <p>Here is some more hideable stuff</p>
</div>
```

As you might have noticed, we inverted the behavior of the html attribute from `open` to `closed`. Why? Well, if we *show* all the children by default (ie. when no attribute is present), that makes sense when you *only* see the html template. This behavior would mirror that of HTML if there was no JS nor CSS present.

You might also see that we in the CSS template *exclude* the `:first-child` when hiding children. This might seem a little strange at first glance: why not just hide all the children?" But, the answer is quite straight forward: we need to have the clickable element with the `click:toggle_closed` reaction visible for us to have something to click on to toggle the view back on.

### Example 3: changing text

Can doubledots change the DOM? You betya!

```html
<script src="www.htmldoubledots.com/topdoubledots.js"></script>
<script>
  customReactions.define("plus_one", function() {
    const el = this.ownerElement;
    el.innerText = parseInt(el.innerText) + 1;
  });
</script>

<p>can we add to the meaning of life?</p>
<div click:plus_one>42/div>
```

### Example 4: changing DOM

To illustrate how we can change the DOM, we will make a TODO list. If  you `click` on any item in the list, you will move that item to the top of the list. If you right-click (ie. `contextmenu`) on an item, then that item will be moved from the TODO list and over to a DONE list.

```html
<script src="www.htmldoubledots.com/topdoubledots.js"></script>
<script>
  customReactions.define("up", function(e){
    const el = this.ownerElement;
    const parent = el.parentNode;
    parent.prepend(el);
  });
  customReactions.define("move", function(e){
    const el = this.ownerElement;
    const parent = el.parentNode;
    const uncle = parent.nextElementSibling || parent.previousElementSibling;
    uncle.append(el);
  });
</script>

<ol>
  <lh>TODO</lh>
  <li>buy milk</li>
  <li>cut the grass</li>
  <li>walk the dog</li>
</ol>
<ol>
  <lh>DONE</lh>
</ol>
```






<!-- ./doc/3_chaining_definition.md -->


# Chain reactions and custom reaction definitions (part 1)

## 1. chain reactions

In doubledots you chain reactions like this: `event:reaction1:reaction2:...`. When the `event` triggers, it is first passed to `:reaction1`, then `:reaction2`, etc.etc.

```html
<div click:get_date:add_two_days:subtract_one_month>hello</div>
```

## 2. define custom reactions

The first reaction in the chain is passed a single argument: the event object. But, when the second reaction is called, it is passed *two* arguments: the event object *and* the output of the previous reaction. 

```javascript
customReactions.define("get_date", ()=>new Date());
customReactions.define("add_two_days", function(e, date){
  date.setDate(date.getDate() + 2);
  return date;
});
customReactions.define("subtract_one_month", function(e, date){
  date.setMonth(date.getMonth() - 1);
  return date;
});
```

In the example above, the two last reactions are getting the `date` object from the previous reaction as the second argument. 

>> Note. In the documentation, we often refer to the two arguments of the custom reactions as `e` for "event" and `oi` for "output-input".

## 3. `this` in customReactions

Inside a reaction function `this` points to the attribute object (the `Attr`). 

```html
<div click:log_name:log_value:log_tagname="hello">
  sunshine
</div>

<script>
  customReactions.define("log_name", () => console.log(this.name));
  customReactions.define("log_value", () => console.log(this.value));
  customReactions.define("log_tagname", 
    () => console.log(this.ownerElement.tagName)
  );
</script>
```

This can be a little confusing because customReactions look a lot like normal event listeners, and in an event listener the `this` points to the element the listener is associated with. 

Why? Why would doubledot confuse us and make `this` the attribute node, and not the element node? The reason has to do with the `.value` property of the attribute. With `this` being the attribute, then all relevant properties of a custom reaction can be reached using normal dom node traversal (ie. `this.ownerElement`, `this.value`, `this.ownerElement.parentNode.querySelector(..)` etc.). If `this` pointed to the element, then we would need to add some special context attribute or parameter to the custom reaction function to tell it where the `.value` associated with the custom reaction is.

>> Note! In html doubledots, the `this` is the attribute node. To get the element node, you need to write `this.ownerElement`.

## 4. Can i use existing functions as custom reactions?

Yes! No problem. We can for example do this by adding a `console.log` reaction at the end of the previous example.

```html
<div click:get_date:add_two_days:subtract_one_month:console.log>
  hello
</div>

<script>
  customReactions.define("log", (e, oi) => console.log(e, oi));
  // or simply
  // customReactions.define("log", console.log);
</script>
```

When the virtual event loop inside doubledots invoke the reaction, it does so by `.call`-ing the registered function with the `Attr` object that is the custom reaction as the `this` object and passing it the trigger `Event` as the first argument, and the output (if any) from the previous reaction `oi` as the second argument. 

In practice, this excludes all methods (ie. functions that rely on and use `this` inside). But if the function doesn't use `this` and has an argument structure that fits with the `(e, oi)` argument list, then it is no problem just defining that function as a custom reaction.





<!-- ./doc/4_break_chain_reactions.md -->


# Breaking chain reactions

There are two ways a chain reaction can be broken:
1. if the custom reaction function `return` a special object `customReaction.break`, or
2. if the custom reaction function `throws` an `Error`.

## 1. `customReactions.break`

By returning `customReactions.break`, the custom reaction chain will simply stop running and let the next custom reaction chain continue.

```html
<div click:one:stop:two>hello sunshine</div>
<script>
customReactions.define("one", ()=> console.log("one"));
customReactions.define("stop", ()=> customReactions.break);
customReactions.define("two", ()=> console.log("two"));
</script>
```

When somebody `click` on the `<div>`, then:
1. the `:one` reaction will run and print `one` in the console,
2. the `:stop` reaction will run and return `customReactions.break`, which
3. will halt the execution of the reaction chain blocking the `:two` reaction from ever being invoked.

>> Note! Remember to `return customReactions.break` (DON'T `throw`).

## 2. Filters

Custom reaction functions that sometimes break the reaction chain are called filters. Filters check the state of for example:
1. the event,
2. the attribute `.value`,
3. the surrounding dom (such as another attribute or the content of the `.ownerElement` or another ancestor, sibling, descendant, and/or querySelected element), and/or
4. Some other external source (such as a web database, a sensor, or similar).

If some state conditions are (not) met, then the filter will `.break` the custom reaction, otherwise it will let the chain reaction continue.


## 3. Filters, parsers, extractors, etc.

A filter is not limited to `.break`-ing the reaction chain. If you want, and you often do, you can let the filter extract and parse and reduce state data the way you need. The ready-made state view can then be passed to the next reaction to work with (as it's second `oi` argument).

```html
<p 
  click:words_with_o:log
  click:words_with_x:log
  click:words_with_e:log
>hello sunshine</p>
<script>
  function words_with(str, c){
    return str.split(" ").filter(w => w.indexOf(c) >= 0);
  }
  customReactions.define("words_with_o", function(){
    const o_words = words_with(this.ownerElement.innerText,"o");
    if(!o_words.length)
      return customReactions.break;  
    return o_words;
  });
  customReactions.define("words_with_x", function(){
    const x_words = words_with(this.ownerElement.innerText,"x");
    if(!x_words.length)
      return customReactions.break;  
    return x_words;
  });
  customReactions.define("words_with_e", function(){
    const e_words =  words_with(this.ownerElement.innerText,"e");
    if(!e_words.length)
      return customReactions.break;  
    return e_words;
  });
</script>
```

## 4. `customReactions.index`

In addition to `.define` the `customReactions` object has another special property: `.index`. The `.index` is the current position of the execution of the current custom reaction within the custom reaction chain/attribute.

```html
<div click:one:two:three:one>hello sunshine</div>
```

1. During the first run of reaction `:one`, then `customReactions.index == 1`.
2. During reaction `:two`, then `customReactions.index` is `2`.
3. During reaciton `:three`, then `3`.
4. During the second run of reaction `:one`, then finally `4`.

The `customReactions.index` is not a property you will use all that much. But it can be handy when you need to implement semi control structures and other reflexive or code-oriented functionality. And yes, you are right, it is kinda like the old, deprecate global `event` property.

## 5. What about `error`s?

Like when you return a `customReaction.break`, any uncaught `Error`s that occur inside a reaction function will also breaks the reaction chain. But, unlike the `customReaction.break`s, these uncaught `Error`s will also spawn a `error` event that will be dispatched to the virtual event loop. This `error` event will have several properties that might be useful when debugging:
1. `.reaction`: the custom reaction attribute from where the `Error` occured,
2. `.index`: the reaction function that `throw` the `Error`,
3. `.oi`: the input to that reaction function,
4. `.triggerEvent`: the `event` passed into the custom reaction, and
5. `.error`: the JS `Error` object thrown.

```html
<body error:log_error>
<div click:one:error:two>hello sunshine</div>
<script>
  function logName(e){
    const reactionName = this.name.split(":")[customReaction.index];
    console.log(reactionName);
    return reactionName;
  }
customReactions.define("one", logName);
customReactions.define("error", function()=>{throw new Error("omg");});
customReactions.define("two", logName);
customReactions.define("log_error", function(e){
  console.error(e.reaction.name); 
  console.error(e.reaction.index); 
  console.error(e.reaction.event); 
  console.error(e.reaction.oi); 
  console.error(e.reaction.error); 
});
</script>
</body>
```

## 6. Chains, monads, nested functions, or what?

A chain reaction is just a sequence of custom reaction functions called one after another. Simple. And some of you might have encountered similar structures as function chaining and monads. For example in JS arrays and jQuery. Or you might recognize them as a series of linearly nested functions.
 
It is possible to argue that the custom reactions are monadic. The monad would be the attribute itself, and the custom reactions are then mapped against this attribute. The attribute (with the `oi` property) gives a viewpoint/pin-hole-frame of the DOM, and each reaction alters the underlying state. Not unlike a monad. Sure.

But. Personally. I think that the conceptual model `trigger => filter => effect` is a more useful perspective. This perspective readily describe what you will be making 95% of the time. And this structure will make your code concise, readable and super effective.

In addition to such normal custom reaction chains, you have a second type `attr-change:machine="state"` reaction. These statemachines we will return to shortly.




<!-- ./doc/4_event_loop_globals.md -->


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

Single attribute events do not propagate. They only trigger the *one* custom reaction. That's that for those.

But for the element events (both the single document and all documents events), the custom reactions are executed in the following sequence:

1. _global reactions. Each reaction is run in the sequence it was added. _global reactions only run on elements and custom reaction attributes that are connected to the DOM.
2. bubble the path, target and up. The path is calculated at the beginning of the bubble propagation, and cannot add any elements during propagation, (but elements can be removed from the propgation path).
3. For each element, the custom reaction attributes are triggered left to right. As with elements in the path, the list of custom reactions are calculated at the beginning of propagation, and then custom reaction attributes can be removed from the list, but not added. 
4. After the event has finished bubbling, the default action will be run. 




## `onclick` and other native handlers are treated like `click:on`

we need to implement the `:on` attribute. and then we can match against onclick and `startswith("click:")`
 
1. the normal event loop, propagation as bubbling.
2. the _global reactions as pre-propagation.
3. postPropagation() actions, cancellable and non-cancellable
4. events on a custom reaction only
4. adding your own default actions.

### `stopPropagation()` and `preventDefault()` and `setDefault()`  and `hasDefault()` and `postPropagation(cb)`
this is a much more advanced set of properties for the event loop.
also. `stopPropagation()` is not allowed. And `e.preventDefault()` should still work.




<!-- ./doc/5_load_times.md -->


# How to trigger custom reactions when the document loads?

Two main issues:
1. document loading and parsing and waiting for initial resources
2. most often actually associated with waiting for definitions to be ready, not waiting for style and/or dom.






<!-- ./doc/6_create_custom_events.md -->







<!-- ./doc/7_native_default_actions.md -->


## native default actions?

No native default actions run by default, iff the event has been added to the virtual event loop. This means that in html doubledots, you activate all native default actions that you want to use by adding a special customReaction called `:nda`. `:nda` stands for "native default action", but it is also a reminder that the inner workings of the native default actions are as hidden and magical to us  regular developers as if they were sealed behind an Non-Disclosure Agreement.

To activate 

There are three ways to activate native default actions.

1. Add a global for a specific type of event and add the `:nda`. For example, the global `_click:nda` placed anywhere in the html template will activate the native default actions for all click events in the app. Anywhere!!

2. Add a semi global event listener to an  ancestor of a big part of the html tree. For example, adding `<main contextmenu:nda>` will enable the default action of opening the contextmenu on right clicks on all rightclicks inside the `<main>` element, but not elsewhere in the code.

3. Add the native default action on a play-by-play basis. For example, you want to filter a click event on a link, and only given certain click events, you want to add the default action.

```html
<a href="bbc.com" click:is_active:nda>hello sunshine</a>
```

In the example above, you can imagine the flow of control in this way.

1. When doubledots receives the `click` event, and puts it in the virtual event loop, then it will cancel the native default action by default. This is done, so that there are no reactions that are spawned from the virtual event loop that there is no trace of.

2. But then, the `click:is_active:nda` checks that a certain condition `:is_active` is met, and if so, it re-adds the native default action of the `click` event.

This is backwards. In normal HTML, the native default actions *run by default* and you must actively *disable* them by calling `e.preventDefault()`; in doubledots, the native default actions are *inactive by default*, so instead you must actively *enable* them by calling `:nda`.





<!-- ./doc/api-call/api-call_example.md -->


# Demo: How to handle forms

## 1. Template

We will start with a basic registration. We will ask for a username, password and confirmation, and a profile picture.

```html
<body>
  <h1>Registry example</h1>
  <form click:submit:log>
    <input type="text" id="user" placeholder="user" />
    <input type="text" id="password" placeholder="password" />
    <input type="text" id="passwordconf" placeholder="passwordconf" />
    <input type="file" name="profile" id="profile" />
    <button type="submit" id="submit">Submit</button>
  </form>
</body>
```

## 2. Data validation.

We will validate data will doubledots filters.

```html
<script>
  customReactions.define("passVal", function (e) {
    let password = document.getElementById("password").value;
    let passwordconf = document.getElementById("passwordconf").value;

    if (passwordconf.length <= 8) return;

    if (password.length <= 8) {
      throw new Error("Password too short");
      throw customReactions.break;
    }

    //TODO: ADD MORE PASSWORD VALIDATION

    if (password !== passwordconf) {
      throw new Error("Passwords do not match");
      throw customReactions.break;
    }
  });

  customReactions.define("fileVal", function (e) {
    let profile = document.getElementById("profile").files[0];
    if (profile.size > 1000000) {
      throw new Error("File too large");
      throw customReactions.break;
    }
    if (profile.filetype !== "image/png") {
      throw new Error("wrong file type");
      throw customReactions.break;
    }
  });
</script>
```

## 3. Add form submition

After validating data, we submit the form. We do this by asigning a click to the form

?? SHOULD WE ADD THIS.OWNERELEMENT.FORMDATA ??

```html
<script>
  customReactions.define("submit", async function (e) {
    e.preventDefault();

    // if not in the submit button, break the chain
    if (e.target.id !== "submit") throw customReactions.break;

    let user = document.getElementById("user").value;
    let password = document.getElementById("password").value;
    let profile = document.getElementById("profile").files[0];

    let formData = new FormData();
    formData.append("user", user);
    formData.append("password", password);
    formData.append("profile", profile);

    let response = await fetch("/api/register", {
      method: "POST",
      body: formData,
    });

    let data = await response.json();
    if (data.error) throw new Error(data.error);

    return data;
  });
</script>
```

## 4. Add response reaction

For this demo we simple log the response to the console.

```html
<script>
  customReactions.define("log", function (e, i) {
    console.log(i);
  });
</script>
```

## 5. Putting it all together

We make the complete attribute `click:passVal:fileVal:submit:log` on the form element. We also place the validation on each of the input fields as needed.

```html
<form click:passVal:fileVal:submit:log>
  <input type="text" id="user" placeholder="user" />
  <input type="text" change:passVal id="password" placeholder="password" />
  <input type="text" change:passVal id="passwordconf" placeholder="passwordconf" />
  <input type="file" change:fileVal name="profile" id="profile" />
  <button type="submit" id="submit">Submit</button>
</form>
```





<!-- ./doc/calculator/1_calculator.md -->


Known steps:

1. make the layout of a calculator. This can likely be stolen from template on the web, just find one with a simple template. Use the two lines variant, 1 = state, 2 = input. That is the simplest to make.

2. add reactions to the different buttons.

We need to break the task down in the different steps. We need to explain what happens in the different steps. I think that we should be able to create the calculator now.

### QUESTIONS

A. How would we pass an argument to a function? If an event is similar to another it is common for a function to be derived that needs a variable to assign the function's behaviour. Defining the same funtion multiple times would be bloated. 

>> add the value either in an attribute on the element/parentElement or elsewhere in the dom, for example, or hardcode it in the custom reaction def.

>> static arguments can be passed as part of the name, so to speak. look for tutorial on how to write script higher-order custom reaction functions.

B. Can customReactions access the event? Data could be retrieved from attributes rather than variables.

>> yes. The `e` is the first argument passed to the custom reaction function.

C. What considerations are beeing taken for accessibility of disabled people? Some page readers use semantics to read page parts out loud.

>> except from the example with replacing the `<a href>` tag with `click:open`, html doubledots only add info to the dom, it doesn't remove it. So. For accessibility readers and the like, this more stateful dom will be easier to adapt for accessiblity concerns.

D. How can I add eventlisteners to the window? such as scroll or keypresses.

>> global event listeners: `_scroll`, and `_keypress`.

E. Is it .parentElement or .ownerElement? When should each be made?

>> the `this` is the attribute, *not* the element. And thus the `this.ownerElement` is from the custom reaction attribute => element. (todo should we implement `.element` and `.parent`..)

F. How does the chaining of operators work? What are the connectors available? Is there a template to follow when using events conditionally?

>> See a chapter on chaining and the (`e`, `i`) and `i` input (and the third argument position. No, this we implement as a .getter on the `Attr` prototype!! 
`function(){ return this.ownerElement.attributes.indexOf(this)});`

Currently only click events are defined.

Part 1: simple calculator
First, we implement using small functions we write directly.

Part 2: scientific calculator
For scientific calculator, we import the Math.js lib and a couple of functions from there to illustrate how external libraries can be used in the system.
Math.js library is used for evaluations.


### Strategy: development

1. made the template. and that wasn't hard, it was nice to see the code, and you got the buttons and screen visible in the browser.

2. and then, we have buttons. press the button with a `click` and then add the value to the screen.

3. but we added the calculation also as string. js allows this, but it is a little `eval()`-ish. and so, we want to do it the calculator way. add numbers to the end of input, and when press a operator button, do the operator on the result, input and set the new value in the result only. 

3b. Lesson learned. Don't be too afraid of making a new customReaction. They are like little kittens. One is not enough, and you don't want to swarm your appartment with them, but having a handful in one basket is nice and cosy.

4. what about keypresses? yes! we do keypresses, and here we can do them globally. Or on a wrapping `<form>` if our calculator doesn't have the entire web page to itself. Yes, global listeners are nice, and then we use a single reaction to execute the functions.
>> redundancy? Yes, maybe. If we want, we can convert the keypresses into button presses. That would follow the logic of our development process. But! We can also convert the button presses to keypresses. That would be nicer.

5. And we are learning as we go. We actually want the custom reactions to listen on a `<form>` element around the table. And then we want the clicks to be transferred so that it can work against the children with particular `id` values. That will be a nice and clean loopkup structure, not accidentally mixing itself up with the dom.





<!-- ./doc/calculator/calculator_example.md -->


# Demo: How to build a calculator

## 1. Template first

In this example we implement doubledots on a classic calculator. We start with the pure, normal html template and lay it out:

```html
only the calculator, link to the css, table, no custom reaction nor script

<html>
  <head>
    <title>Simple Calculator</title>
    <link rel="stylesheet" href="./calc.css" type="text/css" />
  </head>

  <body>
    <table id="calculator">
      <tr>
        <td id="result"></td>
      </tr>
      <tr>
        <td id="operation"></td>
      </tr>
      <tr>
        <td id="input"></td>
      </tr>
      <tr>
        <td class="operator">C</td>
      </tr>
      <tr>
        <td class="number">1</td>
        <td class="number">2</td>
        <td class="number">3</td>
        <td class="operator">/</td>
      </tr>
      <tr>
        <td class="number">4</td>
        <td class="number">5</td>
        <td class="number">6</td>
        <td class="operator">*</td>
      </tr>
      <tr>
        <td class="number">7</td>
        <td class="number">8</td>
        <td class="number">9</td>
        <td class="operator">-</td>
      </tr>
      <tr>
        <td class="number">0</td>
        <td class="number">.</td>
        <td class="operator">=</td>
        <td class="operator">+</td>
      </tr>
    </table>
  </body>
</html>
```

## 2. Add first reaction

The first reaciton is to add numbers to the input, when we click on a button inside the calculator. First, we do this by adding a the custom reaction `click:add_number` to the container parent that is the closest ancestor to all the elements involved.

```html
<table id="calculator" click:add_number>
  . . .
</table>
<script>
  customReactions.define("add_number", function (e, i) {
    const input = this.ownerElement.querySelector("#input");
    input.innerText += i;
  });
</script>
```

Problems: the reaction doesn't have a check. if you click something other than a number, we have errors.

## 3. add filter

How to fix this? we add a filter in the chain `click:is_number:add_number`

```html
<table id="calculator" click:add_number>
  . . .
</table>
<script>
  customReactions.define("is_number", function (e) {
    if (["result", "operation", "input"].indexOf(e.target.id) >= 0) throw customReactions.break;
    if (e.target.innerText.matches(/0-9/)) return e.target.innerText;
    throw customReactions.break;
  });
  customReactions.define("add_number", function (e, i) {
    const input = this.ownerElement.querySelector("#input");
    input.innerText += i;
  });
</script>
```

## 4. add the operator function

Let's build the entire calculator. Here we need to explain the logic with the previous operator and the hidden result etc. Once the strategy is explained, just add the extra custom reaction definitions, and the custom reaction invocations on the `<table>` element.

```html

<table id="calculator" _keypress:is_number:add_number>
  . . .
</table>
<script>

  customReactions.define("is_operator", function (e) {
    if (["result", "operation", "input"].indexOf(e.target.id) >= 0) throw customReactions.break;
    if (e.type === "keypress") {
      if (e.key === "Esc") return "clear";
      if (["=", "+", "-", "/", "*"].indexOf(e.key) >= 0) return e.key;
    }
    if (e.type === "click") {
      const targetTxt = e.target.innerText;
      if (["=", "+", "-", "/", "*", "clear"].indexOf(targetTxt) >= 0) return targetTxt;
    }
    throw customReactions.break;
  });

  customReactions.define("do_operator", function (e, i) {
    . . . (calculator logic) . . .
  });

</script>
```

## 5. add the keypress functionality

With a calculator you want multiple events. Add reactions for keypress too.

```html

<table id="calculator" _keypress:is_number:add_number>
  . . .
</table>
<script>
  customReactions.define("is_number", function (e) {
    if (["result", "operation", "input"].indexOf(e.target.id) >= 0) throw customReactions.break;
    if (e.type === "keypress" && e.key.matches(/0-9/)) return e.key;
    if (e.type === "click" && e.target.innerText.matches(/0-9/)) return e.target.innerText;
    throw customReactions.break;
  });
  customReactions.define("add_number", function (e, i) {
    const input = this.ownerElement.querySelector("#input");
    input.innerText += i;
  });
</script>
```





<!-- ./doc/carousele/carousele_example.md -->


# Demo: Building an Image carousele.

## 1. Template
## 2. Define function
## 3. Asign funtions to reactions


<!-- Leaving this undone untill gestures -->





<!-- ./doc/infinite-scroll/scroll_example.md -->


# Demo: building infinite scroll with doubledots.

In this demo we will build an infinite scroll functionality that relies on observing a loader element.

## 1. Template

We make a basic template for the functionality.

```html
<body>
  <h1>Infinite Scroll Example</h1>

  <div id="grid"></div>
  <div inView:loadmore>Loading</div>
</body>
```




<!-- ./doc/theme-toggle/theme_example.md -->


# Demo: Build a theme toggle.

In this basic demo we will implement a theme toggle for our html with doubledots.

## 1. Template

We set up a basic html to see the results from our toggle. 

```html
<body>
  <h1>Theme Toggle Example</h1>

  <button click:themeTogle>Toggle Theme</button>
</body>
```

## 2. Define reaction

We manage the toggle by defining a reaction that when triggered, will toggle the 'dark' class.

```html
  <script>
    customReaction.define('themeTogle', () => {
      document.body.classList.toggle('dark')
    })
  </script>
```

And done! The themeTogle reaction can be assigned to other events aswell.


<!-- Should this example be continued? We could add a window event that when on load, checks cache for a preference stored previously, or browser preferences. -->




<!-- ./doc/todo_list.md -->


Assumed easy:
A. Calculator

B. Htmx

* Redux. The act of having _global listeners where the event is global, needs to be filtered for relevance, and then should enact a reaction on an element in the dom. So the event listeners should be associated with the "place" in the state where the effect will occur, not associated with the element where the state change/event is triggered.

C. `_first-interactive:` event. `_ready:` event. etc. These events are generated as statemachines. Most often we want the chain that follows to run async, as a thread: `_ready::then-something`. Similar to dcl events. Global  statemachines should be added to one of the top elements: `<html :first-interactivable>`, or `<head :my-kind-of-ready>`.

D. `:`, `:wait-for-it::` reactions. onLoad reactions that wait for all  the definitions to be loaded before it runs.


Assumed hard:

* Json to template. React. Template engines. This is probably the main JS task in the web. I can imagine that somewhere between 25-50% of all js code on the web is written to tackle this task. The state data coming from the server ALWAYS needs to be massaged. You want it not to, ref HTMX, but you end up doing it still. What type of function that you want, what format coming in, and how you want that format to be made into HTML, that is something that needs to be written. But. If you have a declarative template language like handlebars, hyperHTML or something similar, then you can add those functions as reactions easily in the dom. The problem is where to put the html template code, but that is always a problem.

B. Stateful gestures

C. Stateful functions

D. Chained reactions where more than one reaction needs the attr value.

Questions


A. Can we combine filters ?





<!-- ./doc/x_native_event_loop_problems.md -->


# Problems with the native event loop

The main flow of control an HTML application is the event loop. The event loop is a queue. An event occurs, and it is added to the queue. The browser then executes each event, one by one.

To react to an event, the developer can add functions called "event listeners" for different types of events to different elements in the DOM. When the browser executes an event, the browser first will find the "path" for the event. The path is the "target" of the event and all the ancestor nodes of the target. The browser then "propagates" over this list of DOM nodes and calls the event listeners for that event on each node in the path.

There are several (unnecessary) complexities in the way the native event loop is set up:

1. The way the browser creates the path is tricky. First, some events are so-called "not composed", and when the browser makes the path for these events, the path will stop at the nearest document or shadowRoot node. But the path will include the elements in the shadowRoot of other web components that "slot" in the event. For some focus events, at least in some older versions of the browser, the non-composed events could be stopped on a higher shadowRoot one or two level up, but still not include some or more higher ligthDoms.

2. Once the path is set up, the browser will first go _down_ the path in a so-called capture phase, and then _up_ the path in the so-called bubble phase. Most developers only concern themselves with the bubble phase, but because the event loop enables both, slicky capture event listeners might sneak into a developers code-base and cause strange behavior.

3. In addition, the browser enable _some_ events to bubble, while others are so-called non-bubbling events. Non-bubbling events should in theory not bubble, and so one might be exused for thinking that such events will only trigger event listeners on the target node itself. Or, that the path for such event listeners only include one element: the target. But. Not so. The non-bubbling target focus only applies to the bubbling phase. Thus, event listeners for non-bubbling events will trigger in the capture phase on ancestors of the target. And! When the target is inside a web component, then the host node of that web component will also be considered "a target", and not an ancestor, and thus the non-bubbling events will be "reverse bubbling in the capture phase" and "ancestor host nodes are targets, not and not parent nodes". Non-bubbling frobscottle.

4. For some native events the event listeners get their own macro task. Some don't. What does "getting your own macro task" mean you say? And which events gets what? All good questions! When an event listener gets a macro task, it means that any micro task that completes during the execution of that event listener will be run before the next macro task, ie. before the next event listener for that event is run. Same DOM node or not. Microtasks are such things as MutationObserver callbacks, web component callbacks, and promise resultion or errors. The events that gets a macro task for their running are usually UI events such as `click` and `keypress`, but I don't know of any consensus or autorative list where this is written down.

5. `setTimeout` are also macro tasks that are queued in the event loop. But they cause no event propagation, and they are added using callback structure, not event listeners. There are also special rules regarding the timeout callbacks, such as the 4ms minimum delay, and low priority, meaning that if you want to call a *true* `setTimeout(.., 0)`, you need to do:
```javascript
function setTimeout0(cb){
  const a = document.createElement("audio");
  a.onratechange = cb;
  a.playbackRate = 2;
}
```

6. When a `<script>` runs, it also is given a macro task: the running of a script is a task in the event loop. In Firefox this /script/ macro task/event is preceeded by a regular `beforescriptexecute` event, while in the other browsers, you can only intercept this event by adding a MutationObserver to the node onto which the event is added. 

7. Custom events, that are dispatched using `.dispatchEvent(..)` are *not* added to the event loop. They are not "event" in the "event loop" meaning of the word. They do *not* get their own macro task, and they run *before* the native event which triggered them are finished. This means that if you in a `click` event listener dispatch your own `custom-event`, then maybe a handful of `click` event listeners will run, then a handfull of `custom-event` listeners, and then some more `click` event listeners for the same, original `click` event. Nested niceness. But. With all super convoluted systems, it is the possibility to know super intricate trivia and cool tricks: You only need to do a `setTimeout0(()=>element.dispatchEvent(customEvent))` to dispath a custom event *properly*.

8. When the propagation path is calculated, you cannot later add new elements to the path (such as by inserting a new ancestor), nor remove elements from the propagation path (such as by moving the current target to another branch of the dom). This makes sense, this kind of move-during-event-propagation would be super confusing and could easily turn into infinite loops. But, at the same time, it causes the path to sometimes become a "stale" representation of the DOM, somewhat dynamic (updated anew for each event), but still static (if the DOM changes during propagation, this change doesn't affect which elements' listeners will be invoked).

9. The same problem with semi-stale dynamic ability applies to listeners per element. If you add another event listener to the currentTarget of an event, then that listener will not run on the same event. However, if you remove a later event listener on the same element for the same event, then that event listener will *not* run. This makes sense in practice, and rarely cause any problems, but it is still small-print-details that specify a series of special points in time, ie. when-path-is-calculated and when-listeners-on-an-element-is-gotten, that the developer should take into account when adding and removing event listeners during propagation, or (re)moving elements in the current propagation path.


