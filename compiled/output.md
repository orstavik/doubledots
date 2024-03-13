

<!-- ./README.md -->


# doubledots
The re-discovery of HTML





<!-- ./doc/10_define_reactions_rule.md -->


# Reaction rules!

There are two ways to define custom reactions: 
1. normal reactions (`customReaction.define("name", reaction)`), and
2. reaction rules (`customReaction.defineRule("prefix", rule)`). 

## HowTo define a reaction rule

When you define a reaction rule, you pass in two parameters: `prefix` and `rule`.

1. The `prefix` is a `String` that will be matched against any reaction name. If you for example pass in `"."` as the prefix for a reaction rule, then all reaction names that starts with `"."` such as `.open` or `..` or `.-` will be recognised as belonging to this rule. 

2. The `rule` is a higher-order function. A higher-order function is a function that returns another function. The `rule` is a function that will be given a single argument: the full name of the reaction that is matched. The `rule` function must return a `Function` object. This output `Function` will then be matched with all subsequent reactions with that specific name.

## When are reaction rules interpreted?

The virtual event loop will try to interpret the reaction rule into a normal reaction function when it is first encountered.

## Example 1: `toggle-attribute`

We have a web application with two very similar reactions: `toggle-attribute_hidden` and `toggle-attribute_open`. This is kinda annoying, what we want is to have a single reaction `toggle-attribute` and then pass in the attribute names `hidden` and `open` as arguments. To accomplish this, we can use reaction rules.

```html
<details click:toggle-attr_open>
<summary click:toggle-attr_hidden>single use open</summary>
you cannot unsee what you have seen.
</details>
<script>
  customReactions.defineRule("toggle-attr_", function(name){
    const attrName = name.split("_").pop();
    return function(e,oi) {
      this.ownerElement.toggleAttribute(name);
    };
  })
</script>
```

>> Note: since you are using the `_` to separate a required argument, it is beneficial to add `_` to the rule prefix.

## Example 2: `sleep_`

We want to implement a version of `sleep` so that we don't have to define a new reaction every time we want to change the duration of the sleep function. Again, we can accomplish this with a reaction rule.

```html
<div 
  click:sun_rise::sleep_5000:sun_set:sleep_3000:..-4
  >hello sunshine</div>
<script>
  customReactions.defineRule("sleep_", function(name){
    const duration = name.split("_").pop();
    return _ => new Promise(r=>setTimeout(r, duration));
  });
  customReactions.defineRule("sun_", function(name){
    const riseOrSet = name.split("_").pop();
    if(riseOrSet === "rise")
      return function(e,oi){
        this.ownerElement.classList.add("sun");
      }
    return function(e,oi){
      this.ownerElement.classList.remove("sun");
    }
  });
  customReactions.defineRule("..", function(name){
    const pos = parseInt(name.substring(2));
    return _ => customReactions.goto(pos);
  });
</script>
```

## Example 3: mirpo remembers another one

1. command and flags in bash? do we have something similar?
2. can we pass arguments to our reactions? Or are the arguments always only `e, oi`?

## Name and rule conflicts

It is *not* possible to define reaction names and reaction rule prefices that overlap. If you do that, your code will `throw` a `ReactionNameError`. For example:

```js
customReactions.define("attribute-open", ...);
customReactions.defineRule("attr", ...);  //fails!
```

or

```js
customReactions.defineRule("attr", ...);
customReactions.define("attribute-open", ...);  //fails!
```

To avoid such naming conflicts, the following conventions are smart to follow:
1. reaction names that start with `.` and `-` are often used as reaction rules. Avoid having normal reactions start with `.` and `-`. (You can make your own custom reactions for `.` and `-` if you like.)
2. For reaction rules such as `toggle-attribute_` and `sleep_` keep the `_` as part of the reaction name.
3. Avoid using short and generic names such as `attr` as reaction rule name. This will likely cause problems.
4. For normal reactions, try to avoid using both `_` and `.` in the reaction name. For normal reactions, english letters and `-` are most often enough. If you find that a `.` or `_` is necessary in your reaction name, this can be a signal that you might want to write a reaction rule instead of a normal reaction.





<!-- ./doc/11_The dot-rules.md -->


# The `.` rules

