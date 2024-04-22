## Event loop mysteries

There are so many weird things about the event loop in web development. When we make applications usualy we dont need to mind too much about *how* the event loop queues and fires events. Moreover, some events are barely documented, so covering most of them is a difficult task. 

It's not like there is an official JavaScript documentation because there is no official release. All the browsers have made their own JavaScript engine - some are using the same though. Your best shot are ECMA releases of MDN documentation.

### The entire Event loop is taboo. 

When analyzing the discussion over the event loops, most articles go over bubbling, capturing and propagation. In these explanations, the path the event does and what events are fired when, is the focus of the explanation. However, they gloss over multiple points:

1. How many 'Event Emmiters' exist? (Window, Document, Element, etc.)
2. How many posible event exist and what are their names?
3. What are these events priority? Do they all fire with the same delay? 
4. I know there are Micro and Macro tasks but how are they defined? Do they always stay with the same category? (SPOILER : THEY DON'T)
5. Which events are composed then (codeword for global)? 

These were part of the challenges we faced when creating this framework, and challenges that we wish to shine a light uppon, I however small way we can.

How do we aim to do this?

## Event loop model

## JS Loop vs DD Loop

## Error handling


Ok then, the priority in the queue? I've heard rumors that some macro tasks such as click run before setTimeout. 

Where can i see this priority between tasks? 

The eventLoop is taboo. It is completely surrounded by silence. This makes you question your questions about it. The taboo is fud-ing. And it is completely inappropriate. The facts about SEQUENCE of event reactions is literally the metaphorical heart beat of the web run time! 😱 It is like JS trying to keep a secret if && or ?: comes first (which i always look up btw;) 
