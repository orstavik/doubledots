(function () {
  //.attachShadow(/*always open*/); is necessary to capture the full composedPath of customEvents.
  const attachShadowOG = HTMLElement.prototype.attachShadow;
  HTMLElement.prototype.attachShadow = function attachShadowforceModeOpen(...args) {
    (args[0] ??= {}).mode = "open";
    return attachShadowOG.apply(this, args);
  };

  Event.data = Symbol("Event data");
  class EventLoopError extends DoubleDots.DoubleDotsError { }
  DoubleDots.EventLoopError = EventLoopError;

  class MicroFrame {
    #i = 0;
    #names;
    #inputs;
    #outputs;

    constructor(event, at) {
      this.at = at;
      this.event = event;
      this.#names = this.at.reactions;
      this.#inputs = [event[Event.data] ?? event];
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
      // this.#i++;
      return this.getReaction();
    }

    /**
     * @returns <undefined> when the task is emptied, or is awaiting in async mode, 
     * which both means that the event loop can continue.
     * @returns <this> current task when the task is not emptied 
     * and we must wait for it in sync mode.
     */
    run(threadMode = false) {
      for (let re = this.getReaction(); re !== undefined; re = this.nextReaction()) {
        //1. process native reactions
        if (re === "") {
          threadMode = true;
          this.#runSuccess(this.#inputs[this.#i]);
          continue;
        }
        //todo this one
        if (re.startsWith("catch"))
          continue;

        //2. check isConnected
        try {
          if (!this.at.isConnected)
            throw new EventLoopError("Disconnected: " + this.at);
          //todo should this be an error??

          const func = this.at.getRootNode().Reactions.get(re, this.at);
          if (func instanceof Error)
            throw func;
          if (func instanceof Promise) {
            if (threadMode) {
              func.then(_ => __eventLoop.asyncContinue(this));
              return; //continue outside loop
            } else if (func instanceof DoubleDots.UnknownDefinition) {
              return this.#runError(new EventLoopError("Reaction not found: " + re));
              //RulePromise, DefinitionPromise
            } else {
              func.then(_ => __eventLoop.syncContinue());
              //todo these sync delays needs to have a max timeout.
              //todo thus, we need to have some max timers
              return this; //halt outside loop
            }
          }
          // const self = this.#selves[this.#i];
          //todo this.#inputs.slice().reverse() is inefficient.
          const res = this.#outputs[this.#i] = func.apply(this.at, this.#inputs.slice().reverse());
          if (res instanceof Promise) {
            if (threadMode) {
              res.then(oi => this.#runSuccess(oi))
                .catch(error => this.#runError(error))
                .finally(_ => __eventLoop.asyncContinue(this));
              return; //continue outside loop
            } else {
              res.then(oi => this.#runSuccess(oi))
                .catch(error => this.#runError(error))
                .finally(_ => __eventLoop.syncContinue());
              //todo these sync delays needs to have a max timeout.
              //todo thus, we need to have some max timers
              return this; //halt outside loop
            }
          }
          this.#runSuccess(res);
        } catch (error) {
          this.#runError(error);
        }
      }
    }

    #runError(error) {
      console.error(error);
      this.#outputs[this.#i] = error;
      const catchKebab = "catch_" + error.constructor.name.replace(/[A-Z]/g, '-$&').toLowerCase();
      for (this.#i++; this.#i < this.#names.length; this.#i++)
        if (this.#names[this.#i] === "catch" || this.#names[this.#i] === catchKebab)
          return;

      // this.#i = this.#names.length;
      const target = this.at.isConnected ? this.at.ownerElement : document.documentElement;
      //todo add the at + reactionIndex + self + input to the ErrorEvent, so that we know which attribute caused the error
      //todo or just the at, and then just read the data from the _eventLoop?
      target.dispatchEvent(new ErrorEvent("error", { error }));
    }

    #runSuccess(res) {
      this.#outputs[this.#i] = res;
      if (res === EventLoop.Break) {
        this.#i = this.#names.length;
      } else if (res instanceof EventLoop.ReactionJump) { //this also looks frail
        const next = this.#i + res.value;
        // this.#selves[next] = this.#selves[this.#i];
        this.#inputs[next] = this.#inputs[this.#i];
        this.#i = next;
      // } else if (res instanceof EventLoop.ReactionOrigin) {
      //   const next = this.#i + 1;
      //   // this.#selves[next] = res.value;
      //   this.#inputs[next] = this.#inputs[this.#i];
      //   this.#i = next;
      } else {
        const next = this.#i + 1;
        // this.#selves[next] = this.#selves[this.#i];
        this.#inputs[next] = res;
        this.#i = next;
      }
    }
  }

  class __EventLoop {
    #stack = [];
    #started = [];
    task;

    syncContinue() {
      if (!(this.task = this.task.run()))
        this.loop();
    }

    asyncContinue(task) {
      (this.task = task).run(true);
    }

    loop() {
      while (this.#stack[0]) {
        const { event, iterator } = this.#stack[0];
        for (let attr of iterator) {
          this.task = new MicroFrame(event, attr);
          this.#started.push(this.task);
          //if task.run() not emptied, abort to halt eventloop
          if (this.task = this.task.run())
            return;
        }
        this.#stack.shift();
      }
    }

    batch(event, iterable) {
      const iterator = iterable[Symbol.iterator]();
      if (this.#stack.push({ event, iterator }) === 1)
        this.loop();
    }
  }

  __eventLoop = new __EventLoop();

  //external interface
  window.EventLoop = class EventLoop {
    static ReactionJump = class ReactionJump {
      constructor(n) {
        n = parseInt(n);
        if (!n || isNaN(n))
          throw new DoubleDotsErrorEvent("ReactionJump must be done using a positive or negative integer.");
        this.value = n;
      }
    };

    static Break = {};

    static ReactionOrigin = class ReactionOrigin {
      constructor(obj) {
        if (!obj || !(obj instanceof Object))
          throw new DoubleDotsErrorEvent("ReactionOrigin must be an object not null.");
        this.value = obj;
      }
    };

    static SpreadReaction = function (fun) {
      return function SpreadReaction(oi) {
        return oi instanceof Iterable ?
          fun.call(this, ...oi) :
          fun.call(this, oi);
        // if (oi instanceof Iterable)
        //   return fun.call(this, ...oi);
        // throw new DoubleDotsSpreadReactionError("SpreadReactions must be passed a spreadable oi argument");
      };
    };

    //todo freeze the ReactionOrigin, SpreadReaction, ReactionJump, Break.

    get event() {
      return __eventLoop.task?.event;
    }

    get attribute() {
      return __eventLoop.task?.at;
    }

    get reaction() {
      return __eventLoop.task?.getReaction();
    }

    get reactionIndex() {
      return __eventLoop.task?.getReactionIndex();
    }

    dispatch(event, attr) {
      __eventLoop.batch(event, [attr]);
    }

    //todo rename to propagate
    dispatchBatch(event, iterable) {
      __eventLoop.batch(event, iterable);
    }
  };
  Object.defineProperty(window, "eventLoop", { value: new EventLoop() });
})();
