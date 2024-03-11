# Intro.md

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

# Dynamic HTML.md

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

# Chaining definition.md

## Chain reactions and custom reaction definitions (part 1)

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

# Break reaction chain.md

## Breaking chain reactions

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

# Native Default Actions.md

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
