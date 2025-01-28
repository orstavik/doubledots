import { INT, LENGTH_PERCENT, LENGTH_PERCENT_POS, spaceJoin4, spaceJoin2 } from "./utils.js";
import { doPrefix, logicalFour, uno, WIDTH } from "./utils2.js";

function wrapReplace(args) {
  if (args.length > 2)
    throw new SyntaxError("Too many arguments");
  let [block, inline] = args;
  block &&= block.replace("auto-scroll", "auto");
  const inlineMap = {
    wrap: "wrap wrap normal",
    reverse: "wrap-reverse wrap normal",
    ellipsis: "nowrap ellipsis nowrap",
    nowrap: "nowrap visible nowrap",
    hidden: "nowrap clip nowrap",
    "auto-scroll": "nowrap auto normal",
    scroll: "nowrap scroll normal"
  };
  if (inline) {
    const t = inlineMap[inline].split(" ");
    inline = { "flex-wrap": t[0], "overflow-inline": t[1], "white-space": t[2] };
    if (block)
      inline.overflow = block;
    return inline;
  }
  return { overflow: block };
}
const wrapInline = { word: /wrap|reverse|ellipsis|nowrap|hidden|auto-scroll|scroll/ };
const wrapBlock = { word: /nowrap|hidden|auto-scroll|scroll/ };

const ALIGN = {
  word: w => (w = w.match(/^((start|center|end)|around|between|evenly)$/)) ? w[1] || `space-${w[0]}` : undefined
};
const SCROLL_SNAP_TYPE = {
  word: w =>
    (w = w.match(/^snap(?:-(block|inline))*(?:-(mandatory))$/)) ?
      (w[1] || "both") + (w[2] ? " " + w[2] : "") : undefined
};

const CONTAINER3 = {
  "flex-direction": [uno, { word: /row|column/ }],
  "flex-wrap": [wrapReplace, wrapBlock, wrapInline],
  "scroll-padding": [uno, { "scroll-padding": [spaceJoin4, LENGTH_PERCENT_POS] }],
  "scroll-snap-type": [uno, SCROLL_SNAP_TYPE],
  "gap": [spaceJoin2, {
    gap: [uno, LENGTH_PERCENT_POS],
    g: [uno, LENGTH_PERCENT_POS]
  }],
  "padding": [logicalFour, {
    padding: [uno, LENGTH_PERCENT_POS],
    p: [uno, LENGTH_PERCENT_POS],
  }],
  "place-content": [spaceJoin2, ALIGN],

  //flex specific
  "reverse": [uno, { word: /reverse/ }]
};
const ITEM3 = {
  "margin": [logicalFour, {
    margin: [v => v, LENGTH_PERCENT],
    m: [v => v, LENGTH_PERCENT],
  }],
  "scroll-margin": [logicalFour, {
    "scroll-margin": [v => v, LENGTH_PERCENT],
  }],
  // "scroll-snap-align": {
  //   word: w => w.match(/^snap-(start|center|end)$/)?.[1]
  // },
  // "scroll-snap-stop": {
  //   word: w => w === "snap-stop-always" ? "always" : undefined
  // },


  // "place-self": [spaceJoin2, ALIGN],  //todo grid

  //flex props
  "flex-grow": [uno, { word: w => w.match(/^grow(\d+(?:\.\d+)?)$/)?.[1] }],
  "flex-shrink": [uno, { word: w => w.match(/^shrink(\d+(?:\.\d+)?)$/)?.[1] }],
  "flex-basis": [uno, { basis: [uno, WIDTH] }],
  "align-self": [uno, ALIGN],
  "order": [uno, { order: [uno, INT] }],
  "safe": [uno, { word: /safe/ }],
};

// => flex-direction (default: row)
// => overflow-block (default: visible)
// => overflow-inline (default: visible)
// => justify-content (default: start)
// => align-items (default: stretch)

// $flex_direction_[wrap-block,wrap-inline]_[align-block,align-inline]_scroll-snap_gap_margin
export function flex(start, args) {
  const res = doPrefix(CONTAINER3, args);
  res["display"] = "flex";
  if (res.reverse) {
    res["flex-direction"] = (res["flex-direction"] ?? "row") + "-reverse";
    delete res.reverse;
  }
  return res;
}

export function _flex(start, args) {
  const res = doPrefix(ITEM3, args);
  if (res.safe) {
    res["align-self"] = "safe " + (res["align-self"] ?? "start");
    delete res.safe;
  }
  // "flex": [flexShort, FLEX_SHORT], //merge the grow and shrink and basis into one
  return res;
}