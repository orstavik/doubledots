import { PrefixTable, calcNum, spaceJoin } from "./utils.js";

const zeroOrMoreUnitless = ({ n, num, unit }) => !unit && n >= 0 ? num : undefined;
const onlyFirst = a => a[0];
const calcBasis = calcNum.bind(null, 100, "%");
const calcMP = calcNum.bind(null, 0.1, "rem");
const intOnly = ({ n }) => Number.isInteger(n) ? n : undefined;

const flexDirections = /row|row-reverse|column|column-reverse|col|col-reverse/;
const flexWraps = /wrap|nowrap|wrap-reverse/;

//
const justifyContent = /start|end|flex-start|flex-end|center|space-between|space-around|space-evenly/;
const alignItems = /stretch|start|end|flex-start|flex-end|center|baseline/;
const alignContent = /stretch|start|end|flex-start|flex-end|center|space-between|space-around/;

const flexContainerPrefix = new PrefixTable({
  "flex-direction": [/()/, flexDirections, onlyFirst],
  "flex-wrap": [/()/, flexWraps, onlyFirst],
  "gap": [/|g|gap/, calcMP, onlyFirst],
  "justify-content": [/justify|j/, justifyContent, onlyFirst],
  "align-items": [/items|i/, alignItems, onlyFirst],
  "align-content": [/content|c/, alignContent, onlyFirst],
  "padding": [/p|padding/, calcMP, spaceJoin],
});

export function flex(start, args) {
  const res = flexContainerPrefix.argsToDict(args);
  res["display"] = "flex";
  
  if (res["flex-direction"])
    res["flex-direction"] = res["flex-direction"]?.replace(/col($|-)/, "column");
  return res;
}

const alignSelf = /auto|stretch|start|end|flex-start|flex-end|center|baseline/;
const flexItemPrefix = new PrefixTable({
  "flex-grow": [/|g|grow/, zeroOrMoreUnitless, onlyFirst],
  "flex-shrink": [/s|shrink/, zeroOrMoreUnitless, onlyFirst],
  "flex-basis": [/b|basis/, calcBasis, onlyFirst],  //sizing keywords and "content".
  "align-self": [/align|align|a/, alignSelf, onlyFirst],
  "order": [/order/, intOnly, onlyFirst],
  "margin": [/m|margin/, calcMP, spaceJoin],
});

export function _flex(start, args) {
  const res = flexItemPrefix.argsToDict(args);
  debugger;
  return res;
}