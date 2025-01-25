import { PrefixTable2, INT, LENGTH_PERCENT, LAYOUT, NUMBER_POS, clamp, SINGULAR } from "./utils.js";

const FLEX_BASIS = {
  word: str=> str.match(/^(none|auto|min-content|max-content|fit-content)$/)?.[0],
  ...LENGTH_PERCENT,
  ...NUMBER_POS
};

//todo this should likely be a set of words too.. 
//todo create several words like "grow", "shrink", "stretch" etc.
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

const flexWrapInline = {
  wrap: {
    "flex-wrap": "wrap",
    "overflow-inline": "wrap",
    "white-space": "normal"
  },
  reverse: {
    "flex-wrap": "wrap-reverse",
    "overflow-inline": "wrap",
    "white-space": "normal"
  },
  ellipsis: {
    "flex-wrap": "nowrap",
    "overflow-inline": "ellipsis",
    "white-space": "nowrap"
  },
  nowrap: {
    "flex-wrap": "nowrap",
    "overflow-inline": "visible",
    "white-space": "nowrap"
  },
  hidden: {
    "flex-wrap": "nowrap",
    "overflow-inline": "clip",
    "white-space": "nowrap"
  },
  auto: {
    "flex-wrap": "nowrap",
    "overflow-inline": "auto",
    "white-space": "normal"
  },
  scroll: {
    "flex-wrap": "nowrap",
    "overflow-inline": "scroll",
    "white-space": "normal"
  }
};

const alignDict = {
  pad: "space-around",
  wide: "space-between",
  spread: "space-evenly",
  center: "center",
  end: "end",
  "": "start"
};

// => flex-direction (default: row)
// => overflow-block (default: visible)
// => overflow-inline (default: visible)
// => justify-content (default: start)
// => align-items (default: stretch)

const FlexContainer = new PrefixTable2({
  "flex-direction": [/^$/, LAYOUT.DIRECTIONS, SINGULAR],
  reverse: [/^$/, /reverse/, SINGULAR],
  wrap: [/^$/, LAYOUT.WRAP, clamp(1, 2)],
  "place-content": LAYOUT.ALIGN,
  ...LAYOUT.GAP,
  ...LAYOUT.PADDING,
  ...LAYOUT.SCROLL_CONTAINER
});

// $flex_direction_[wrap-block,wrap-inline]_[align-block,align-inline]_scroll-snap_gap_margin
export function flex(start, args) {
  
  const res = FlexContainer.argsToDict(args);
  res["display"] = "flex";
  res["place-content"] = res.place?.map(a => alignDict[a]).join(" ");
  delete res.place;
  if (res.reverse) {
    res["flex-direction"] = (res["flex-direction"] ?? "row") + "-reverse";
    delete res.reverse;
  }
  if (res.wrap) {
    const [one = "nowrap", two = "nowrap"] = res.wrap;
    delete res.wrap;
    if (one && !one.match(LAYOUT.WRAP_BLOCK))
      throw new SyntaxError(`Invalid value for flex-wrap block direction: ${one}`);
    res["flex-wrap"] = one;
    Object.assign(res, flexWrapInline[two]);
  }
  //if there are no default values in the start, would we then like to add the default values here?
  return res;
}

const FlexItem = new PrefixTable2({
  "flex": [/^$/, , flexShorthand],
  "order": [/order/, INT, SINGULAR],
  "safe": [/^$/, /safe/, SINGULAR],
  "align-self": LAYOUT.ALIGN_1,
  ...LAYOUT.MARGIN,
  ...LAYOUT.SCROLL_ITEM
});

export function _flex(start, args) {
  debugger
  const res = FlexItem.argsToDict(args);
  if (res.safe) {
    res["align-self"] = "safe " + (res["align-self"] ?? "start");
    delete res.safe;
  }
  //if there are no default values in the start, would we then like to add the default values here?
  return res;
}