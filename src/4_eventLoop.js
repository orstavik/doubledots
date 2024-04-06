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
    #at;
    #i = 0;
    #names;
    #inputs;
    #outputs;
    #selves;

    constructor(at, event) {
      this.#at = at;
      this.event = event;
      this.#names = this.#at.reactions;
      this.#selves = [at];
      this.#inputs = [event];
      this.#outputs = [];
    }

    isConnected() {
      return this.#at.isConnected();
    }

    getReaction() {
      return this.#i < this.#names.length ? this.#names[this.#i] : undefined;
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
        if (!this.#at.isConnected) {
          this.outputs[this.#i] = new DoubleDotsReactionError("Disconnected");
          // this.#i = this.#names.length;
          return true;
        }
        const func = this.#at.getRootNode().getReaction(re);
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
      const target = this.#at.isConnected ? this.#at : document.documentElement;
      target.dispatchEvent(new DoubleDotsErrorEvent("error", { error }));
    }

    #runSuccess(res) {
      const i = ++this.#i;
      this.#outputs[i - 1] = res;
      this.prepNextReaction(res);
      if (i === this.#names.length)
        return;
      //todo Need to implement this class
      if (res instanceof TodoNewReactionTarget) {
        this.#selves[i] = res.valueTargetSomethingTodo;
        this.#inputs[i] = this.#inputs[i - 1];
      } else {
        this.#selves[i] = this.#selves[i - 1];
        this.#inputs[i] = res;
      }
    }
  }

  class MacroFrame {
    #event;
    #target;

    #elements;
    #microFrames;

    #i = 0;
    #j = 0;

    constructor(target, event) {
      this.#target = target;
      this.#event = event;
    }

    freeze() {
      if (this.#elements) //happens when waiting for sync
        return this;
      this.#elements = [];
      for (let el = this.#target; el; el = el.assignedSlot || el.parentElement || el.parentNode?.host)
        this.#elements.push(el);
      this.#microFrames = new Array(this.#elements.length);
      return this;
    }

    get currentElement() {
      return this.#i < this.#elements.length ? this.#elements[this.#i] : undefined;
    }

    get #currentMicroFrames() {
      return this.#i >= this.#microFrames.length ? undefined :
        this.#microFrames[this.#i] ??= [...this.currentElement.attributes].filter(at => at.trigger === type).map(at => new MicroFrame(at, this.#event));
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