```js
customReactions.defineRule(".", function(name){
  if (name===".")
    return (e, oi) => oi || customReactions.break;

  if (name==="..")
    return (e, oi) => oi && customReactions.break;

  const [_, jump] = name.matches(/\.\.(d+)/) || [];
  if (jump) //att! no goto(0)
    return (e, oi) => oi ? customReactions.goto(jump) : oi;
    
  const [_, kName] = name.matches(/\.(a-z-)/) || [];
  if (kName) {
    const cName = kName.replace(/(-\w)/g, m=> m[1].toUpperCase());
    return function(e, oi) {
      const p = this[cName];
      return p instanceof Function ? p.call(oi) : p;
    };
  }
  throw new SyntaxError(`The name: "{name}" doesn't match the "."rule`);
});
```

## The default filter reaction `:.:` and `:..:`

The default dot-rule handles `:.` as a filter that breaks if the input is `falsy`. If the Link to the definition of falsy on mdn. If the `oi` input is truey, then the `:.` will let the `oi` "pass through".

The `:..` works the same way, but in reverse. If the `oi` is `falsy`, the reaction just lets it through; if the `oi` is `truey`, then the reaction will break.

## The `:..3` jump

The `:..` specifies a jump. It is useful to implement control structures. The `:..X` where X must be a positive or negative integer. If the `oi` is falsy, then the jump will not happen.

>> todo. should jump be triggered on truey, falsey, or always?

## To `:.kebab-reflection` is to `this.kebabReflection(oi)`

The `:.-a-z` turns the reaction name after `.` into a camelCase property name. The reaction will then look for the property on the `this` object for the reaction. If the property is a function, it will call it, using the `oi` as the only argument. Otherwise, it will simply return the property value.

Kebab reflection primarily enable doubledots developers to access:
1. the `.value` on attributes,
2. methods such as `.dispatch-event` and `.first-element-child` on `HTMLElement`s,
3. properties on events such as `.time-stamp` and `.x` on `PointerEvent`s,  
4. custom methods on web components or other html element based modules, and 
5. methods and properties on state-machine attributes.

When you need to have your custom name space for reactions associated with an HTML node such as a state-machine attribute or a web component, then using `:.kebab-reflection` is very helpful and makes a lot of sense for the developer.

## Have your cake and eat it

The `:.`-rule only reserves the `.` as the first character of reaction names. You can still make your own custom reactions that return `customReactions.goto()` and `customReactions.break` or that does method invocation on html nodes any way you would like. And, if you don't like the logic and feel of the `.`-reactions, simply exclude it. That is the benefit of having this functionality implemented as reaction rule, and not hard coded into the syntax of html doubledots.




<!-- ./doc/12_The dash-rules.md -->


# The `-` rules

```js
customReactions.defineRule("-", function(name){
  if (name==="-") {
    return function(e, oi){
      if (oi instanceof Object)
        return customReactions.origin(oi);
      throw new DashReactionError(`"${oi}" is not an Object.`);
    }
  }
  if (name==="-a")
    return e => customReactions.origin(e.currentAttribute);
  if (name==="-el")
    return e => customReactions.origin(e.currentElement);
  if (name[1] === "-")
    throw new ReactionError(`--something is not supported yet: ${name}`);
  name = name.substring(1);
  return function(e,oi) {
    for (let attr of e.currentElement.attributes)
      if (attr.name.replace(":", "_").startsWith(name))
        return customReactions.origin(attr);
  }
});
```

## The `:-` dash reaction

The purpose of the dash reaction is to move the origin of the reaction chain to either an HTMLElement and an HTML attribute (here collectively called html nodes as they are the only `Node` types that are visible in HTML template).

### List of `:-` reactions

1. `:-` => turns `oi` into `this` iff `oi instanceof Object`.
2. `:-e` => turns the `e` into `this`.
3. `:-el` => turns the `.currentElement` into `this`.
4. `:-a` => turns the `.currentAttribute` into `this`. This essentially returns the origin of the reaction chain to its default position.
5. `:-attribute_name` => finds the first attribute on the `.currentElement` that starts with `attribute-name` where any `:` in the attribute name is treated as a `_`.

>> Note: For the first :reaction in the chain, this is equivalent to the `:-` as the first reaction is passed the `e` as both the `e` and `oi` argument.

## Have your cake and eat it

If you want, you can always create your own custom reactions that alters the origin of the reaction chain by returning an object wrapped in `customReactions.origin(obj)`. It is also possible to not implement the default `-` dash rule, or implement your own version of the `-` dash rule.

Thus, different developers can use different objects as their origin root for their reaction chain. It is therefore possible to go to a more jQuery, Set/monadic style if you want. 

The use and combination of dash and dot reactions was originally built to support ease of implementation of gestures where gestures create children reactions that quickly need to transpose their reactions onto the gesture state machine reaction, and where the gesture state machine also needs to hide the definition of its own reaction within its own namespace, so as to not flood the global reaction registry with possible many longwinded and likely overlapping custom reaction functions.





<!-- ./doc/13_schedulars.md -->


# Schedular reactions

## `::r` the `::ready` reaction

## `:debounce_` rule

## `:throttle_` rule

```js
//regular reaction implementation of throttle, cap = 1000ms
const active = new WeakSet();
customReactions.define("throttle", async function (e, oi) {
  const key = e.currentAttribute;
  if (active.has(key)) return customReactions.break;
  active.add(key);
  await new Promise((r) => setTimeout(r, 1000));
  active.delete(key);
  return oi;
});

