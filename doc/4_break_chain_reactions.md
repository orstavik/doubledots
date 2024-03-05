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


## 3. Filters and parsers and extractors

It is common to let the filter extract, parse, and purify the state for subsequent reactions. this is the  returned from the filter reaction and will be available for the next reaction as it's second 'i' argument.

example

## 5. what about errors

Errors also break the reaction chain. if the Error is not caught and handled within the reaction function itself, it will break the chain. In addition, errors will also spawn an error event (not unlike uncaughterror) that will be added in the event loop. with a reference to the customReaction.

## 7. 'customReactions.index'

the customReactions has another special property: '.index'. The '.index' is simply a shortcut for the position of the execution of the current custom reaction in the chain. For example, if you have a custom reaction 'click:one:two:three:one', then customReaction.index == 1 for the reaction ':one' runs the first time, the 2 when ':two: runs, 3 for ';three', and finally 4 when ':four' runs.

You likely will not use this property all that much. But it can be handy if you want to implement control structures such as wait for definitions to be ready, an if-else reaction pair, etc. And yes, you are right, it is kinda like the old, deprecate global 'event' property.

## 9. nesten functions in a monadic chain?

a chain reaction is just a sequence of custom reaction functions called one after another. simple.

some might have encountered similar structures as function chaining and monads. JS arrays and jQuery. 
 
it is possible to argue that the custom reactions work on a state object (ie. the attribute object) and that as a reaction might change the state that this Attr object frames and that the custom reactions always run from the same state, that it is like a monad. Sure.

But. As for me personally. I think that the conceptual model trigger-event => filter reaction => state reaction, is a more useful perspective. This is what you will make 95% of the time. This is what will make your code concise, readable and super effective.

In addition to such normal custom reaction chains, you have a second type 'attr-change:state-machine' reaction. we will describe them later. And these two types reaction chains is all you really need, and will write.