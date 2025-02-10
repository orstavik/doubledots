import {PositiveLengthPercent, Sequence} from "./Xfuncs2.js";

//todo border is not really a sequence. It is a Dictionary. Size is a Sequence

//todo add fit-content to PositiveLengthPercent

function FitContent(cb){
  return function fitContent(exp){
    if(exp?.name === "fit-content"){
      debugger;
    }
    return cb(exp);
  }
}

export const size = Sequence(["block-size", "inline-size"], [FitContent(PositiveLengthPercent)]);