// custom reaction rule implementation of throttle, throttle_cap = 1000ms
customReactions.defineRule("throttle_", function (name) {
  const active = new WeakSet();
  const delay = name.split("_")[1];
  return function (e, oi) {
    const key = e.currentAttribute;
    if (active.has(key)) return customReactions.break;
    active.add(key);
    return new Promise((r) => setTimeout(r, delay)).then(() => {
      active.delete(key);
      return oi;
    });
  };
});
```

Look more at RxJS





<!-- ./doc/14_load_times.md -->


# How to trigger custom reactions when the document loads?

Two main issues:
1. document loading and parsing and waiting for initial resources
2. most often actually associated with waiting for definitions to be ready, not waiting for style and/or dom.






<!-- ./doc/14_state_machine.md -->


# state machines




<!-- ./doc/15_gestures.md -->


# gestures




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




<!-- ./doc/5_event_loop_globals.md -->


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

**Pre-propagation:** _global reactions. Each reaction is run in the sequence it was added. _global reactions only run on elements and custom reaction attributes that are connected to the DOM.

**Propagation:** bubble the path, target and up. The path is calculated at the beginning of the bubble propagation. This means that if you insert an ancestor element in an event reaction, then this element will not be included in the propagation path. However, if you remove an ancestor element, then this change will be registered, and any event reactions on it will not be triggered. And the final note: if an ancestor is added in the _global reaction stage, then those ancestors will trigger the propagation. Also, if a _global reaction removes the target element of the event from the DOM, then that will remove the entire path.

For each element, the custom reaction attributes are triggered left to right. As with elements in the path, the list of custom reactions are calculated at the beginning of propagation, and then custom reaction attributes can be removed from the list, but not added. 

**Post-propagation:** After the event has finished bubbling, the default action will be triggered. Default actions are cancellable, ie. if the `e.preventDefault()` has been called on a default action, then no default action reactions will be triggered.


## No more `.stopPropagation()` 

`.stopPropagation()` and `.stopImmediatePropagation()` is not part of the virtual event loop. The reason for this is that it is a problematic concept when different developers are supposed to collaborate across shadowDom boundaries. Here is why:

Imagine that you use another web component around some of the elements in your lightDom. Now inside the web component, there is an event listener that calls `.stopPropagation()` on some of your events, some of the time. This is not clearly specified in the web components docs. And you didn't anticipate this behavior. Will this behavior likely cause more or less problems in your code than not having `.stopPropagation()`?

There are use-cases where you need functionality similar to `.stopPropagation()`. However, this is most likely something that can better be achieved using flags on the `Event` object itself. These flags should only be added below, and then read above. Or counted in a linear direction. You should not remove or overwrite the value of such flags. If you follow these principles, your code will be more immutable and easier to manage over time.






<!-- ./doc/6_threads_async_mode.md -->


# Threads and async mode `::`

The ability to run functions such as network requests in the background without causing the entire functionality of the browser to freeze, is great. In JS anno 2024, this is done via `async function` s. `async functions` essentially start a thread that it will run in, so that the browser can continue performing other tasks.

## Async race condition

To illustrate the problem with the threaded nature of JS, let us take a look at an example. 

```html
<web-comp click:call_web-comp_method>
  <div click:load:define_web-comp="WebComp.js">hello race</div>
</web-comp>
```
//todo convert the :reaction into `onclick`.

We imagine that we have a `<web-comp>` that we only load and define the definition of when we `click` on one of its child nodes. Also, when the `<web-comp>` is `click`ed, there will be a reaction run that rely on one of the methods of that web component. Now:

1. We *know* that the event listener that loads and defines the web component inside the web component is run *before* the event listener on the event listener that rely on this definition.
2. We also *know* that the event listener that loads the WebComp runs inside an async event listener function, so there will be no problem with the loading and defining function causing the browser to freeze.
3. So. Everything should be fine. The `:call_web-comp_method` is triggered after the `:define_web-comp` listener, ensuring that the definition is loaded before it is used. And the `async`ability will ensure that the browser doesn't freeze while loading the network resource.

Not quite. Many of you will probably have already seen the problem. Because the `:load:define_web-comp` listener is async, it will be threaded. This happens as soon as the browser encounters its first `await` (even when that `await` does not need to wait for a `Promise`). And this means that the event loop will spawn a micro task for the first event listener `:load:define_web-comp`, and hurry onwards to the next event listener *before* the resource has been loaded and defined. So. When the second listener is started, the definition of the `<web-comp>` has not yet been loaded, and `:call_web-comp_method` will fail. It is a race condition. Caused by a misunderstanding of the threaded nature of async event listeners. So. The event loop only fains single-threadedness. It isn't really.

## The *sync* virtual event loop

At its core, the virtual event loop is *sync*. This means that any custom reaction will be completed *before* the any other custom reaction is run. Yes, you heard right! You *can* halt *all* execution of custom reactions if you need to wait for a `Promise` inside a custom reaction. You can force the browser to freeze and wait for something, when and if you really want.

```html
<web-comp click:call_web-comp_method>
  <div click:load:define_web-comp="WebComp.js">hello race</div>
</web-comp>
```

If you did this, then the event loop would essentially *halt* all its other operations while waiting for `:load` to complete, thus ensuring that `:call_web-comp_method` would not be triggered until the definition was ready.

## The *async*, threaded virtual event loop `::`

But, at its fringes, the virtual event loop is also *async*. If you add the empty reaction `":"` in your reaction chain, then the event loop will *not* pause and wait for any `Promise`s in the rest of that reaction chain, but allow the rest of that reaction chain to be run in a thread.

The empty reaction looks like a double colon prefix: `::load`. Essentially the double colon says that if the virtual event loop encounters a `Promise` *after* the `::`, then it will not halt the progression of the event loop, but instead create a thread that the rest of this reaction chain can run in. Between events, the virtual event loop will process and complete these loose threads.

This means that we in Doubledots would do the following:

```html
<web-comp click::known-element:call_web-comp_method>
  <div click::load:define_web-comp="WebComp.js">hello race</div>
