# Breaking chain reactions

There are two ways a chain reaction can be broken:
1. if the custom reaction function returns a special object `customReaction.break`, or
2. if the custom reaction function `throws` an `Error`.

## 1. `customReactions.break`

By returning `customReactions.break`, the custom reaction chain will simply stop running and let the next custom reaction chain continue.

```html
<div click:one:stop:two>hello sunshine</div>
<script>
customReactions.define("one", ()=>console.log("one"));
customReactions.define("stop", ()=>customReactions.break);
customReactions.define("two", ()=>console.log("two"));
</script>
```

When somebody `click` on the `<div>`, then:
1. the `:one` reaction will run and print `one` in the console,
2. the `:stop` reaction will run and return `customReactions.break`, which
3. will halt the execution of the reaction chain blocking the `:two` reaction from ever being invoked.

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