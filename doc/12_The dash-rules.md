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