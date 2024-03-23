# Why DoubleDots?

>> Everything written here is true. But still. Be forewarned. This is a sales pitch. This is the way we would present the benefits of DoubleDots when we throw causion and humility to the side. We hope you find it inspiring, and enlightening, and that you forgive us for this bluster and temporary lapse in character.

Below are 5 points why DoubleDots is memorable. Once you see HTML throught the lens of DoubleDots, you will never be able to unsee it. It is unforgettable.

1. DoubleDots renovates the **timeline** in HTML. It unifies all the different timers, callbacks, observers, and the native event queue into a single **virtual event loop**. This makes it much easier to understand the different priorities between tasks (promises, micro, meso, macro, etc.). This illustrates not only how to solve and avoid race conditions between these different queues that now are quite obfuscated, but it also illustrate the clear difference between the thread structure `async/await` allows and how these threads should be viewed up against the singularity of the event loop.

2. Adding only ***`:`*** to HTML attribute names DoubleDots enable you to **program rich web apps in HTML only**. Let that sink in.. One grammatical extension to HTML, that fits seamlessly with HTML, and you no longer need to use JS if you don't want to. ***One***! Because of this syntactic elegance, the DoubleDots run-time environment with a complete virtual event loop can be added as a simple drop-in script. Of less than 1000 readable lines of code. But, the main strength of DoubleDots is not its super efficient run-time; the power of DoubleDots grammar is its ability to help you **see the simplicity of how to program directly against the event loop**. The **clear, simple syntax** of DoubleDots give you a **clear, simple tool for thought** for seeing problems and solutions in terms of event loop. Once you understand how you can program directly against the event loop in DoubleDots, you will know how to program directly against any event loop. That insight is the true value.
 
3. React was right! Functions should be understood as "react"ions. Reaction based programming is a *really good* programming philosophy, on par with pure functions, pure data, the event loop, async/await, etc. However, DoubleDots takes the concept of "reaction" to new heights. You ain't seen nothing yet. I promise. In DoubleDots, you can be excused for thinking that *all* functions are reactions. Or reaction chains. Because DoubleDots is based in a landscape and run-time that you already know very well (HTML, js, and a browser), it is **easy** to understand. Because DoubleDots adds only the `:` doubledot and some reactions, it is **simple** to learn. And based *only* on these principles, DoubleDots still shows you the true meaning of reactive programming. DoubleDots ***will forever shape*** the way you see and understand a world of reactions is.

4. DoubleDots provide a **great** debugging experience. DevTools have solved the issue of showing you **data**: what is going on *where and why*. But, *when* things are *going to happen*, the ***why when***, that is still a mystery in DevTools. This mystery is really a headscratcher. And it is due to the many different queues, the many unregistered tasks, and the `async` threads that in modern js apps now run rampant. The virtual event loop in *DoubleDots solves this problem*. DoubleDots will ***show you time***. By registering *everything relevant that happens* in the browser in one linear event loop, and by registering which reaction starts and completes when, DoubleDots can at any point ***list and color code*** completed, awaiting, and queued events, tasks, and reaction chains.

5. Using reactions and triggers, DoubleDots also give new meaning to the concept of state machines. State machines is a recurring problem in HTML (and coding in general). But, imperative languages like JS are not really good at highlighting them. DoubleDots is not an imperative language; DoubleDots is reactive. In DoubleDots we can easily spot what state machines we need; where; which states we need; and which transitions. And DoubleDots provide simple means to implement them. **Gestures and other elaborate state machines are simple in DoubleDots**. So. DoubleDots have already implemented a full register of common web gestures such as `swipe`, `fling`, `pinch`, and `pan` that you can use as is, read to understand, and modify and augment to your hearts desire.

## Coming soon!!

6. Solving the issue of encapsulation.
The encapsulation strategy is not only built on the static element structure, but on the semi-dynamic dom (element at first attach time). 

This is possible because DoubleDots attaches definitions to the `document` owner, not the global js name space.

Because of this, imagine you have an app A. the main `document`. It uses 2 web components written by two different developers B and C. `shadowRoot` B and `shadowRoot` C. And both B and C use a common component D. written by developer D with two shadowRoots BD, and CD.

When the shadowRoot starts, it will do the following:
1. it will run through the host node chain to the top hostNode.
2. then it will check the host node chain for a special `[override-reaction]`, `[override-rules]` and `[override-trigger]` attribute. This attribute can only be added to the element when it is first added to the DOM. The map
3. when a reaction is queried from the attribute, it will:
    1. go to the `getRoot()` shadowRoot.
    2. if there is an override for that reaction or trigger, when it goes through the map top-down, then it will simply transpose the root to that override.
    3. On the root/overriding root, it will search for the definition. If it finds no definition on itself, it will get the .hostNode.getRoot() until it has reached the top document.
    4. But inside shadowRoots, the ability to register new reactions *must* be done *before* any reactions are queried from the DOM. The reaction doesn't have to be ready, a name can point to a `Promise` of a coming definition, but the `shadowRoot.defineReaction(name, promise)` must be called at the head of the constructor of the element.

4. this means that when there is no overriding rule, the 

When D starts, it  looks for its own definition in C first. 