## Doubledot patterns

1. `this.ownerElement`? why *not* `document.querySelector()`?

Reusability. And portability. And comportability (that things stay near and in a small compartment). We want to minimize the distance from the locations of:
* the dom trigger,
* the dom data extractor,
* the dom mutator (effect).

Why? if this distance is short, and concretely specified, but not minutely specified, then you can transfer the exact same set of reaction to a series of smaller branches that all share the same compartment makeup. For example all the items in a shopping cart. If the compartment is a small dom branch, and all the relationships stay within this branch, and the relationships are concrete and match their targets with great specifity (such as `.parentNode` or `.nextSibling` or `this.ownerElement.querySelector(".item")`), but at the same time not overly specific so as to be connected to a specific, non-recurrent makeup (`this.ownerElement.querySelector("#product_42")`). 

If the composition of the trigger:reaction:chain is a) witin a small branch and b) uses quite generic patterns within this branch, then c) this composition is likely to reoccur in many different places, and thus the exact same trigger: andOr :reactions can be reused *as is*. This makes the trigger:reactions portable and reusable both within the same web app (as in on several similar branches in a list, like a product list), or between apps (you do more or less the same in all your webshops), and even between similar use cases (how often doesn't `click` only affect the toggling of a css class?).

When you feel that you *must* use `document.querySelector()` to search the entire app, you are likely writing single use, app specific logic. Try to do this only for the events that go back and forth from the client to the server. For manipulating data within the dom, UI interaction, try to follow the rules above.


2. how do we get the *data* from the business logic into the custom reaction functions? We get only the `e` and the mystical `oi`, but i need something simple like a productId for adding an iten to a shoppinglist. How do i get that?

Dom-extractor.

>> In the world of web development anno 2024, there is a strong common consensus that the application state should be in json and that html is only the application view. HTML is for layout only. State is json. You mix this view with a pattern like MVC for example, and M=>json, V=>html, C=>js. This consensus is not necessarily helpful. Most of the time, the HTML holds the state, as a redundant copy of the JSON. Or. The json is a redundant copy of the state in the DOM. There are problems here. Problems that are not necessarily easily solved by either following the consensus or breaking it. State. State management and redundancy can be really difficult issues to solve.

## Location of trigger:reactions

Where should event listeners be placed? we often place on root (ancestor), why not the lowest most target?

The priority helps guide you to decide where to attach a trigger:reactions.

Hard rules.
1. The trigger for element events, must be place on the target or a direct ancestor of that target. You can only choose one of those.
2. And the trigger **heavy**. You want to have the trigger as close to the target as you can.
3. Dom mutator, Dom Extractor, and Dom filters are **normal**.
4. You would like to have a clear structure that give as short "lines" from your trigger:reaction:chain location to the location of any Dom mutator, DOM Extractor, and DOM filters that are part of the :reaction:chain.
5. The shortest line is the element itself.
6. the 2nd shortest line is to the parentNode.
7. The 3rd shortest line is to the first, or last, child.
8. The 4th shortest line is to a clearly marked child `this.ownerElement.querySelector()` (by type, then attribute, then css class).
8. The 4.5th shortest line is to a direct ancestor clearly marked by type, attribute or css class. An example is to find the first ancestor that is a `<form>` or `[open]`. However, there is no equivalent to `.querySelector()` for searching up the ancestor chain. This makes lines to direct ancestors feel longer than descendants. They are not easy to write in code. However, they are very simple. An ancestor is a straight singular line. Ancestor queries are simple, just not easy (cf. Rich Hickey). So, don't let the lack of ease in making the code for the connection deter you from making reactions that rely on them.
9. The 5th shortest line is to the nextSibling or previousSibling.
10. And grandchildren, preferably well marked. Or grandparents, preferably well marked.
11. Uncles? Cousins? hm.. Maybe outside of the circle of trust?
https://www.youtube.com/watch?v=QHJGoZpFeM8
12. `:first-child` is nice. `element-type` is a firm and good selector. `[attribute]` and `.class` is ok. `#id`? ohh..  that is a fragile binding. `#spaghetti.code`?
12. Search from the `document` or `body`. This is not a short link. Try to keep things in the family. `document.querySelector("cannot-find-family[is]:not(.in.phone-book)")` 


>> Radio buttons is an example pattern. It is not the best pattern. Rarely used elsewhere, and for a reason. So try not to build lots of radio-button-patterns into your code. However, if you must, use the element type that is the shared ancestor as the location for you reaction chains, and then query descendants by type and attribute (cf. `<form>.querySelector('input[type="radiobutton"]')`). This approach also enables you to add only a single `click:` reaction on the `<form>` instead of adding a `click:` reaction to each and every `<input type=radiobutton>`.

* When children? When we have an event, that bubbles naturally, then it is easy to append a listener on the ancestor ).

## :reaction types
 
1. trigger: (click, in-view)
2. filter (read => to break):
3. extraction (read => to oi output):
4. effect (write => DOM):
5. side-effect (write => outside of DOM):
6. transformer (pure reaction, only works with `oi` or `e`)
7. control (if-loop-goto)
8. Monad (move the position of `this`)

### filter and extractor

In essence filters is control reaction, an if, that will break a reaction chain if a condition is not met. Filters are also hybrids, as they read state, most often from the event `e` or a nearby source in the DOM. But, filters is such a common recurrence, that it is given its own name.

extractor reactions *read* data. They get state. From somewhere.

:extractor functionality is often included in a :filter. Use that state as part of filtering. Or as input to an effect.

DOM locations to extract data from:
1. The event `e`. But this extraction is often redundant as the event is the first argument to all reactions. So, extracting event info is often done directly in a :filter or :effect or :transformer.
2. DOM. Attribute values and text of preferably as close relatives as possible, or special global elements whose purpose is to store state. Like <meta elements. Wide searches in the dom should we try to avoid.

External locations to extract data from:
1. `fetch` a web resource.
2. Url / Location.
3. Cookies.
4. Local storage. Server resources.
5. Sensors.

### effects and mutator

mutator effect (write) reactions
In DOM.
1a. attribute toggle
1b. Css class toggle
.innerText
.innerHTML. aka HTMX.

Outside DOM
1. `fetch` a web resource.
2. Url / Location.
3. Cookies.
4. Local storage. Server resources.
5. Motors.


### :transformers

:transformers turn data from one form into another; :transformers *should be* pure functions. They *should* only read the `e` and/or `oi` as input, make no changes to input arguments, and only produce a new `oi` output. Transformers are often included in the :effects / :mutators. However, if you recognize that you successfully can pull out a chunky, reusable :transformer from one or more of your :effects, then that will likely lead to much clearer and better code.

### :control and :monad reactions

control reaction. returns a goto or a break. It is used to implement filters, if/else, loops, etc. :filters is a very common form of `if`-like :control reactions.

:monad reaction. returns a new object that will be the `this` for the next reaction in the chain. They move the origin of the reaction chain, not unlike the translocation that can take place when monads chain their function calls.
