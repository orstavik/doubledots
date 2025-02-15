import { PrefixTable2, join, LENGTH_POS } from "../utils.js";

const BORDER_STYLE = /solid|dashed|dotted|double|groove|ridge|inset|outset|none/;

const BORDER_WIDTH = {
  ...LENGTH_POS,
  word: /thin|medium|thick/
};
const BORDER_RADIUS = {
  "%": a => a + "%",
  "deg": a => a + "deg",
  "rad": a => a + "rad",
};
const spaceJoin4 = join(" ", 1, 4);

const BORDER = new PrefixTable2({
  "border-style": [/|s|style/, BORDER_STYLE, spaceJoin4],
  "border-width": [/|w|width/, BORDER_WIDTH, spaceJoin4],
  "border-radius": [/r|radius/, BORDER_RADIUS, spaceJoin4],
  r2: [/rr|r2/, BORDER_RADIUS, spaceJoin4]
});

//$border doesn't set border-color!! It uses * {border-color: inherit } set by $color.
export function border(start, args) {
  const res = BORDER.argsToDict(args);
  res["border-style"] ??= "solid";
  res["border-width"] ??= "1/3rem";
  if (res.r2) {
    res["border-radius"] ??= "0";
    res["border-radius"] += " / " + res.r2;
    delete res.r2;
  }
  return res;
}

//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_rr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]
