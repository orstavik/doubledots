### 3 Chaining definitions

- How to chain reactions
  In doubledots you chain reactions like this:

  `event:reaction1:reaction2:...`. When the `event` triggers, it is first passed to `:reaction1`, then `:reaction2`, etc.etc.

  - Defining custom reactions

  The define function takes in a name and a callback function

  ```html
  <div click:console.log>hello</div>
  <script>
    customReactions.define("log", console.log("Hi"));
  </script>
  ```

- Passed props

  The first reaction in the chain is passed a single argument: the event object. But, when the second reaction is called, it is passed _two_ arguments: the event object _and_ the output of the previous reaction.

  Note. In the documentation, we often refer to the two arguments of the custom reactions as `e` for "event" and `oi` for "output-input".

  ```html
  <p click:get_text:log>Loggin this</p>
  <script>
    customReactions.define("get_text", () => {
      text = this.ownerElement.textContent;
      return text;
    });
    customReactions.define("log", (e, oi) => {
      console.log(oi);
    });
  </script>
  ```

- Using `This` in customReactions.

  Inside a reaction function `this` points to the attribute object (the `Attr`).

  ```html
  <div click:log_name:log_value:log_tagname="hello">sunshine</div>
  <script>
    customReactions.define("log_name", () => console.log(this.name));
    customReactions.define("log_value", () => console.log(this.value));
    customReactions.define("log_tagname", () => console.log(this.ownerElement.tagName));
  </script>
  ```

## 4. Breaking chain reaction

- Ways of breaking the chain

  There are two ways a chain reaction can be broken:

  1. if the custom reaction function `return` a special object `customReaction.break`, or
  2. if the custom reaction function `throws` an `Error`.

- `customReactions.break`
  By returning `customReactions.break`, the custom reaction chain will simply stop running and let the next custom reaction chain continue.

  ```html
  <div click:one:stop:two>hello sunshine</div>
  <script>
    customReactions.define("one", () => console.log("one"));
    customReactions.define("stop", () => customReactions.break);
    customReactions.define("two", () => console.log("two"));
  </script>
  ```

  When somebody `click` on the `<div>`, then:

  1. the `:one` reaction will run and print `one` in the console,
  2. the `:stop` reaction will run and return `customReactions.break`, which
  3. will halt the execution of the reaction chain blocking the `:two` reaction from ever being invoked.

- Filters
  Custom reaction functions that sometimes break the reaction chain are called filters. Filters check the state of for example:

  1. the event,
  2. the attribute `.value`,
  3. the surrounding dom and/or
  4. Some other external source (such as a web database, a sensor, or similar).

  If some state conditions are (not) met, then the filter will `.break` the custom reaction, otherwise it will let the chain reaction continue.

- Filter, parsers, extractors, etc.
  sda

### 5. Event Loop

### 6. Async

### 7. Default Actions

### 8. Custom triggers.

### 9. Defining reactions

### 10. Defining reaction rules

### 11. Dot rules

### 12. Dash rules

### 13. Schedulers

### 14. Load times

### 15. State machines

### 16. Gestures
