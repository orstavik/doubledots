import { PositiveLengthPercent, Word, P, ListOfSame, Merge,Assign, Dictionary, LogicalFour, CheckNum, ListOf } from "./Xfunc.js";

//wrap is a single word. ellipsis-scroll => block: ellipsis, inline: scroll
const OVERFLOW = /(ellipsis|clip)|(auto|scroll|visible)(?:-(auto|scroll|hidden|visible))?/;
//ellipsis/clip => hidden, //single setting means both
function doOverflow(_, t, b = "hidden", i = b) {
  return {
    "overflow-x": i,
    "overflow-inline": i,
    "overflow-y": b,
    "overflow-block": b,
    "text-overflow": t,
    "white-space": t ? "nowrap" : undefined
  };
};

const LAYOUT = [
  LogicalFour("padding", ListOfSame("padding|p", PositiveLengthPercent)),
  Word(OVERFLOW, doOverflow),
  LogicalFour("scroll-padding", ListOfSame("scroll-padding", PositiveLengthPercent)),
  P("scroll-snap-type", Word(
    /snap(?:-(block|inline))?(?:-(mandatory))?/,
    (_, b = "both", m = "proximity") => `${b} ${m}`))
];
const _LAYOUT = [
  LogicalFour("margin", ListOfSame("margin|m", PositiveLengthPercent)),
  LogicalFour("scroll-margin", ListOfSame("scroll-margin", PositiveLengthPercent))
];

export const block = Assign({display: "block"}, Merge(Dictionary(
  P("float", Word(/float-(start|end)/, (_, s) => "inline-" + s)),
  ...LAYOUT,
)));
export const _block = Merge(Dictionary(
  ..._LAYOUT
));

//GRID
const Gap = Merge(ListOf("gap|g",
  P("column-gap", PositiveLengthPercent),
  P("row-gap", PositiveLengthPercent)
));
const AlignAliases = {
  a: "start",
  b: "end",
  c: "center",
  s: "stretch",
  u: "space-around", //narrow stretch
  v: "space-evenly", //medium stretch
  w: "space-between",//wide stretch
  _: "baseline",     //todo what about "(first|last) baseline"
  ".": undefined,
};
const GRID_ALIGN = /([abcsuvw.])([abcsuvw.])([abcs_.])([abcs])/;
const _GRID_ALIGN = /([abcs_.])([abcs])/;
function doAlign(_, b, i, b2, i2) {
  return {
    "align-content": AlignAliases[b],
    "justify-content": AlignAliases[i],
    "align-items": AlignAliases[b2],
    "justify-items": AlignAliases[i2],
  };
}
function doAlignSelf(_, b, i) {
  return {
    "align-self": AlignAliases[b],
    "justify-self": AlignAliases[i],
  };
}

export const grid = Assign({display: "grid"}, Merge(Dictionary(
  // P("grid-template-areas",Word( "none")), //todo how do we want to write this in csss?
  P("grid-auto-columns", ListOfSame("column|c", PositiveLengthPercent)),
  P("grid-auto-rows", ListOfSame("row|r", PositiveLengthPercent)),
  P("grid-auto-flow", Word(/(dense)-?(column)/, (_, d, c = "row") => `${d} ${c}`)),
  Word(GRID_ALIGN, doAlign),
  Gap,
  ...LAYOUT
)));

export const _grid = Merge(Dictionary(
  Word(_GRID_ALIGN, doAlignSelf),
  ..._LAYOUT
));

//FLEX
const FLEX_ALIGN = /([abcsuvw.])([abcsuvw.])([abcs_])/;
const _FLEX_ALIGN = /([abcs_])/;

export const flex = Assign({display: "flex"}, Merge(Dictionary(
  P("flex-direction", Word(/column|column-reverse|row-reverse/)),
  P("flex-wrap", Word(/wrap|wrap-reverse/)),
  Word(FLEX_ALIGN, doAlign),
  Gap,
  ...LAYOUT
)));

//todo safe
export const _flex = Merge(Dictionary(
  Word(_FLEX_ALIGN, doAlignSelf),
  P("flex-grow", CheckNum("grow|g", 0)),
  P("flex-shrink", CheckNum("shrink|s", 0)),
  P("order", CheckNum("order|o", 0, null, true)),
  P("flex-basis", ListOf("basis", PositiveLengthPercent)),
  ..._LAYOUT
));
