import { PrefixTable2, isOnlyOne, INT, NUMBER_POS, LAYOUT_CONTAINER, LAYOUT_MARGIN, LENGTH_ANY, PERCENT } from "../../../../x/css/lib/utils.js";

//CONTAINER
const FLEX_DIR = /row|row-reverse|column|column-reverse/;
const FLEX_WRAPS = /wrap|nowrap|wrap-reverse/;

const FLEX_CONTAINER = new PrefixTable2({
  "flex-direction": [/()/, FLEX_DIR, isOnlyOne],
  "flex-wrap": [/()/, FLEX_WRAPS, isOnlyOne],
  ...LAYOUT_CONTAINER
});

export function flex(start, args) {
  const res = FLEX_CONTAINER.argsToDict(args);
  res["display"] = "flex";
  return res;
}

//ITEM
const FLEX_ALIGN_SELF = /stretch|start|end|flex-start|flex-end|center|baseline/;
const FLEX_BASIS = {
  word: /none|auto|min-content|max-content|fit-content/,
  ...LENGTH_ANY,
  ...PERCENT
};
function flexShorthand(args) {
  if (args.length == 1) {
    const w = PrefixTable2.processArg(FLEX_BASIS, args[0]);
    if (w === "none") return "0 0 auto";
    if (w) return `1 1 ${w}`;
    const n = PrefixTable2.processArg(NUMBER_POS, args[0]);
    if (n) return `${n} 1 0%`;
  } else if (args.length == 2) {
    let [a, b] = args;
    a = a === "" ? 0 : PrefixTable2.processArg(NUMBER_POS, a);
    let B = PrefixTable2.processArg(FLEX_BASIS, b);
    if (B != null) return `${a} 1 ${B}`;
    B = PrefixTable2.processArg(NUMBER_POS, b);
    if (B != null) return `${a} ${B} 0%`;
  } else if (args.length == 3) {
    const [a = 0, b = 0, c] = args;
    a = a === "" ? 0 : PrefixTable2.processArg(NUMBER_POS, a);
    b = b === "" ? 0 : PrefixTable2.processArg(NUMBER_POS, b);
    c = PrefixTable2.processArg(FLEX_BASIS, c);
    if (a != null && b != null && c != null)
      return `${a} ${b} ${c}`;
  }
}

const FLEX_ITEM = new PrefixTable2({
  "flex": [/()/, , flexShorthand],
  "align-self": [/()/, FLEX_ALIGN_SELF, isOnlyOne],
  "order": [/order/, INT, isOnlyOne],
  ...LAYOUT_MARGIN
});

export function _flex(start, args) {
  const res = FLEX_ITEM.argsToDict(args);
  return res;
}

// //<unset> is default
// /start|end|center|flex-start|flex-end/
// /space-between|space-around|space-evenly|stretch/
// /left|right/
// /baseline|firstbaseline|lastbaseline/

// //stretch is default
// /start|end|center|flex-start|flex-end/
// /left|right/    
// /baseline|firstbaseline|lastbaseline/

// //added to make the value fallback to start. Do we need unsafe?
// /unsafe|safe/

// $row => $flex_row
// $col => $flex_column

const inDoubleRename = {
  left: "start",
  top: "start",
  right: "end",
  bottom: "end",
  pad: "space-evenly",
  spread: "space-around",
  stretch: "space-between",
}
const aloneRenameRow = {
  left: "start",
  top: "start",
  right: "end",
  bottom: "end",
  pad: "space-around",
  spread: "space-evenly",
  wide: "space-between",
  tall: "space-between"
}
const aloneRenameColumn = {

}
const rows = {
  "": "start start",
  center: "center center",
  right: "end start",
  pad: "space-around start",
  space: "space-around space-around",
  spread: "space-between start",
  "spread-wide": "space-between start",
  buckshot: "space-between space-between", //

};
/*
$flex-superspread { $flex-spread - wide_spread - wide |* $flex_center; }
$flex-space { $flex_pad-pad |* $flex_center; }  or should we use $flex - spread_spread instead ?
$flex-2columns { $flex_column_spread - wide |* $flex_left$width_50 % }
$flex-3columns { $flex_column_spread - wide |* $flex_left$width_33.3 % }
$flex-4columns { $flex_column_spread - wide |* $flex_left$width_25 % } 
*/