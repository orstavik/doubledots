import { doSequence2, postProcess, single } from "./utils2.js";

const CURSORS = {   //can we remove auto/default here? as cursor now should never inherit?
  word: /auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|grab|grabbing|col-resize|row-resize|n-resize|s-resize|e-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out/,
  quote: v => `url(${v})`
};

export function cursor(start, args) {
  const res = doSequence2([["cursor", [CURSORS, 1]]], args);
  const res2 = postProcess({ "cursor": single }, res);
  return res2;
}