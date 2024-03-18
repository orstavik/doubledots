# Attribute `.value`

DRAFT

The attribute value.

this is used in the statemachines.
And it can also be used by some custom reactions, especially for urls

## when you use `customReaction.defineRule` vs `.value`?

You use rules and argumetns in triggers when:
1. they don't change, as in a statemachine, the value changes. For custom reactions, these arguments should be fixed *per reaction chain*, while the "same" reaction might use a different static value in another reaction chain.

2. The value is simple. Like a number or a short name with simple syntax (of an attribute, css class for example). When the value is a complex entity, such as a URL or json stringified text, or similar, then you need to use the `.value`.

* Use a rule if you can, use the value if it is too hard to use a rule.

## Only a single trigger or reaction can use a value

per rteaction chain. If you in a reaction chain need both the trigger and the reaction, or two reactions, to use the `.value` field, then you are in trouble. In this case, you would probably split the reactions into two chains. If this is not possible, then.. make your own value string parser? wrap the two values in a json string object, and then parse that inside both the trigger+reaction or the two reactions? As you can see, this is *not* pretty, and you can think of the lack of ability for two units in a reaction chain to *both* use the value as a *limitation* of DoubleDots. There is no principal reason why you shouldn't do this, it is just that the syntax of HTML and DoubleDots really isn't built for doing this.