</web-comp>
```

Here we are add `::` before `::load` and a new `::known-element` reaction. This means that the `::load:define_web-comp` reaction will run in parallel with the event loop. At the same time, the `::known-element:call_web-comp_method` will also run in a thread. This second thread will for example poll to check if the `<web-comp>` has been given a definition yet, or not.

## Why `::`?

The ability to see *when* event listeners run in sync and async mode is *extremely* beneficial.

The ability to *force* the event loop and execution to wait for a system critical resource is also *very nice*, when you need it.

Furthermore, having the event loop work this way enables tooling to with great clarity illustrate what threads are active when and why. And when these threads resolve. You can imagine it as follows:
1. the event loop as a stack of cards. 
2. Each event is a card. Everything that happens is an event. And each event has finished propagating before the next one runs.
3. For each event, you have a numbered list of reactionchains.
4. Each reactionchain is divided into `:`-separated reactions.

Furthermore, to make it easier to read:
5. Every completed reaction that has completed is highlighted in green.
6. Every failing reaction that throws an `Error` is highlighted in red.
7. Every post-fail reaction in the same reaction chain as a failed reaction is highlighted in orange.
8. Every non-run reaction that is not run because a previous reaction returned `customReactions.break` is highlighted in grey.

And then, the really good stuff:
9. Every reaction that is started as a thread, ie. a reaction after `::` that returns a promise and that the browser has spawned into a thread is marked darkblue.
10. Once the darkblue reaction resolves, the reaction is marked with light blue.

This means that at any time, you can look at all the cards in the loop and see:
* what threads are currently active? all the lightblue reactions.
* what are the reactions that will follow these reactions? All the non-highlighted reactions that follow the reaction.
* Race condition? Yes, please, 'cause I want to see(!!) them:D




<!-- ./doc/7_default_actions.md -->


# Default actions

First. You have heard the term many times. "Default actions". You know that the default action of a `click` on a link is to open that web page. Second. You know that you can stop them by calling `e.preventDefault()`. So you can stop the opening of web pages. And maybe you have even stopped the opening of the context menu by calling `e.preventDefault()` on the `contextmenu` event. PopQuiz: do you know if there is a `click` event for a `rightclick` mouse button? Or is a rightclick event *only* followed by a `contextmenu` event? Confused yet?

My point with this little introduction/digression was to illustrate the vagueness that surrounds the concept of default actions. You are not alone in feeling wobly when talking about default actions. And I am here to comfort you:) Because it is not you; it is them! Default actions are poorly documented. They are in the so-called "domain of the browser developers". That means that in principle the browsers developers could attach their own, and it would be fine with the agreed upon "rules of the web". But of course the world doesn't work like that. So what the "domain of the browser developers" mean is that the browser developers can do them slightly different if they want to/have to, and that they therefore don't need to document them. How can you do a `rightclick` on a mac that has only one mouse button?

## Default actions in the virtual event loop

A default action in the virtual event loop is *one* function that will be run *immediately after* an element event has finished bubbling. It is a **post-propagation** callback.

In the virtual event loop, you can add and remove a default action continuously. This means that you can *add* a default action A, then *prevent* the default action, then *add* a new default action B. It creates a **default action list**: `[A, -, B]`.

The default action list enables the developer to read the event loop at different times and recognize what default actions commands where given for any event. This list also enables the developer to re-add a default action after `:prevent-da` has been called.

The default action list is slightly more complex than illustrated above, because it also keeps track about in *which* document the default action command was made. This means that default action commands in *lower*, slotting web components will *loose* to default action commands made in a higher up lightDom.

When the virtual event loop finishes bubbling the event, it will process the default action list in the following manner:
1. `pop()` the **last default action** from the default action list.
2. run through the rest of the default action list and mark the actions as `prevented`.
3. run the last default action.

## Default action reactions

The virtual event loop has three different custom reactions to control default actions.

1. `::da`
2. `:prevent-da`
3. `:nda`

### `:da`

You can add your own a default actions by using the `::da` custom reaction. The `::da` must always be preceded by `::`. This is because it is an async that will not continue until the sync event loop has finished the propagation of the event.

You can add `:da` multiple times. It is *only* the *last default action* from the *top-most* document, that will run.

### `:prevent-da` and `e.preventDefault()`

To stop the default action, you can use the `:prevent-da` custom reaction. You can also call `e.preventDefault()` inside one of your own custom reactions.

> Rule of thumb: the `:prevent-da` should be positioned before the `::` async-/thread-mode marker. It makes sense if you think about it. Or read the chapter about `::` async/thread mode.

There is something important to note about default actions. The `:prevent-da` cannot prevent a default action added in document above. Ie. if `:prevent-da` is called from a shadowDom, that will not be able to block a default action added on a child element in the lightDom.

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

If the default action commands from all the documents were equal, then the `<web-comp>` would cancel the default action in the document above. This type of behavior is too hidden. Cloaked. Sneaky. So, in the virtual event loop, default actions are sorted in the hierarchy they are added.

### `:nda` Native Default Action

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





<!-- ./doc/8_custom_triggers.md -->


# custom `trigger:`

## Undefined event triggers: `click:` and `_click:`

When an event propagates, it will trigger reaction chain that contain the 

## Define a `trigger:`

In Doubledots you can also define your own `trigger:`. Triggers are event factories, sort of. Some are atomic and simple, like `set-timeout_10:` or `attr-change_style:` for example. Others are complex state machines like `swipeable` and `drag-n-drop`. In this chapter we start with the simple ones.

To define a trigger is very similar to defining a reaction rule, except that the definition is not a function, but a `class` that `extends Attr`. This is what it looks like:

```js
customReactions.defineTrigger("prefix", class MyTrigger extends Attr{
  this;//=> the attribute node
});
```

Inside the trigger `class` you must implement *one* function called `upgrade(fullname)`. The `upgrade(fullname){...}` function is the constructor of the trigger (and if it wasn't impossible to invoke constructors using reflection in JS, it would have been called the `constructor(...)` too). 

The `"prefix"` is the start of the trigger names that this definition will be applied to. No trigger prefix can overlap with another trigger prefix, but the reaction names and rule prefixes are completely separate from the trigger prefixes. 

The `prefix` *cannot* startsWith `_`, `-`, or `.`. This will cause conflict with `_global` triggers, or come into conflict with HTML parsing of attributes. 

The `prefix` *should* endsWith either `_` (if it parses name string arguments) or `able` (common for gestures). If the `prefix` does not endsWith the above, it should include either a `_`, or `.` so that it will not overlap with event names.

The `upgrade(fullname)` callback is called immediately/asap when the trigger is created. Inside the `upgrade(){...}` the `this` is the attribute node that the custom trigger is part of. (In a previous version of Doubledots, custom triggers were named custom attributes, but we have changed this to make it clearer that the trigger is not the full attribute, but only part of it.) The argument `fullname` is the full name of the trigger. So, as with reaction rules, it is possible to pass arguments to your triggers as the tail of the trigger name.

## `this.dispatchEvent()` and `this.ownerElement.dispatchEvent()`

The purpose of triggers is to `dispatchEvent()`. There are two targets that the trigger *should* dispatch events too:
1. `this` (the attribute)
2. `this.ownerElement` (the element)

> It is possible to dispatch events on other targets too, but you should try to avoid this if you can. The golden rule is that triggers dispatch events on either the attribute or element they are attached to.

Events that are dispatched to an attribute only trigger the reactionchain on that particular attribute. No bubbling. No _global reactions. Triggers that dispatch single attribute only events are therefore "simpler" and "atomic". Technically, the event type name and the trigger name do not have to match, but in practice it is common to give the custom attribute event the same name as the trigger prefix.

Events that are dispatched on the element will trigger all reactionchains for _global reactions and for trigger names matching its type name on other elements that it bubbles to. For such triggers you should therefore *not* give their custom event's the same type name as the prefix or full name of the trigger. For example, `swipeable` will dispatch `swipe` and `swipe-end` events.

Triggers that dispatch full, normal, propagating element events are commonly more complex and stateful than triggers that dispatch simple, atomic attribute events. We will therefore discuss these triggers in subsequent chapters and here only focus on simple, atomic, stateless triggers.

Event type names *cannot* startsWith `_`. Event type names *should not* contain `.` nor `_` and endsWith `able`.

## Simple, atomic, (almost) stateless triggers

### `attr_xyz:`

Custom triggers replace all the native Observers in JS. In this example we use the Doubledots implementation of the attribute-change-trigger called `attr_xyz:`. This trigger essentially maps the behavior of `MutationObserver.observe(el, {attribute: true, attributeList: [x,y,z]})` into Doubledots:

```html
<script>
  class AttrTrigger extends Attr{

    async upgrade(attr_xyz) {
      const [_, ...list] = attr_xyz.split("_");
      const mo = new MutationObserver(mrs=>{
        if (!this.isConnected)
          return mo.disconnect();
        for (let mr of mrs) {
          const e = new Event("attr");
          //e.changedAttributes = {name: oldValue,...};
          this.dispatchEvent(e);
        }
      });
      const settings = list.length? 
        {attribute: true, attributeList: list} :
        {attribute: true};
      mo.observe(this.ownerElement, settings);
    }
  }
  customReactions.defineTrigger("attr_", IntervalAttr);
  customReactions.defineReaction("log", console.log);
