# trigger state machines

##
observers,
interval loop
callbacks


2. single or multiple triggers? doesn't matter. binary or multiple states? doesn't matter. Triggered *only* by the occurrence of events that are not propagating in the dom?  yes. (this can be timers (sleep, raf), observers (mutationObserver), a custom callback generator/event emitter that is not a DOM propagating event). Controllable by outside reactions? yes. => Simple trigger state (no gesture). Since it is triggered by occurrenced not propagating in the DOM, it doesn't need to spawn any custom listeners. The outside control is supported by the `changeCallback(oldValue)`.
