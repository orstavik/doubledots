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

## ToDo

`StateMachineAttr` **must** enable passing of string parameters!
!!! todo update the `.dot` rule to enable string parameter passing.!!!

should we allow for arguments to be added by the system. Like in:

```
.toggle-attribute_open
```

If we have `_arg_arg2`, then we will pass in strings?


`:.switch_on` uses the `.` reaction rule to invoke `switch("on")` on the `this` attribute we are on.


## Have your cake and eat it

The `:.`-rule only reserves the `.` as the first character of reaction names. You can still make your own custom reactions that return `customReactions.goto()` and `customReactions.break` or that does method invocation on html nodes any way you would like. And, if you don't like the logic and feel of the `.`-reactions, simply exclude it. That is the benefit of having this functionality implemented as reaction rule, and not hard coded into the syntax of html doubledots.