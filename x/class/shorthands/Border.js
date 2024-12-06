export function parseDirections(trblxy, suffix) {
  const res = new Set();
  for (let [d] of trblxy.matches(/top|left|bottom|right|t|l|r|b|x|y/g)) {
    if (d === "t") res.add("top");
    else if (d === "b") res.add("bottom");
    else if (d === "l") res.add("left");
    else if (d === "r") res.add("right");
    else if (d === "x") res.add("left").add("right");
    else if (d === "y") res.add("top").add("bottom");
    else res.add(d);
  }
  return !res.size ? [""]:
   suffix ? [...res].map(d=> d + suffix) : [...res];
}

export class Border {
  static element({ direction, style, width, radius, color, collapse }) {
    const res = {};
    if (collapse) {
      let [colSep, { num, type }] = collapse;
      res["border-collapse"] = colSep;
      res["border-spacing"] = num + type;
    }
    const directions = parseDirections(direction);
    for (let dir of directions) {
      if (style) res[`border-${dir}style`] = style;
      if (width) res[`border-${dir}width`] = width.fullNumber;
      if (radius) res[`border-${dir}radius`] = radius;
      if (color) res[`--border-${dir}color`] = color;
    }
    return res;
  }
}