</script>

<h1 attr_class:log class="sun shine">hello</h1>
```

### `inview:`

In this example we use the `IntersectionObserver` to create a custom `inview:` trigger. `inview:` dispatches a new attribute event and triggers the reaction chain on the custom attribute every time the element it is attached to switches from out-of-view to in-view:

```html
<script>
  class InviewTrigger extends Attr{

    async upgrade(inview_thresholdPerc) {
      const threshold = parseInt(inview_thresholdPerc.split("_")[1]) / 100;
      const iso = new IntersectionObserver(_ => {
        if (!this.isConnected)
          return iso.disconnect();
        this.dispatchEvent(new Event("inview"));
      });
      const options = { threshold, root: null, rootMargin: '0px' };
      iso.observe(this.ownerElement, options);
    }
  }
  customReactions.defineTrigger("inview_", IntervalAttr);
  customReactions.defineReaction("hello", _ => console.log("sunshine"));
</script>

<div style="height: 130vh">scroll for it</div>
<h1 inview_1:hello>hello sunshine</h1>
```

### `timeout_x:` 

The atomic `timeout_x:` trigger dispatches an attribute event type `timeout` that will run its reaction chain once after delay of x ms.

```html
<script>
  class TimeoutTrigger extends Attr{
    async upgrade(timeout_time) {
      const delay = timeout_time.split("_")[1];
      await sleep(delay);
      if(this.isConnected) //Doubledots adds this method to Attr too
        this.dispatchEvent(new Event("timeout"));
    }
  }
  customReactions.defineTrigger("timeout_", TimeoutAttr);
  customReactions.defineReaction("log", console.log);
</script>

