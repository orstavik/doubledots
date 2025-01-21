import { PrefixTable, calcNum, spaceJoin } from "./utils.js";

const calc = calcNum.bind(null, 0, "%");

function makeScrollPrefixTable(inline) {
  const dict = {
    "scroll-snap-type": [/()/, /mandatory|proximity/, ([a]) => `${inline} ${a}`],
    "scroll-padding": [/|p|padding/, calc, spaceJoin],
  }
  if(inline)
    dict["overflow-inline"]= [/()/, /always/, _ => "scroll"];
  else 
    dict["overflow-block"]= [/()/, /always/, _ => "scroll"];
  return new PrefixTable(dict);
}

const scrollPrefixes = makeScrollPrefixTable();
export function scroll(start, args) {
  const res = scrollPrefixes.argsToDict(args);
  res["overflow-block"] ??= "auto";
  return res;
}

const _scrollPrefixes = new PrefixTable({
  "scroll-margin": [/|m|margin/, calc, spaceJoin],
  "scroll-snap-align": [/()/, /start|center|end/, spaceJoin],
  "scroll-snap-stop": [/()/, /stop/, _ => "always"],
});
export function _scroll(start, args) {
  const res = _scrollPrefixes.argsToDict(args);
  return res;
}

const scrollInlinePrefixes = makeScrollPrefixTable("inline");
export function scrollInline(start, args) {
  const res = scrollInlinePrefixes.argsToDict(args);
  res["overflow-inline"] ??= "auto";
  return res;
}

export function ellipsis(start, args) {
  return {
    "overflow-block": "hidden",
    "white-space": "nowrap",
    "text-overflow": "ellipsis"
  };
}

export function clip(start, args) {
  return {
    "overflow-block": "hidden",
    "white-space": "nowrap",
    "text-overflow": "clip"
  };
}

export function hidden(start, args) { return { "overflow-block": "hidden" }; }
export function overflow(start, args) { return { "overflow-block": "visible" }; }
export function hiddenInline(start, args) { return { "overflow-inline": "hidden" }; }
export function overflowInline(start, args) { return { "overflow-inline": "visible" }; }





//polyfill for logical writing-mode 
//if we set writing mode to a vertical type (eg. Japanese), then:
//{ --writing-mode-y: " "; }
//else (eg. English):
//{ --writing-mode-y: unset; }  //we must turn off any inheritance.
//with this "space variable", we can add and not add the following overflow-x and overflow-y properties.

// function overflowLogical(value) {
//   return {
//     "overflow-y": `var(--writing-mode-y, invalid) ${value}`,
//     "overflow-x": `var(--writing-mode-y, ${value})`,
//     "overflow-block": value,
//   };
// }
// function overflowLogicalInline(value) {
//   return {
//     "overflow-x": `var(--writing-mode-y, invalid) ${value}`,
//     "overflow-y": `var(--writing-mode-y, ${value})`,
//     "overflow-inline": value,
//   };
// }
