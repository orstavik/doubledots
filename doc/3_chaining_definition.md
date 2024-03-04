## 1. chain reactions

you can list many reactions after each other: event:reaction1:reaction2:... If nothing breaks the chain, each trigger event will call reaction1 and then reaction2.

example

## 2. define custom reactions

each custom reaction has two input parameters: '(e, i)'. The 'e' is the event that triggers the reaction. The 'i' is the output of the previous reaction ('undefined' for the first reaction after the event). 

example click:get_type:question:exclaim


a chain reaction

when an event occurs, it can trigger a chain reaction. a chain reaction is just a sequence of custom reaction functions called one after another. simple.

>> you likely have encountered similar behavior in js before called for example "chaining functions" or more fancy "monads". think of it like [].map

here we need the different inputs. That we have the `e`  and the `i` for different outputs inputs when we chain the reactions. And that `this` is the attribute, the `this.ownerElement` is the element. And of course, the `customReactions.break` as a means to break the chain.