<h1 timeout_1000:log>hello sunshine</h1>
```

The `timeout_x:` does not use `setTimeout`, but `await sleep()` instead. The reason for this is that Doubledots deprecates `setTimeout()` and instead provides an `await sleep()` instead. There are two reasons why `setTimeout()` is deprecated:
1. It enables a new event to be added from JS without any trace in the HTML template,
2. To use `await sleep()` inside `async function`s yield easier to read code.

However. In Doubledots, it is recommended to use `::sleep_x:` reaction rule instead:

```html
<script>
  customReactions.defineReactionRule(":sleep_", function(sleep_x){
    const delay = parseInt(sleep_x.split("_")[1]);
    return async function(e, oi){
      await sleep(delay);
      return oi;
    }
  });
  customReactions.defineReaction("log", console.log);
</script>

<h1 ::sleep_1000:log>hello sunshine</h1>
```

The benefits of using the `::sleep_x` instead of a `timeout_x:` are:
1. The reaction chain will be added to the event loop. This means that any tooling that illustrate the event loop, will also illustrate when the reaction chain is awaiting the `setTimeout`.
2. The `::sleep_x` is more versatile. You can add other reactions infront of it, and with one reaction rule you can solve more use-cases than with the `timeout_x:`.

### `interval_x:`

```html
<script>
  class IntervalTrigger extends Attr{
    async upgrade(timeout_time) {
      const delay = timeout_time.split("_")[1];
      while (true) {
        await sleep(delay);
        if (!this.isConnected)
          return;
        this.dispatchEvent(new Event("interval"));
      }
    }
  }
  customReactions.defineTrigger("interval_", IntervalAttr);
  customReactions.defineReaction("log", console.log);
</script>

<h1 timeout_1000:log>hello sunshine</h1>
```

The `interval_x:` works better than `timeout_x:` as a trigger. But, we can also implement `interval_x:` using `::sleep_x` and `:..-x`:

```html
<script>
  //customReactions.defineReactionRule(".", dotReactionRule) //see later chapter
  customReactions.defineReactionRule(":sleep_", function(sleep_x){
    const delay = parseInt(sleep_x.split("_")[1]);
    return async function(e, oi){
      await sleep(delay);
      return oi;
    }
  });
  customReactions.defineReaction("log", console.log);
</script>

<h1 ::sleep_1000:log:..-2>hello sunshine</h1>
```

This implementation is using the `.` reaction rule to step -2 positions in the reaction rule, ie. back to the `:sleep_1000` reaction. This is more difficult to read, and it is easy to make a typo using the `:..-2` loop/goto mechanism. However, the benefit is still:
1. The reaction chain will be added to the event loop. And it is visible to any tooling that show the state of the event loop.
2. Again, we only use `:sleep_x` and `:.`, two reaction rules that are part of the Doubledots core (as opposed to `timeout_x:` and `interval_x:` that are not).

## Trigger destruction and cleanup

In Doubledots, neither attribute nor element nodes can be put back into the DOM once they have been disconnected. In Doubledots, the concept is that if an HTML node is no longer in the DOM, it should be considered garbage.

This means that:
1. if an internal callback in a trigger is triggered, and
2. the trigger attribute is either has no `.ownerElement` or that `.ownerElement.isConnected === false`, then
3. the trigger should be considered garbage, and
4. that any active stop, cleanup, or other garbage collection tasks can and should be performed.



## We skip `destructor()`

>> todo: can we skip this? Will MutationObserver work as a WeakSet allowing elements to be gc'ed? or is the 

In addition, you *can* implement another function called `destructor()`. The `destructor()` is as the name implies the method called when the trigger is removed.

The `destructor()` is necessary in *some* custom triggers. No, I think when we can't take attributes and elements in and out of the DOM, this is no longer necessary.




<!-- ./doc/9_defining_reactions_advanced.md -->


# Defining custom reactions part2

A reaction function can return anything, and what the reaction function returns will be the `oi` of the next reaction in the chain. And if a reaction function throws an `Error`, then that reaction chain will break and an `Error` event will be added in the event loop. Ok, so far so good.

In addition, custom reactions can return three special types of values:

1. `customReaction.break`
2. `customReactions.goto(int)`
3. `customReaction.origin(obj)`

We have already seen how `customReactions.break` as a special return value from a reaction can halt the reaction chain (as expected) without adding an `Error` event to the event loop. So here we will look only at the two others.

## `customReactions.goto(int)`

To be able to implement control structures such as `if else` and `for`-loops, custom reactions need to be able to control the execution sequence in the custom reaction chain.

If you `return customReactions.goto(1)`, then the custom reaction chain will skip the next (one) reaction. `return customReactions.goto(3)` will skip the next 3 reactions. For example:

```html
<div click:a:j1:b:j1>hello sunshine</div>
<script>
  customReactions.define("a", _ => return "a");
  customReactions.define("b", _ => return "b");
  customReactions.define("j1", function(e, oi){
    console.log(oi);
    return customReactions.goto(1);
  });
