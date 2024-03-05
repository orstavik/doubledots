Assumed easy:
A. Calculator
B. Htmx
C. `_first-interactive:` event. `_ready:` event. etc. These events are generated as statemachines. Most often we want the chain that follows to run async, as a thread: `_ready::then-something`. Similar to dcl events. Global  statemachines should be added to one of the top elements: `<html :first-interactivable>`, or `<head :my-kind-of-ready>`.
D. `:`, `:wait-for-it::` reactions. onLoad reactions that wait for all  the definitions to be loaded before it runs.

Assumed hard:
A. Json to template
B. Stateful gestures
C. Stateful functions
D. Chained reactions where more than one reaction needs the attr value.

