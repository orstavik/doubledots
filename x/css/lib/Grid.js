import { PrefixTable2, INT, LAYOUT, SINGULAR, spaceJoin2, LENGTH_PERCENT_POS } from "./utils.js";

/**
 * Minimal track-size dictionary:
 * You can expand this to support minmax(), repeat(), etc. 
 */
/**
 * Here, we're capturing any use of "rows: <track-size>".
 * You can choose your own prefix or pattern if you like.
 *
 * The 3rd item in the array is a "merge function" that can
 * return an object with the property you want to assign.
 */

const TRACK_SIZES = {
  word: /auto|min-content|max-content|fit-content/,
  ...LENGTH_PERCENT_POS
};

/**
 * A dictionary to translate your "place" arguments to actual CSS values.
 * (Same as you used for Flex, but can be reused for Grid "place-content" or "place-self".)
 */
a => a.replace("pad", "space-around").replace("wide", "space-between").replace("spread", "space-evenly");
const alignDict = {
  pad: "space-around",
  wide: "space-between",
  spread: "space-evenly"
};

a => a.replace(/around|between|evenly/, a => "space-" + p);

const GridContainer = new PrefixTable2({
  "grid-template-rows": [/rows/, TRACK_SIZES, a => a.join(" ")],
  "grid-template-columns": [/cols/, TRACK_SIZES, a => a.join(" ")],
  "grid-auto-flow": [/^$/, LAYOUT.DIRECTIONS, SINGULAR],
  dense: [/^$/, /dense/, SINGULAR],
  "place-content": LAYOUT.ALIGN,
  ...LAYOUT.GAP,
  ...LAYOUT.PADDING,
  ...LAYOUT.SCROLL_CONTAINER
});

export function grid(start, args) {
  const res = GridContainer.argsToDict(args);
  res.display = "grid";
  if (res.dense) {
    res["grid-auto-flow"] = (res["grid-auto-flow"] ?? "row") + "-dense";
    delete res.dense;
  }
  return res;
}

const GridItem = new PrefixTable2({
  // For a minimal example, we assume "row: 1" => "grid-row: 1"
  // but you can add more complex logic for spans like "1 / 3", etc.
  "grid-row": [/row/, INT, SINGULAR],
  "grid-col": [/col/, INT, SINGULAR],
  "place-self": [/^$/, LAYOUT.ALIGN, spaceJoin2],
  ...LAYOUT.MARGIN,
  ...LAYOUT.SCROLL_ITEM
});

export function _grid(start, args) {
  const res = GridItem.argsToDict(args);
  return res;
}
