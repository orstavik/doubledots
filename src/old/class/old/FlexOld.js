import { DollType } from "./DollType.js";
export class FlexChild extends DollType {

  static keywords = {
    grow: /grow|g/,
    shrink: /shrink|s/,
    basis: /basis|/,
    order: /order/,
    self: /auto|flex-start|flex-end|center|baseline|stretch/
  };

  static numType = "rem";

  //margin
  static element({ grow, shrink, basis, order, self }) {
    debugger
    const res = {};
    if (grow) res["flex-grow"] = grow.num;
    if (shrink) res["flex-shrink"] = shrink.num;
    if (basis) res["flex-basis"] = basis.fullNumber;
    if (order) res["order"] = order.num;
    if (self) res["align-self"] = self;
    return res;
  }
}


export class Flex extends DollType {
  // static identifiers = ["flex", "inline-flex"];

  static keywords = {
    inline: /inline/,
    direction: /|row|column/,
    reverse: /reverse/,
    wrap: /wrap|wrap-reverse|nowrap/,
    justify: /start|end|center|space-between|space-around|space-evenly/,
    align: /stretch|flex-start|flex-end|center|baseline/,
    content: /stretch|flex-start|flex-end|center|space-between|space-around/,
    gap: /gap/
  };

  static numType = "rem";

  static element({ inline, direction, wrap, justify, align, content, gap }) {
    const res = {
      display: "flex" + inline && "-inline",
      "flex-direction": direction || "row",
      "flex-wrap": wrap || "nowrap",
      "justify-content": justify || "flex-start",
      "align-items": align || "stretch",
      "align-content": content || "stretch",
      gap: 0
    };
    if (gap) {
      let { num, type } = gap;
      res["gap"] = num + type;
    }
    return res;
  }
}
