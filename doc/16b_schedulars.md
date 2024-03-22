# Schedular reactions

`:tripple_` is similar to a schedular, except that it doesn't just *filter* or *delay* the reaction chain.

schedulars are reaction state machines, yes. But schedulars do not trigger external, readable changes such as mutating the dom by flipping CSS classes or attributes or something else readable in the DOM. Or dispatch a new event, such as `:tripple_`. Schedulars *only* control either:
1. the time when a reaction chain will continue, and/or
2. *if* the reaction chain will continue or not (a filter).

## `::r` the `::ready` reaction



## `:debounce_` rule


Look more at RxJS

##