</script>
```

The above example will run 
1. the `:a` reaction that returns `"a"` as the `oi` to the next reaction.
2. the `:j1` reaction will `console.log` the `oi` input, which is `"a"` and then return a `jump` 1 forward. When such a jump is initiated, the `oi` and `this` remains the same for the reaction coming after the jump as it was coming into the reaction performing the jump. 
3. the `:b` is then skipped, jumped over.
4. the second `:j1` is then triggered, with the same `oi` as before the jump, which makes the second `j1` also print `"a"`.
5. As the second `j1` returns a jump, and this jump goes beyond the scope of the reaction chain, an `ReactionChainError` is `throw`n.

### Reverse jumps

If you `return customReactions.goto(0)`, then the custom reaction will repeat itself. If you `return customReactions.goto(-1)`, then the custom reaction chain will go back to the previous reaction. `return customReactions.goto(-3)` will go back three places.

```html
<div click:n1:t2:lt64_-2>hello sunshine</div>
<script>
  customReactions.define("n1", (e,oi) => isNaN(oi) ? 1 : oi);
  customReactions.define("t2", (e,oi) => oi*2);
  customReactions.define("lt64_-2", function(e, oi) {
    if (oi < 64)
      return customReactions.goto(1);
    console.log(oi);
  });
</script>
```

The above example will run 
1. the `:n1` will ensure that the `oi` is a number, or start with 1.
2. the `:t2` will multiply the `oi` with two.
3. the `:lt64_-2` will check that if the number is less than 64, it will go back two steps to `:n1`.
4. This creates a loop, that multiplies a number, starting with 1, by 2, until the value is 64 or over.

## `customReactions.origin(obj)`

The `this` object for the custom reaction is by default, and at the start of *every* custom reaction chain, the current reaction attriubte. But. You can change this. In order to change this, you need to have a custom reaction that returns a special `origin` wrapped object.

If you for example have a customReaction that `return customReactions.origin(this.ownerElement)`, then for the next reaction, the `this` of the reaction function will be the element that the custom Reaction is attached to.





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

3. In addition, the browser enable _some_ events to bubble, while others are so-called non-bubbling events. Non-bubbling events should in theory not bubble, and so one might be exused for thinking that such events will only trigger event listeners on the target node itself. Or, that the path for such event listeners only includes one element: the target. But. Not so. The non-bubbling target focus only applies to the bubbling phase. Thus, event listeners for non-bubbling events will trigger in the capture phase on ancestors of the target. And! When the target is inside a web component, then the host node of that web component will also be considered "a target", and not an ancestor, and thus the non-bubbling events will be "reverse bubbling in the capture phase" and "ancestor host nodes are targets, not and not parent nodes". Non-bubbling frobscottle.

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




<!-- ./doc/y_onclick_handlers.md -->


# `onclick` and global native handler attributes

HTML has its own old custom reaction handlers that are available in the DOM. There are several problems with these native in-html event listeners.
0. They allow you to run pure js code that has not been vetted in your application. 
1. You can only have one per event.
2. You directly interpret js from the value of the attribute.
3. You are missing the ability to declare your own triggers.
4. The structure of the reaction chain is missing.
5. The `::` which highlights which of the reactions should run sync and which should run async is missing.

## Strategies for handling `onclick` handlers

1. make them illegal by throwing an `Error` everytime an attribute named `on`+native event name is discovered. This is the best strategy as `onclick` handlers are neither easy to read and based on the unsafe evaluation of text as code.

2. whenever an `onclick` event handler is added, switch it out with `click:on` instead. This creates a more uniform structure, but then it is better to define the `customReactions` by other means.

3. add additional check in the virtual event loop that will recognize `onclick` as if it was `click:on`. This provides backwards compatibility, but not something that is likely needed or something that should be encouraged to build on.

## The `:on` reaction

Regardless of strategy, if you want to implement a custom reaction `:on` in doubledots, this is how you would do it:

```javascript
async function getHandler(txt){
  const urlBlob = URL.createObjectURL(new Blob([`export default function(e){${txt}}`], {type : 'text/javascript'}));
  const module = await fetch(urlBlob);
  return module.default;
}

customReactions.define("on", async function(e){
  const handler = await getHandler(this.value);
  return handler.call(this, e);
});
```

The problem is that `eval(function(e){...})` and `new Function("e", ...)` are not allowed in JS anymore. The workaround employed above is using the `import` with a urlBlob instead. This will at least invoke the text code in a module context. Slightly safer? maybe not. Slightly more cumbersome? Yes. Slightly. Slightly less efficient? Yes, very much so. Are we seeing some of the problems of the native global handlers from this approach? Yes.

A slightly more efficient version is this:

```javascript
const handlerCache = {};
async function handlerTextToFunction(txt){
  const urlBlob = URL.createObjectURL(new Blob([`export default function(e){${txt}}`], {type : 'text/javascript'}));
  const module = await fetch(urlBlob);
  return module.default;
}

async function getHandler(txt){
  const cache = handlerCache[txt];
  if (cache)
    return cache;
  return handlerCache[txt] = await handlerTextToFunction(txt);
}

customReactions.define("on", async function(e){
  const handler = await getHandler(this.value);
  return handler.call(this, e);
});
```

However, the problem with this one is that the event loop (native and virtual), is forced to wait for a `Promise` even when the required function has already been parsed and cached. This is because `async` in front of `function` *always* will make the function return a `Promise`, even when it doesn't need to.

## The most efficient `:on` reaction

Thus, to make the most efficient version of `:on`, we must make the two outermost functions work with `Promise`s directly. Like so:

```javascript
async function handlerTextToFunction(txt){
  const urlBlob = URL.createObjectURL(new Blob([`export default function(e){${txt}}`], {type : 'text/javascript'}));
  const module = await fetch(urlBlob);
  return module.default;
}

