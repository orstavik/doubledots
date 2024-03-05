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
