// import { PrefixTable2, join, isOnlyOne, LENGTH_ANY } from "./utils.js";

// const spaceJoin4 = join("0", " ", 4);

// const SCROLL_INLINE = new PrefixTable2({
//   "scroll-snap-type": [/()/, /mandatory|proximity/, ([a]) => `inline ${a}`],
//   "overflow-inline": [/()/, /always/, _ => "scroll"],
//   "scroll-padding": [/p|padding/, LENGTH_ANY, spaceJoin4]
// });
// const SCROLL = new PrefixTable2({
//   "scroll-snap-type": [/()/, /mandatory|proximity/, ([a]) => `block ${a}`],
//   "overflow-block": [/()/, /always/, _ => "scroll"],
//   "scroll-padding": [/p|padding/, LENGTH_ANY, spaceJoin4]
// });
// const _scrollPrefixes = new PrefixTable2({
//   "scroll-margin": [/m|margin/, LENGTH_ANY, spaceJoin4],
//   "scroll-snap-align": [/()/, /start|center|end/, isOnlyOne],
//   "scroll-snap-stop": [/()/, /stop/, _ => "always"],
// });

// export function scroll(start, args) {
//   const res = SCROLL.argsToDict(args);
//   res["overflow-block"] ??= "auto";
//   return res;
// }

// export function scrollInline(start, args) {
//   const res = SCROLL_INLINE.argsToDict(args);
//   res["overflow-inline"] ??= "auto";
//   return res;
// }

// export function _scroll(start, args) {
//   const res = _scrollPrefixes.argsToDict(args);
//   return res;
// }

// export function ellipsis(start, args) {
//   return {
//     "overflow-block": "hidden",
//     "white-space": "nowrap",
//     "text-overflow": "ellipsis"
//   };
// }

// export function clip(start, args) {
//   return {
//     "overflow-block": "hidden",
//     "white-space": "nowrap", //todo this applies to display: block, not really to flex and grid...
//     "text-overflow": "clip"
//   };
// }

// export function hidden(start, args) { return { "overflow-block": "hidden" }; }
// export function overflow(start, args) { return { "overflow-block": "visible" }; }
// export function hiddenInline(start, args) { return { "overflow-inline": "hidden" }; }
// export function overflowInline(start, args) { return { "overflow-inline": "visible" }; }







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
