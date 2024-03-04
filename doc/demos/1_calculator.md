Known steps:

1. make the layout of a calculator. This can likely be stolen from template on the web, just find one with a simple template. Use the two lines variant, 1 = state, 2 = input. That is the simplest to make.

2. add reactions to the different buttons.

We need to break the task down in the different steps. We need to explain what happens in the different steps. I think that we should be able to create the calculator now.

### QUESTIONS

A. How would we pass an argument to a function? If an event is similar to another it is common for a function to be derived that needs a variable to assign the function's behaviour. Defining the same funtion multiple times would be bloated. 

>> add the value either in an attribute on the element/parentElement or elsewhere in the dom, for example, or hardcode it in the custom reaction def.

>> static arguments can be passed as part of the name, so to speak. look for tutorial on how to write script higher-order custom reaction functions.

B. Can customReactions access the event? Data could be retrieved from attributes rather than variables.

>> yes. The `e` is the first argument passed to the custom reaction function.

C. What considerations are beeing taken for accessibility of disabled people? Some page readers use semantics to read page parts out loud.

>> except from the example with replacing the `<a href>` tag with `click:open`, html doubledots only add info to the dom, it doesn't remove it. So. For accessibility readers and the like, this more stateful dom will be easier to adapt for accessiblity concerns.

D. How can I add eventlisteners to the window? such as scroll or keypresses.

>> global event listeners: `_scroll`, and `_keypress`.

Currently only click events are defined.

Part 1: simple calculator
First, we implement using small functions we write directly.

Part 2: scientific calculator
For scientific calculator, we import the Math.js lib and a couple of functions from there to illustrate how external libraries can be used in the system.
Math.js library is used for evaluations.
