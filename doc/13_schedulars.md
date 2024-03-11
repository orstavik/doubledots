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
