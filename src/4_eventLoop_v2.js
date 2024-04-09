(function () {
  function deprecated() {
    throw `${this}() is deprecated`;
  }
  function monkeyPatch(proto, prop, monkey) {
    const desc = Object.getOwnPropertyDescriptor(proto, prop);
    desc.value = monkey;
    Object.defineProperty(proto, prop, desc);
  }

  class MicroFrame {
    #i = 0;
    #names;
    #inputs;
    #outputs;
    #selves;

    constructor(at, event) {
      this.at = at;
      this.event = event;
      this.#names = this.at.reactions;
      this.#selves = [at];
      this.#inputs = [event];
      this.#outputs = [];
    }

    isConnected() {
      return this.at.isConnected();
    }

    getReaction() {
      return this.#i < this.#names.length ? this.#names[this.#i] : undefined;
    }

    getReactionIndex() {
      return this.#i < this.#names.length ? this.#i : -1;
    }

    nextReaction() {
      this.#i++;
      return this.getReaction();
    }

    /**
     * @returns true if the loop can continue, false if the loop should abort
     */
    run(threadMode = false) {
      for (const re = this.getReaction(); re; re = this.nextReaction()) {
        //1. process native reactions
        if (re === "") {
          threadMode = true;
          continue;
        }

        //2. check isConnected
        try {
          if (!this.at.isConnected)
            throw new DoubleDotsReactionError("Disconnected"); //todo should this be an error??

          const func = this.at.getRootNode().getReaction(re);
          if (!func)
            throw new DoubleDotsReactionError("No reaction definition.");

          const input = this.#inputs[this.#i];
          const self = this.#selves[this.#i];
          const res = this.#outputs[this.#i] = func.call(self, this.event, input);
          if (res instanceof Promise) {
            if (threadMode) {
              res.then(oi => this.#runSuccess(oi))
                .catch(error => this.#runError(error))
                .finally(_ => (__eventLoop.task = this).run(threadMode));
              return; //continue outside loop
            } else {
              res.then(oi => this.#runSuccess(oi))
                .catch(error => this.#runError(error))
                .finally(_ => __eventLoop.loop());
              return true; //abort outside loop
            }
          }
        } catch (error) {
          this.#runError(error);
        }
        this.#runSuccess(res);
      }
      __eventLoop.task = undefined; //todo is it necessary?
    }

    #runError(error) {
      this.#outputs[this.#i] = error;
      const catchKebab = "catch_" + error.constructor.name.replace(/[A-Z]/g, '-$&').toLowerCase();
      for (this.#i++; this.#i < this.#names.length; this.#i++)
        if (this.#names[this.#i] === "catch" || this.#names[this.#i] === catchKebab)
          return;

      this.#i = this.#names.length;
      const target = this.at.isConnected ? this.at : document.documentElement;
      target.dispatchEvent(new DoubleDotsErrorEvent("error", { error }));
    }

    #runSuccess(res) {
      this.#outputs[this.#i] = res;

      const next = this.#i + (res instanceof EventLoop.ReactionJump ? res.value : 1);
      if (next >= this.#names.length)
        this.#i = this.#names.length - 1;
      else if (res instanceof EventLoop.ReactionOrigin) {
        this.#selves[next] = res.value;
        this.#inputs[next] = this.#inputs[next - 1];
      } else {
        this.#selves[next] = this.#selves[next - 1];
        this.#inputs[next] = res;
      }
    }
  }

  class __EventLoop {
    #stack = [];
    #i = 0;
    //#stack[#i] is the position in the event loop

    //task is the task currently running reactions.
    //This is different from #stack[#i] when tasks are continued in thread mode. 
    task;

    addTask(attr, event) {
      this.#stack.push(new MicroFrame(attr, event));
      this.#i === this.#stack.length - 1 && this.loop();
    }

    getFrame() {
      return this.#i < this.#stack.length ? this.#stack[this.#i] : undefined;
    }

    nextFrame() {
      this.#i++;
      return this.getFrame();
    }

    loop() {
      for (this.task = this.getFrame(); this.task; this.task = this.nextFrame())
        if (this.task.run()) //when task.run() returns true it is awaiting promise in sync mode.
          return;
    }
  }

  __eventLoop = new __EventLoop();

  //external interface
  window.EventLoop = class EventLoop {
    //todo move the static classes to DoubleDots namespace?
    //todo move the EventLoop class to DoubleDots namespace too? no.. If so everything, like CustomAttr, and that would be verbose.
    //todo but DoubleDots.ErrorEvent and DoubleDots.SpreadReactionError are nice!
    static ReactionJump = class ReactionJump {
      constructor(n) {
        n = parseInt(n);
        if (!n || isNaN(n))
          throw new DoubleDotsErrorEvent("ReactionJump must be done using a positive or negative integer.");
        this.value = n;
      }
    };

    static ReactionOrigin = class ReactionOrigin {
      constructor(obj) {
        if (!obj || !(obj instanceof Object))
          throw new DoubleDotsErrorEvent("ReactionOrigin must be an object not null.");
        this.value = obj;
      }
    };

    static SpreadReaction = function (fun) {
      return function SpreadReaction(oi) {
        if (oi instanceof Iterable)
          return fun.call(this, ...oi);
        throw new DoubleDotsSpreadReactionError("SpreadReactions must be passed a spreadable oi argument");
      };
    };

    get event() {
      return __eventLoop.task.event;
    }
    get attribute() {
      return __eventLoop.task.at;
    }
    get reaction() {
      return __eventLoop.task.getReaction();
    }
    get reactionIndex() {
      return __eventLoop.task.getReactionIndex();
    }
  };
  Object.defineProperty(window, "eventLoop",
    { value: new EventLoop(), configurable: false });

  (function (Document_p) {
    //it is impossible to override the window.event property..
    Document_p.currentScript = deprecated.bind("Document.prototype.currentScript");
  })(Document.prototype);

  window.DoubleDots ??= {};
  DoubleDots.native ??= {};

  (function (EventTarget_p) {

    function dispatchEventDD(event) {
      let error;
      if (!(this instanceof CustomAttr || this instanceof Element))
        error = new DoubleDotsSyntaxError("dispatchEvent only works for CustomAttr and Element");
      if (!target.isConnected)
        error = new DoubleDotsReactionError("dispatchEvent only works for connected CustomAttr or Element");
      if (error)
        return document.documentElement.dispatchEvent(new ErrorEvent("error", { error }));
      eventLoop.addTask(this, event);
    }

    monkeyPatch(EventTarget_p, "dispatchEvent", dispatchEventDD);
    DoubleDots.native.addEventListener = EventTarget_p.addEventListener;
    DoubleDots.native.removeEventListener = EventTarget_p.removeEventListener;
    EventTarget_p.addEventListener = deprecated.bind("EventTarget.addEventListener");
    EventTarget_p.removeEventListener = deprecated.bind("EventTarget.removeEventListener");
  })(EventTarget.prototype);

})();