const handlerCache = {};
function getHandler(txt){
  const cache = handlerCache[txt];
  if (cache)
    return cache;
  const p = handlerTextToFunction(txt);
  handlerCache[txt] = p;
  p.then(func => handlerCache[txt] = func);
  return p;
}

customReactions.define("on", function(e) {
  const handler = getHandler(this.value);
  if (handler instanceof Function)
    return handler.call(this, e);
  return handler.then(func => func.call(this.e));
});
```

Here, the reaction function(s) will not encounter or work with a `Promise` when the specific version of the function has not been changed. It is not likely that you will encounter many such situations, but if you do, the goal of this description of `:on` is that you will have a point of reference that is easy to understand as to how you can implement a caching function call that avoids creating `Promise`s when they are not needed.





<!-- ./doc/z_event_priority.md -->


# Event priority

## Is life too boring? Nuke the moon!

Over time, the native event loop has become stratified. At the beginning there was a single planet (the planet being the DOM) and a single moon orbiting that planet (the moon being event(s) and the orbit the event loop). Then. Somebody decided that it might be a good idea to nuke the moon. Twice! Boom! Boom! And what was before a very tidy thing: one moon in orbit around a planet, became something completely different: one broken-ass moon orbiting that same planet, but now with a myriad of smaller fragments orbit the moon, in different tempo and bumping into each other. Each of these small fragments of course being micro tasks, `Promise` async threadbits, and custom events being run nestedly.

Ok. So the picture isn't as orderly as it once was. The event loop, which before was this nice single threaded single moon orbiting that planet, is now like a clusterf..k of shrapnel hurtling around the earth and each other just waiting to perforate anything that is sent their way. Isj.. Not good.

But. Why? Why on earth would somebody do that? Nuke the moon, what were they thinking?! Why?? 

There were not *one* reason, but *two*. Or, most people say it was one reason. But from the viewpoint of the virtual event loop, I think there are two good reasons for it, and so I list those.

1. asyncability: letting the main application function while waiting for async operations such as network requests run in the background.
2. event priority: letting some events get higher priority while pausing less frequent events.

Asyncability has been talked about before. Enough. So I will just say that the ability to "step into async, thread mode" is good. Doubledots support it, both in a literal and principal sense. But event priority is less understood. Another one of the "domain of the browser developers". So we need to talk a little bit about it here.

## Event priority

1. Custom events.

When the ability to dispatch your own custom events arose in the browser, they decided that such events should be given top priority. If the web developer decided that something was worth being dispatched as an event, then that event should come first in line. Actually, it was given such priority that it would run even before the current event was finished. Nestedly. 

Personally, I think that was the wrong choice. Custom, developer made events could have been added first in the event loop. If you during a `click` event `.dispatchEvent(myCustomAlert)`, you could let the all the `click` event listeners finish first, and then process the `myCustomAlert` listeners. But ok. Nuke it!

2. Micro tasks.

A `MutationObserver` registers callback functions that are to run after a change in the DOM occurs. `MutationObserver` callbacks are *intended* to be "micro tasks": small automatic operations such as adding or removing a css class to an element depending on a certain DOM make up.

If these functions lag, then small changes that only update the view to make it align with the state of the application will lag. And so, it was decided that these changes should all be updated before the next event "macro macro task" be let loose. Can we build it? Yes! Yes we can!

It is important to note, that the micro tasks essentially are non-propagating tasks that instead of being put in a different queue (micro task queue), could have been just considered top-priority events, where each event only triggers a single callback (no propagation). But. That would have been plain vanilla. Too easy to spec and build.

3. `setTimeout(callback, 0is4)`

In the other end of the scale, we find events that should be deprioritized. `setTimeout` is one of them. Since these callbacks are functions that the developers actively mark as "something that can wait", the browser should let other events sneak past it in the event loop. Sure. That is nice.

But. Due to the wild wild nature of the web, the moon nuking engineers also found that the web at a certain point in time worked better if `setTimeout(.., 0)` actually meant `setTimeout(.., 4)`. This is just another example of how the browsers control the priority of events behind the scenes.

### Virtual event loop priority

So. When we now create a virtual event loop, we can control now explicitly control the priority of events. Wee can say that we want events to be processed in the following tiers. Thus, even though mutation observers are added to the virtual event loop, we can still specify that we want them to sneak before some other events, but not others.

And, we also need to specify that started, threaded reactions that are ready to continue, should continue before the next event is dispatched in the virtual event loop.

The event loop tiers should look something like this:
1. targetedMutationObservers
1. low level, high priority system events (element-created, most likely targeting a framework/foundational code.)
2. errors (`error` to be handled early) (ok, you are just going to log it, and that you could do dead last, but you might have done some correcting actions, and those would have been good to do early.)
2. custom events (`my-data-update`)
3. ui events (`click` etc.)
3. system events (`readystatechange`)
4. rafs (you can wait just a little)
4. timeouts (you can wait for a long time)

There are other problems too. Some events run as a single macro task (less important ones, todo find an example again); some events run each event listener as a macro task (`click`). This means that some events process micro tasks such as MutationObservers in between event listeners, and some don't. We can think of these `click` event listeners as... a meso task? Something in between a micro and macro task. But this level, I believe is folly. No one (in the sense of faaar below 1% of developers) will either know or intuit such behavior. But. If you are still bored, it is fireworks to be had watching that nuke do its thing on the moon.


