# `Error`s in DoubleDots

DoubleDots is *not* an imperative programming language. It is declarative language.

## `error` events

DoubleDots handle errors by dispatching `events`. But. Dispatching events are costly. So, how does this effect the design of error management in DoubleDots?

**Design-time errors** are errors you can *fix design-time*. For these errors, *memory and compute cost* is *not* an issue. The main problem with these errors is to **hightlight** them enough, so that they are *caught design-time* and thus can be fixed in time. But. `error` events are easy to identify, print to console as `Error` messages. So, here `error` events fit well.

**Critical run-time errors** are errors you cannot *fix design-time*. Critical errors mean that they threaten the functioning of the app, or the validity of data, or something else that is critical. Critical means that the user and/or the developer *should be* notified.

To notify the user is super costly. To notify the user of a critical error require producing an error message where the **user can see it** (ie. **not** the `console.error`. `console.error` is only for design-time errors, it means nothing in user-land nor run-time-developer-land). Compared to the cost of mutating the DOM (in resources), then dispatching an `error` via the event loop is *low*. Also, the simplicity of `error` events in the event loop enables simpler structures *for showing the user critical errors*, thus lowering the bar for such errors to actually be shown.

To notify the developer about errors is super costly. It both takes a lot of resources, network requests, server-reads and logging etc. These "logging on server costs" dwarfs the cost of `error` events in the event loop. Furthermore, logging run-time errors on the server is very complex. It is one of the more problematic technical tasks of apps. Therefore often skipped. The simplicity of `error` events in the event loop again enables more than it disables in this case.

**Non critical run-time errors** are errors that don't really require notifying the user nor the developer about run-time. They are only relevant for adding the `console.error` for the developer when he/she test-runs his system.

## What types of errors occur in DoubleDots? 

DoubleDots produce errors in *three* situations:
1. When an illegal attribute is added to the DOM. `DoubleDotsSyntaxError`s.
2. when a reaction fails due to changed circumstances in the event loop. `DoubleDotsEventLoopErrors`.
3. when a reaction fails due to problems in the code.
4. Are there other scenarios?

### Adding illegal attributes

There are some syntactic rules for what attributes should look like. Here is a **blacklist** of illegal reactionChain constructs (in `RegExp`):

1. `::$` => Attributes cannot end with the empty attribute. It makes no sense.
2. `^[\.-]` => Attributes cannot begin with `.` or `-`. Many browsers do not allow it. The same rule is added to definition of triggers:.
3. `:::` => Attribute cannot contain a double empty.
4. `::*::` => Attribute cannot contain a two empties.

### Changing circumstances in the queue

Sometimes, circumstances might change before the reaction is triggered. This is a *design-time* error. The element or attribute or reactions are removed from the DOM after they were added to the queue, but before they are called. This is rare. This should not happen. You might have problems due to it.

### reaction code fails

A network request fails. Commonly, these sitaution threaten the sequentiality of the app state and/or the validity of data. They need to either be explicitly managed, or otherwise handled.


## `:try:...:catch:...:finally`

DoubleDots provide builtin reactions to handle errors. They all concern run-time reaction errors only.

`:try` means that all errors in the subsequent reaction chain will not spawn an `error` event, but only cause a `console.warn` message instead.

If there is a `:catch` after the `:try` reaction, then the event loop will run to the reaction after `:catch` when an error occurs. If there are no errors, then any :reaction after `:catch` will not run.

If there is a `:finally` after the `:try` (and `:catch`), then the event loop will always do those reactions in the end.

You cannot *nest* `:try:catch` in DoubleDots. This means you cannot `:try` inside the `:catch`. If you want this kind of complexity, you must use `error` events. The `:try:catch:finally` are only meant for simple *blocking* of non-critical errors that are easy to handle.

Note also that a simple `:try` is quite ok. It will essentially just prevent `error` events from being spawned.