import { PrefixTable, calcNum } from "./SHORT.js";

const calc = calcNum.bind(null, 1 / 3, "rem");

const borderPrefix = PrefixTable({
  "border-style": [/solid|dashed|dotted|double|groove|ridge|inset|outset|none/, 4],
  "border-width": [/|w|width/, 4, calc],
  "border-radius": [/r|radius/, 4, calc],
  "border-collapse": [/collapse|separate/, 1], //todo
  rr: [/rr/, 4, calc],
});

export class Border {

  static parse(args, base) {
    const res = borderPrefix(args);
    if (res["border-collapse"]) {
      res["border-spacing"] = calc(res["border-collapse"]);
      res["border-collapse"] = res["border-collapse"].prefix;
    }

    for (let type in res)
      if (res[type] instanceof Array)
        res[type] = res[type].join(" ");

    if (res.rr) {
      res["border-radius"] += " / " + res.rr;
      delete res.rr;
    }
    return res;
  }
}