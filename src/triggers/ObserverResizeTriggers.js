(function () {
  customAttributes.define("border-box", AttrResize);
  customAttributes.define("content-box", AttrResize);
  customAttributes.define("device-pixel-content-box", AttrResize);

  class TriggerCQW extends AttrResize {
    run([{ contentBoxSize: [{ inlineSize }] }]) {
      this.ownerElement.style.setProperty("--cqw", inlineSize);
      //todo run through the contentBoxSize and 
      //check how to map the contentBoxSize values to 
      //cqw, cqh, cqi, cqb, cqmin, cqmax
    }

    settings() {
      return { box: "content-box" };
    }
  }

  customAttributes.define("cqw", TriggerCQW);

})();
