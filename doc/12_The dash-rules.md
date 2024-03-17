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
  if (name==="-e")
    return e => customReactions.origin(e);
  if (name==="-t")
    return e => customReactions.origin(e.target);
  if (name==="-a")
    return e => customReactions.origin(e.currentAttribute);
  if (name==="-el")
    return e => customReactions.origin(e.currentElement);
  if (name==="-p")
    return e => customReactions.origin(e.currentElement.parentNode);
  if (name==="-pp")
    return e => customReactions.origin(e.currentElement.parentNode.parentNode);
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

TODO the `:-` rules should be nested. The `:-pp-_input_radiobutton` will do `e.currentElement.parentNode.parentNode.querySelector("input[radiobutton]")`.

If they are nested, then we can keep the rule origin static?

The default implementation of the `:-` rule *shortcuts* are **static**. This means that the shortcuts are ignores the current `this` and instead interprets the origin as if they were the first reaction in the chain, always. 

The default implementation of the `:-` rule *queries* are **dynamic**. This means that the `:-` querries use the current `this` to find the 
This is a choice. This can cause confusion. The alternative would have been a **dynamic** interpretation of the `:-` rule. This might cause less confusion in some settings, and enable more complex searches.. such as This would enable more, but could cause more problems as there is no   But a choice was made. Having the `:-` shortcuts 

## List of `:-` shortcuts

There is a set of `:-` shorthands that sets a specific objects as the `this` origin of the next reaction:
1. `:-` => `oi` (fails if `!(oi instanceof Object)`.)
2. `:-e` => `e`
3. `:-t` => `e.target` (in the same document, it does not step into any shadowDoms.)
4. `:-el` => `.currentElement`
5. `:-p` => `.currentElement.parentNode`
6. `:-pp` => `.currentElement.parentNode.parentNode` 
7. `:-prev` => `.currentElement.previousSiblingElement`
8. `:-next` => `.currentElement.nextSiblingElement`
8. `:-first` => `.currentElement.nextSiblingElement`
8. `:-last` => `.currentElement.nextSiblingElement`
9. `:-a` => `.currentAttribute` (this works as a reset for origin transposition.)

>> Note: The `:-p`, `:-pp`, `:-next`, `:-prev`, `:-first`, and `:-last` rules are static: they are interpreted against the initial `element` at the beginning of the reaction chain, not the current, interpreted `this` that may fluctuate up and down and round and about in the reaction state.  It is a valid choice to implement another `:-` 

## List of `:-`-queries.

todo add query selector for children.
todo add query selector up the ancestor chain,

1. `:-attribute_name` => finds the first attribute on the `.currentElement` that starts with `attribute-name` where any `:` in the attribute name is treated as a `_`.

>> Note: For the first :reaction in the chain, this is equivalent to the `:-` as the first reaction is passed the `e` as both the `e` and `oi` argument.

## Have your cake and eat it

If you want, you can always create your own custom reactions that alters the origin of the reaction chain by returning an object wrapped in `customReactions.origin(obj)`. It is also possible to not implement the default `-` dash rule, or implement your own version of the `-` dash rule.

Thus, different developers can use different objects as their origin root for their reaction chain. It is therefore possible to go to a more jQuery, Set/monadic style if you want. 

The use and combination of dash and dot reactions was originally built to support ease of implementation of gestures where gestures create children reactions that quickly need to transpose their reactions onto the gesture state machine reaction, and where the gesture state machine also needs to hide the definition of its own reaction within its own namespace, so as to not flood the global reaction registry with possible many longwinded and likely overlapping custom reaction functions.
