const NUM = Symbol("num");
const HEX = Symbol("hex");

function parseArg(arg) {
  //todo parse args as direction(args?) //to make this syntactic, and not semantic per SubMonadType??
  //yes. I think so. Keep consistency.
  return arg;
}

function parse(word) {
  const units = word.split(":");
  const atoms = units.map(word => {
    const [_, methodName, tail] = word.match(/^([a-zA-Z]+(?:-[a-zA-Z]+)*)(.*)$/);
    const args = tail.split("_").map(parseArg);
    return { methodName, args };
  });
  return atoms;
}

class SelectorGroup {
  pseudos = new Set();
  hover() { this.pseudos.add("hover"); }
  valid() { this.pseudos.add("valid"); }
  invalid() { this.pseudos.add("invalid"); }
  dark() { this.pseudos.add("dark"); }

  mediaQ = new Set();
  xs() { this.mediaQ.add("xs"); }
  sm() { this.mediaQ.add("sm"); }
  md() { this.mediaQ.add("md"); }
  lg() { this.mediaQ.add("lg"); }
  xl() { this.mediaQ.add("xl"); }
  xxl() { this.mediaQ.add("xxl"); }
}

class ValueGroup {
  constructor(selectorGroup){
    this.selectorGroup = selectorGroup;
  }
}

class ColorGroup extends ValueGroup {
  //once the specifying 
  colors = [];  //the color group just pushes more and more colors.

  [HEX](hex) { this.colors.push("#" + hex.slice(2)); }

  rgb(...args) { this.colors.push(`rgb(${args.join()})`); }
  hsl(args) { this.colors.push(`rgb(${args.join()})`); }

  generic(color, lightness) {

  }
  static get generic() {
    const colors = ["red", "green"];
    return colors;
  }
}

const ValueGroupMap = (function makeValueGroupMap() {
  return {
    red: ColorGroup,

  };
})();

function interpret(words) {
  let monad = new ValueGroup();
  const atoms = words.split(/\s+/).filter(Boolean).map(parse);
  for (let { methodName, args } of atoms) {
    //if we are a selector group, and the methodName is on the selectorGroup, then we do that.
    //if not we try to switch to ValueGroup
    //else, 
    if (!(monad[methodName] instanceof Function)) {
      //try to specify
      const TypeConstructor = ValueGroupMap[methodName];
      if (!TypeConstructor)
        throw new SyntaxError("ValueGroup cannot be inferred from: " + methodName);
      if (!(TypeConstructor instanceof monad.constructor))
        throw new SyntaxError(monad.constructor.name + "." + methodName + " doesnt make sense.");
      Object.setPrototypeOf(monad, TypeConstructor); //upgrade in a more efficient way?
    }
    monad[methodName](...args);
  }
  return monad;
}