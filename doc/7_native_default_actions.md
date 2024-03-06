## native default actions?

No native default actions run by default, iff the event has been added to the virtual event loop. This means that in html doubledots, you activate all native default actions that you want to use by adding a special customReaction called `:nda`. `:nda` stands for "native default action", but it is also a reminder that the inner workings of the native default actions are as hidden and magical to us  regular developers as if they were sealed behind an Non-Disclosure Agreement.

To activate 

There are three ways to activate native default actions.

1. Add a global for a specific type of event and add the `:nda`. For example, the global `_click:nda` placed anywhere in the html template will activate the native default actions for all click events in the app. Anywhere!!

2. Add a semi global event listener to an  ancestor of a big part of the html tree. For example, adding `<main contextmenu:nda>` will enable the default action of opening the contextmenu on right clicks on all rightclicks inside the `<main>` element, but not elsewhere in the code.

3. Add the native default action on a play-by-play basis. For example, you want to filter a click event on a link, and only given certain click events, you want to add the default action.

```html
<a href="bbc.com" click:is_active:nda>hello sunshine</a>
```

In the example above, you can imagine the flow of control in this way.

1. When doubledots receives the `click` event, and puts it in the virtual event loop, then it will cancel the native default action by default. This is done, so that there are no reactions that are spawned from the virtual event loop that there is no trace of.

2. But then, the `click:is_active:nda` checks that a certain condition `:is_active` is met, and if so, it re-adds the native default action of the `click` event.

This is backwards. In normal HTML, the native default actions *run by default* and you must actively *disable* them by calling `e.preventDefault()`; in doubledots, the native default actions are *inactive by default*, so instead you must actively *enable* them by calling `:nda`.
