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
    run(threadMode = false, tryMode = "") {
      for (const re = this.getReaction(); re; re = this.nextReaction()) {
        //1. process native reactions
        if (re === "") {
          threadMode = true;
          continue;
        }
        if (re === "try" || re === "catch" || re === "finally") {
          tryMode = re;
          continue;
        }

        //2. check isConnected
        if (!this.at.isConnected) {
          this.outputs[this.#i] = new DoubleDotsReactionError("Disconnected");
          // this.#i = this.#names.length;
          return true;
        }
        const func = this.at.getRootNode().getReaction(re);
        if (!func) {
          this.outputs[this.#i] = new DoubleDotsReactionError("No reaction definition.");
          // this.#i = this.#names.length;
          //todo dispatch error event
          return true;
        }
        let res;
        try {
          const input = this.#inputs[this.#i];
          const self = this.#selves[this.#i];
          res = this.#outputs[this.#i] = func.call(self, this.event, input);
        } catch (error) {
          this.#runError(error);
          return true;
        }
        if (res instanceof Promise) {
          if (threadMode) {
            res.then(oi => {
              this.#runSuccess(oi);
              this.run(threadMode, tryMode);
            }).catch(error => {
              this.#runError(error);
            });
            return true; //continue outside loop
          } else {
            res.then(oi => {
              this.#runSuccess(oi);
              __eventLoop.loop();
            }).catch(error => {
              this.#runError(error);
              __eventLoop.loop();
            });
            return false; //abort outside loop
          }
        }
        this.#runSuccess(res);
      }
    }

    #runError(error) {
      this.#outputs[this.#i] = error;
      this.#i = this.#names.length;
      const target = this.at.isConnected ? this.at : document.documentElement;
      target.dispatchEvent(new DoubleDotsErrorEvent("error", { error }));
    }

    #runSuccess(res) {
      const now = this.#i;
      this.#outputs[now] = res;

      const next = this.#i = res instanceof EventLoop.ReactionJump ? res.value : ++now;
      if (next === this.#names.length)
        return;
      if (res instanceof EventLoop.ReactionOrigin) {
        this.#selves[next] = res.value;
        this.#inputs[next] = this.#inputs[next - 1];
      } else {
        this.#selves[next] = this.#selves[next - 1];
        this.#inputs[next] = res;
      }
    }
  }

  class MacroFrame {
    #target;

    #elements;
    #microFrames;

    #i = 0;
    #j = 0;

    constructor(target, event) {
      this.#target = target;
      this.event = event;
    }

    freeze() {
      if (this.#elements) //happens when waiting for sync
        return this;
      this.#elements = [];
      //iterates both composed:true and composed:false paths.
      for (let el = this.#target; el; el = this.event.composed ? el.assignedSlot || el.parentElement || el.parentNode?.host : el.parentElement)
        this.#elements.push(el);
      this.#microFrames = new Array(this.#elements.length);
      return this;
    }

    get currentElement() {
      return this.#i < this.#elements.length ? this.#elements[this.#i] : undefined;
    }

    get #currentMicroFrames() {
      return this.#i >= this.#microFrames.length ? undefined :
        this.#microFrames[this.#i] ??= [...this.currentElement.attributes].filter(at => at.trigger === this.event.type).map(at => new MicroFrame(at, this.event));
    }

    get currentMicroFrame() {
      return !(this.#j < this.#currentMicroFrames?.length) ? undefined :
        this.#currentMicroFrames[this.#j];
    }

    getMicro() {
      for (let el; (el = this.currentElement).isConnected; this.#i++, this.#j = 0)
        for (let m; (m = this.currentMicroFrame).isConnected; this.#j++)
          return m;
    }

    nextMicro() {
      this.#j++;
      return this.getMicro();
    }
  }

  class __EventLoop {
    #stack = [];
    #i = 0;

    addTask(target, event) {
      this.#stack.push(new MacroFrame(target, event));
      if (this.#i === this.#stack.length - 1)
        this.loop();
    }

    getMacro() {
      return this.#stack[this.#i].freeze();
    }

    nextMacro() {
      this.#i++;
      return this.getMacro();
    }

    loop() {
      for (let ma = this.getMacro(); ma; ma = this.nextMacro())
        for (let mi = ma.getMicro(); mi; mi = ma.nextMicro())
          if ("Promise in Sync" === mi.run())
            return;
    }
  }

  __eventLoop = new __EventLoop();

  //external interface
  window.EventLoop = class EventLoop {
    ReactionJump = class ReactionJump {
      constructor(n) {
        n = parseInt(n);
        if (!n || isNaN(n))
          throw new DoubleDotsErrorEvent("ReactionJump must be done using a positive or negative integer.");
        this.value = n;
      }
    };

    ReactionOrigin = class ReactionOrigin {
      constructor(obj) {
        if (!obj || !(obj instanceof Object))
          throw new DoubleDotsErrorEvent("ReactionOrigin must be an object not null.");
        this.value = obj;
      }
    };

    get event() {
      return __eventLoop.getMacro()?.event;
    }
    get attribute() {
      return __eventLoop.currentMicroFrame()?.at;
    }
    get reaction() {
      return __eventLoop.currentMicroFrame()?.getReaction();
    }
    get reactionIndex() {
      return __eventLoop.currentMicroFrame()?.getReactionIndex();
    }
  }
  Object.defineProperty(window, "eventLoop",
    { value: new EventLoop(), configurable: false });

  (function (Document_p) {
    //it is impossible to override the window.event property..
    Document_p.currentScript = deprecated.bind("Document.prototype.currentScript");
  })(Document.prototype);

  (function (EventTarget_p) {

    function dispatchEventDD(event) {
      let error;
      if (!(this instanceof CustomAttr || this instanceof Element))
        error = new DoubleDotsSyntaxError("dispatchEvent only works for CustomAttr and Element");
      if (!target.isConnected)
        error = new DoubleDotsReactionError("dispatchEvent only works for connected CustomAttr or Element");
      if (error)
        return document.documentElement.dispatchEvent(new ErrorEvent("error", { error }));
      __eventLoop.addTask(this, event);
    }
    monkeyPatch(EventTarget_p, "dispatchEvent", dispatchEventDD);
    EventTarget_p.addEventListener = deprecated.bind("EventTarget.addEventListener");
    EventTarget_p.removeEventListener = deprecated.bind("EventTarget.removeEventListener");
  })(EventTarget.prototype);

})();