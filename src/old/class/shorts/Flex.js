import { PrefixTable, calcNum/*, Var*/ } from "./SHORT.js";

//first, prefixes into properties. This steps handles a lot of the problems.
//second, parse the values of some of these properties. This could be done before the function?
//third, using a) this formatted and vetted table and b) the established rule, run a custom function to update the map
//third, check the output table matches 
//second, convert 
//second, check how many values each are allowed to keep. warn if too many.
//third, import the previous one to get the values.
//

// const flexTable = PrefixTable({
//   "direction": "reverse|row|column",
//   "wrap": "wrap|nowrap",
//   "justify-content": "justify",
//   "align-content": "content",
//   "align-items": "items",
//   gap: "|gap|g",
//   inline: "inline",
// });

const calcGap = calcNum.bind(null, 0.1, "rem");
const pxOrEm = s => { if (s.endsWith(/px|em/)) return s; throw new SyntaxEror("wrong number type"); };
//this endsWith(/\d/) is often against a digit?

const flexTable2 = PrefixTable({
  "flex-direction": [/row|column/, [/row|column|row-reverse|column-reverse/]],
  "flex-wrap": [/wrap|nowrap/, [/wrap|wrap-reverse|nowrap/]],
  "justify-content": [/justify/, [/start|end|center|space-between|space-around|space-evenly/]],
  "align-content": [/content/, [/stretch|flex-start|flex-end|center|space-between|space-around/]],
  "align-items": [/items/, [/stretch|flex-start|flex-end|center|baseline/]],//, Var],
  gap: [/|gap|g/, [calcGap, pxOrEm]],
});

export class Flex {

  static numType = "rem";

  static parse(base, args) {
    return flexTable2(args);
  }
}

function pureNum({ num, suffix }) {
  if (!suffix) return num;
  throw new SyntaxError("no  suffix allowed");
}
function pureInt({ num, suffix }) {
  if (!suffix && Number.isInteger(num)) return num;
  throw new SyntaxError("must be integer");
}

const autoNum = function (arg) {
  return arg.suffix === "auto" ? arg.suffix : calcGap(arg);
};

const flexChildTable2 = PrefixTable({
  "flex": [/|flex/], //must be 3 or less
  "flex-grow": [/g|grow/, [pureNum]],
  "flex-shrink": [/s|shrink/, [pureNum]],
  "flex-basis": [/basis/, [autoNum]],
  "flex-order": [/order/, [pureInt]],
  "align-self": [/auto|flex-start|flex-end|center|baseline|stretch/, [/auto|flex-start|flex-end|center|baseline|stretch/]],
});


export class FlexChild {

  static singleNumFlexChildren = "";

  //margin
  static parse(base, args) {
    debugger;
    debugger;
    debugger;
    const res = flexChildTable2(args);
    if (res.flex) {
      if (res.flex.length === 1)
        res.flex = "hell sunsh";
    }
    return res;
  }
}

export class InlineFlex extends Flex {
  static parse(base, args) {

    debugger;
    debugger;
    debugger;
    debugger;
    debugger;
    const res = super.parse(base, args);
    res.display = "inline-flex";
    return res;
  }
}

