
//these 3 are the main ones.
//AnyOf(...FUNCS), AllOf(...FUNCS), ListOf(...FUNCS)
//ListOf ignores empty.
//AnyOf and AllOf fails on empty.

//Merge(...ObjFUNCS)
//P(name, StrFunc)
//Ps([names], [StrFuncs])

//Word(rx, Func)
//Number(unitRx, validateFunc)
//LogicalFour()

function AnyOf(...FUNCS) {
  return function (exp) {
    for (let func of FUNCS) {
      const res = func(exp);
      if (res != null)
        return res;
    }
    throw new SyntaxError(`${exp} doesn't match AnyOf: ]${FUNCS.map(f => f.toString())}])`);
  };
}

function ListOf(PREFIX, ...FUNCS) {
  PREFIX &&= new RegExp(`^(${PREFIX.source})$`);
  return function ({ name, args }) {
    if(PREFIX && !name.match?.(PREFIX))
      return;
    let res;
    for (let func of FUNCS)
      if ((res = func(exp)) != null)
        return res;
    throw new SyntaxError(`${exp} doesn't match AnyOf: ]${FUNCS.map(f => f.toString())}])`);
  };
}




function safeAssign(a, b) {
  for (let k in b)
    if (k in a)
      throw new SyntaxError(`Overwrite not allowed: ${k}`);
  return Object.assign(a, b);
}

function Dictionary2(...FUNCS) {
  return function ({ name, args }) {
    const res = {};
    main: for (let arg of args) {
      for (let func of FUNCS) {
        const b = func(arg);
        if (b != null) {
          safeAssign(res, b);
          continue main;
        }
      }
      throw new SyntaxError(`Invalid argument: ${name}(...${arg.toString()}...)`);
    }
    return res;
  };
}

//PrefixMatcher("name|aliases...", max, cb)=> returns {name, args}
//if this one hits, then it will 
//This is inside the Dictionary?{"name|aliases.../max": cb}

//LogicalFour(prefix, cbThatReturnsAnArrayOfStrings)
//cbThatReturnsAnArrayOfStrings should be wrapped in a OneOf(SeveralFunctions())
//Args(8,(
//  Prefix("width|w", PositiveLengthPercent),
//  P("width", Word("thin|medium|thick")),
//  Unit(LENGTHS_PER, (str, v) => (Number(v) >= 0 ? { "width": str } : null))
//)

export const border2 = BorderSwitch(Dictionary2({  //border-colors controlled by $color
  "width:width|w/4": LogicalFour(PositiveLengthPercent),
  "style:style|s/4": LogicalFour(Word("solid|dotted|dashed|double")),
  "radius:radius|r/8": LogicalEight(PositiveLengthPercent),
  "radius:radius-og|r2/8": LogicalFour(PositiveLengthPercent),
  "style:": Word("solid|dotted|dashed|double"),
  //todo this should be added to the 
  "width:": Either(
    Word("thin|medium|thick"), 
    Unit(LENGTHS_PER, (str, v) => (Number(v) >= 0 ? str : null))
  )
}));

