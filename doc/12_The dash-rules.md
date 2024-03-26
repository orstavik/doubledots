# The `-dash` rule

> Hey jQuery! How are ya? :) Me? I'm doing good, thanks for asking :) But sorry for coming at you out the blue like this. I know it was a long time ago. And I didn't really make a clean break. I just started looking at some other frameworks, and then one thing led to another.. it just happened.. But I wanted to tell you that.. I see now that I was wrong. That you were right. And that we were good together, just like you said. I wish I hadn't left you the way I did. I see that now. I am truly sorry about that. But. What I waaant to say is.. I just really wanted to thank you for a really good time back then. I really enjoyed myself when I was with you. It was real. I meant all the things I wrote. I just wanted you to know that.. Anyways, thank you jQuery! For everything.

The purpose of the dash reaction is to move the origin of the reaction chain to new HTML nodes (elements or attributes). The dash rule is like a custom querySelector whose return is the movement of the `this` in the reaction chain. Here are some examples:

#### `:-e`
1. `:-e`. Dash-to the event 

`:--papa--input---attr-name`. 

The `this.parentNode.parentNode.getFirstAttributeStartingWith("attr-name")`

`:--t--pa--child0--child-1`. The `next = e.target.parentNode.children[0]; next = next.children[next.children.length - 1]`.

`:--`

`:---attribute-name_starts_with` where `:` is replaced with `_`

## The `-dash` rule makes *static reactions*

The `-dash` rule is a **static** reaction. Static reactions means that they will *work the same regardless of their position in the reaction chain*. To achieve this feat, the `-dash` rule doesn't use the `this`, but instead *always originate from the `e.currentElement` and `e.currentAttribute`.

Note. Static is a choice. It can cause confusion. The alternative to static interpretation is a dynamic interpretation of `:-` that would originate from the `this`. Dynamic query reactions/rules are fine. But they might also cause confusion in their own way. So again, a choice was made. But if you want, make your own dynamic `-dash` rule and flow with it. It was meant to be;)


## Implementation

```js
customReactions.defineRule("-", function(name) {
  if (name==="-") {
    return function(e, oi){
      if (oi instanceof Object)
        return customReactions.origin(oi);
      throw new DashReactionError(`"${oi}" is not an Object.`);
    }
  }
  if (name==="-e")
    return e => customReactions.origin(e);
  if (name==="-a")
    return e => customReactions.origin(e.currentAttribute);
  if (name==="--el")
    return e => customReactions.origin(e.currentElement);
  if (name.startsWith("--el--")){
    console.warn(`--el is unnecessary, '${name}' should be '${name.substring(4)}'.`):
    name = name.substring(4);
  }

  function makeAttributeTraverser(name){
    return function attributeTraverser(e) {
      for (let attr of e.currentElement.attributes)
        if (attr.name.replace(":", "_").startsWith(name))
          return attr;
      };
  }
  //--multi-step--query--traverser
  function makeElementTraverser(name){
    return function elementTraverser(root, e) {
      root = root.ownerElement || root;
      if (name==="t")
        return e.target;
      if (name==="prev")
        return root.previousSiblingElement;
      if (name==="next")
        return root.nextSiblingElement;
      if (name==="pa")
        return root.parentNode;
      if (name==="papa")
        return root.parentNode.parentNode;
      const [_, child] = name.matches(/child(\-?[\d]+)/);
      if (child !== undefined) 
        root.children[child[0] === "-"? root.children.length + +child : +child];
      //todo add attribute with value syntax for querySelector?
      return root.querySelector(name); 
    }
  }
  const [_, paths] = name.split("--");
  let queryAttr;
  if (paths[-1][0] === "-")
    queryAttr = makeAtributeTraverser(paths.pop().substring(1));
  const calls = paths.map(name => makeElementTraverser(name));
  return function(e, oi) {
    //the dash-rule is interpreted equally regardless of position in the reaction chain. It is static
    let root = e.currentElement;
    //if the starting point for the -dash-rule was dynamic and 
    //could change with the position in the reaction chain, we would do:
    // let root = this;  
    for (let queryE of calls)
      root = queryE(root, e);
    if(queryAttr)
      root = queryAttr(root);
    return customReactions.origin(root);
  }
});
```




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

## 4. Chains, monads, nested functions, or what?

A chain reaction is just a sequence of custom reaction functions called one after another. Simple. And some of you might have encountered similar structures as function chaining and monads. For example in JS arrays and jQuery. Or you might recognize them as a series of linearly nested functions.
 
It is possible to argue that the custom reactions are monadic. The monad would be the attribute itself, and the custom reactions are then mapped against this attribute. The attribute (with the `oi` property) gives a viewpoint/pin-hole-frame of the DOM, and each reaction alters the underlying state. Not unlike a monad. Sure.

But. Personally. I think that the conceptual model `trigger => filter => effect` is a more useful perspective. This perspective readily describe what you will be making 95% of the time. And this structure will make your code concise, readable and super effective.

In addition to such normal custom reaction chains, you have a second type `attr-change:machine="state"` reaction. These statemachines we will return to shortly.
