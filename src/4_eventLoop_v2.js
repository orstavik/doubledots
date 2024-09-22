(function () {
  //.attachShadow(/*always open*/); is necessary to capture the full composedPath of customEvents.
  const attachShadowOG = HTMLElement.prototype.attachShadow;
  HTMLElement.prototype.attachShadow = function attachShadowforceModeOpen(...args) {
    (args[0] ??= {}).mode = "open";
    return attachShadowOG.apply(this, args);
  }

  class MicroFrame {
    #i = 0;
    #names;
    #inputs;
    #outputs;
    #selves;

    constructor(event, at) {
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
      // this.#i++;
      return this.getReaction();
    }

    /**
     * @returns true if the loop can continue, false if the loop should abort
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
            throw new DoubleDots.DisconnectedError("Disconnected"); //todo should this be an error??

          const func = this.at.getRootNode().Reactions.get(re);
          if (!func)
            throw new DoubleDots.MissingReaction("No reaction definition.");

          if (func instanceof Promise) {
            if (threadMode) {
              func.then(_ => (__eventLoop.task = this).run(threadMode));
              return;
            } else {
              func.then(_ => __eventLoop.loop());
              //todo these sync delays needs to have a max timeout.
              //todo thus, we need to have some max timers
              return true;
            }
          }
          const self = this.#selves[this.#i];
          //todo this.#inputs.slice().reverse() is inefficient.
          const res = this.#outputs[this.#i] = func.apply(self, this.#inputs.slice().reverse());
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
              //todo these sync delays needs to have a max timeout.
              //todo thus, we need to have some max timers
              return true; //abort outside loop
            }
          }
          this.#runSuccess(res);
        } catch (error) {
          this.#runError(error);
        }
      }
      __eventLoop.task = undefined; //todo is it necessary?
    }

    #runError(error) {
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
      } else if (res instanceof EventLoop.ReactionJump) {
        const next = this.#i + res.value;
        this.#selves[next] = this.#selves[this.#i];
        this.#inputs[next] = this.#inputs[this.#i];
        this.#i = next;
      } else if (res instanceof EventLoop.ReactionOrigin) {
        const next = this.#i + 1;
        this.#selves[next] = res.value;
        this.#inputs[next] = this.#inputs[this.#i];
        this.#i = next;
      } else {
        const next = this.#i + 1;
        this.#selves[next] = this.#selves[this.#i];
        this.#inputs[next] = res;
        this.#i = next;
      }
    }
  }

  class __EventLoop {
    #stack = [];
    #started = [];
    task;

    //called both to start and restart the loop.
    loop() {
      while (this.#stack[0]) {
        const { event, iterator } = this.#stack[0];
        for (let attr of iterator) {
          //the iterator remembers its next position if the loop is broken.
          this.task = new MicroFrame(event, attr);
          this.#started.push(this.task);
          //task.run() returns true when it awaits a promise in sync mode.
          if (this.task.run())
            return;
          this.task = undefined;
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
