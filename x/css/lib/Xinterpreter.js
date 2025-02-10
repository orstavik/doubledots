import { parse$Expression } from "./Xparser.js";
import { flex, _flex } from "./Xlayout.js";
import { border } from "./Xborder.js";

const shortFuncs = { flex, _flex, border, };

function interpret(exp) {
  const obj = shortFuncs[exp.name](exp);
  return Object.fromEntries(Object.entries(obj)
    .filter(kv => kv[1] != null)
    .map(([k, v]) => [k.replace(/[A-Z]/g, "-$&").toLowerCase(), v])
  );
}

export function interpretClass(txt) {
  const { container: { selector, shorts }, items } = parse$Expression(txt);
  const res = {
    [selector]: Object.assign({}, ...shorts.map(x => interpret(x)))
  };
  for (let { selector, shorts } of items)
    res[selector] = Object.assign({}, ...shorts.map(x => interpret(x)));
  return res;
  // const superShorts = container.shorts.map(s => superShorts[s.name]).filter(Boolean);
  //merge the superShorts objects with the .results objects from container and items
  // return { container, items };
}