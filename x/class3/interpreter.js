import { border, _border } from "./shorts/Border.js";
import { flex, _flex } from "./shorts/Flex.js";
import { paletteMaterial, colorMaterial } from "./shorts/ColorMaterialWeb.js";

import { parse$Expression, parse$SuperShorts, toCssText } from "./parser.js";

class ShortsResolver {
  constructor(funcs) {
    this.functions = funcs.slice().sort((a, b) => b.name.length - a.name.length);
    this.superShorts = {};
  }

  addSuperShorts(shortTxt) {
    const parsed = parse$SuperShorts(shortTxt);
    for (let k in parsed)
      this.superShorts[k] = interpret$Expression(parsed[v], this);
  }

  interpret(res, selector, { name, camel, args }, item) {
    if (!item)
      if (name in this.superShorts)
        for (let key in this.superShorts[name])
          res[key] = Object.assign(res[key] || {}, this.superShorts[name][key]);
    const func = this.functions.find(func => camel.startsWith(func.name));
    if (!func)
      throw new SyntaxError(`The $short "${name}" with lookup "${camel}" doesn't match any $short function.`);
    res[selector] ??= {};
    Object.assign(res[selector], func(res[selector], args));
    return res;
  }
}

function interpret$Expression(segs, shortResolver) {
  let res = {};
  for (let i = 0; i < segs.length; i++) {
    const { selector, shorts } = segs[i];
    for (let short of shorts)
      res = shortResolver.interpret(res, selector, short, i);
  }
  return res;
}

const shorts = new ShortsResolver([border, _border, flex, _flex, paletteMaterial, colorMaterial]);

function init(shortTxt) {
  shorts.addSuperShorts(shortTxt);
}

function analyzeRule(rule) {
  const [, item, specificity] = rule.match(/\/\*(item|container) (\d+)\*\//);
  return { item: item === "item", specificity: parseInt(specificity) };
}

const ITEM = /\/\*item (\d+)\*\//g;
const CONTAINER = /\/\*container (\d+)\*\//g;
function injectRule(shortName, short, res = "") {
  for (let rule of toCssText(shortName, short)) {
    const { item, specificity } = analyzeRule(rule);
    if (item === "item") {
      for (let m; m = ITEM.exec(res);)
        if (parseInt(m[0]) > specificity)
          return res.slice(0, m.index) + rule + res.slice(m.index);
      if (m = CONTAINER.exec(res))
        return res.slice(0, m.index) + rule + res.slice(m.index);
    } else {
      for (let m; m = CONTAINER.exec(res);)
        if (parseInt(m[0]) > specificity)
          return res.slice(0, m.index) + rule + res.slice(m.index);
    }
    return res + rule;
  }
}

function add$Classes(classList, shortsToCss) {
  let tmp;
  for (let short of classList)
    if (!(short in shortsToCss))
      if (tmp = parse$Expression(short))
        if (tmp = interpret$Expression(tmp, shorts))
          shortsToCss[short] = tmp;
}

const defaultCss = `
* { 
  margin: 0; 
  padding: 0; 
  box-sizing: border-box; 
  --dark-mode: 0;
}
@media(prefers-color-scheme:dark) { * {
  --dark-mode: -1; 
} }
:where(:not(html)) {
  /*COLOR INHERITANCE  (don't use native css shorthands: border, text-decoration)*/
  /*border-color: inherit; /*does this work with inherit*/
  border-top-color: inherit;
  border-right-color: inherit;
  border-bottom-color: inherit;
  border-left-color: inherit;
  text-decoration-color: inherit;
  --dark-mode: 1;
}
`;

export function run(style) {
  init(style.getAttribute("css-shorts"));
  const shorts = {}; //this should be a global variable??
  for (let el of document.querySelectorAll('[class*="$"]'))
    add$Classes(el.classList, shorts);
  style.discovered = shorts;
  let mainTxt = "";
  for (let shortName in shorts)
    mainTxt = injectRule(shortName, shorts[shortName], mainTxt);
  style.textContent += defaultCss + mainTxt;
}


//1. $border-one=border_[2px,4px]_dashed
//2. $border-one_solid

//border-image, border,
//$border-image-x=border-image_20px|

/*
$border-color-sale {
    $border_2px //5px
    $color_red
  |:hover
    $border_4px
    //$color_border[red]
}

<ul class="$border-color-sale$border_w[*2]$color_border[blue]|:hover$color_border[red]"></ul>
(colorDefault, borderDefault, borderColorSale)

*/

//returns {container: cssDict, itemSelector1: cssDict, itemSelector2: cssDict}
/**
const border-one = {
  "" : {
    border-width: 2px;
    border-style: dashed;
    color: red;
  },
  ":hover" : {
    border-width: 4px;
    color: orange;
  }
}

superShorts = {  //bigResult with {name: {container, itemSelector1, itemSelector2}}
  border-one,
  border-two,
  flex-navbar
}
 */