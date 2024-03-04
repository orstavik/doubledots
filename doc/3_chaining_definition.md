## 1. chain reactions

you can list many reactions after each other: event:reaction1:reaction2:... If nothing breaks the chain, each trigger event will call reaction1 and then reaction2.

example

## 2. define custom reactions

each custom reaction has two input parameters: '(e, i)'. The 'e' is the event that triggers the reaction. The 'i' is the output of the previous reaction ('undefined' for the first reaction after the event). 

example click:get_type:question:exclaim

## 3a. 'this' in customReactions


## 3. break the chain

each reaction in the chain can break the chain by returning a special object 'customRraction.break'. if the customReaction function returns customReaction.break, none of the other reactions will run (and it will not be considered an 'Error'). 

example with a 

## 4. filters

the custom reaction functions that sometimes break the reaction chain are called filters. Filters check the state of the event, the attribute, the surrounding dom, or some other external source and if certain conditions are (not) met break the reaction chain.

it is also common to let the filter extract, parse, and purify the state for subsequent reactions. this is the  returned from the filter reaction and will be available for the next reaction as it's second 'i' argument.

example

## 5. what about errors

Errors also break the reaction chain. if the Error is not caught and handled within the reaction function itself, it will break the chain. In addition, errors will also spawn an error event (not unlike uncaughterror) that will be added in the event loop. with a reference to the customReaction.

## 7. 'customReactions.index'

the customReactions has another special property: '.index'. The '.index' is simply a shortcut for the position of the execution of the current custom reaction in the chain. For example, if you have a custom reaction 'click:one:two:three:one', then customReaction.index == 1 for the reaction ':one' runs the first time, the 2 when ':two: runs, 3 for ';three', and finally 4 when ':four' runs.

You likely will not use this property all that much. But it can be handy if you want to implement control structures such as wait for definitions to be ready, an if-else reaction pair, etc. And yes, you are right, it is kinda like the old, deprecate global 'event' property.

## 9. nesten functions in a monadic chain?

a chain reaction is just a sequence of custom reaction functions called one after another. simple.

some might have encountered similar structures as function chaining and monads. JS arrays and jQuery. 
 
it is possible to argue that the custom reactions work on a state object (ie. the attribute object) and that as a reaction might change the state that this Attr object frames and that the custom reactions always run from the same state, that it is like a monad. Sure.

But. As for me personally. I think that the conceptual model trigger-event => filter reaction => state reaction, is a more useful perspective. This is what you will make 95% of the time. This is what will make your code concise, readable and super effective.

In addition to such normal custom reaction chains, you have a second type 'attr-change:state-machine' reaction. we will describe them later. And these two types reaction chains is all you really need, and will write.