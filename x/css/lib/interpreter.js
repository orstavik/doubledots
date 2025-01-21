import { border, _border } from "./Border.js";
import { flex, _flex } from "./Flex.js";
import { paletteMaterial, colorMaterial } from "./ColorMaterialWeb.js";
import { w, h, h as _h, w as _w } from "./WidthHeight.js";
import { ellipsis, clip, scroll, scrollInline, _scroll, hidden } from "./Overflow.js";

const SHORTS = {
  border, _border,
  flex, _flex,
  paletteMaterial, colorMaterial,
  h, _h, w, _w,
  ellipsis, clip, scroll, scrollInline, _scroll, hidden
};

import { parse$Expression, parse$SuperShorts, toCssText } from "./parser.js";

export class ShortsResolver {
  constructor(funcs, styleEl) {
    this.functions = funcs;
    const camelsLongestFirst = Object.keys(funcs).sort((a, b) => b.length - a.length).join("|");
    this.funcFinder = new RegExp(`^(${camelsLongestFirst})`);
    this.styleEl = new ShortStyleElement(styleEl);
    this.superShorts = {};
    this.shortsToCss = {};
  }

  static init(el) {
    const csss = new ShortsResolver(SHORTS, el);
    const parsed = parse$SuperShorts(el.textContent);
    for (let k in parsed)
      csss.superShorts[k] ??= csss.interpret$Expression(parsed[k]);
    return csss;
  }

  interpret$Expression(segs) {
    let res = {};
    for (let i = 0; i < segs.length; i++) {
      const { selector, shorts } = segs[i];
      for (let short of shorts)
        res = this.interpret(res, selector, short, i);
    }
    return res;
  }

  interpret(res, selector, { name, camel, args }, item) {
    if (!item)
      if (name in this.superShorts)
        for (let key in this.superShorts[name])
          res[key] = Object.assign(res[key] || {}, this.superShorts[name][key]);
    const matchingFunc = camel.match(this.funcFinder)?.[1];
    if (!matchingFunc)
      throw new SyntaxError(`The $short "${name}" with lookup "${camel}" doesn't match any $short function.`);
    const func = this.functions[matchingFunc];
    res[selector] ??= {};
    Object.assign(res[selector], func(res[selector], args));
    return res;
  }

  addClass(short) {
    let tmp;
    if (!(short in this.shortsToCss))
      if (tmp = parse$Expression(short))
        if (tmp = this.interpret$Expression(tmp))
          this.styleEl.injectRule(short, this.shortsToCss[short] = tmp);
  }
}

//todo move this into ShortResolver class
// function interpret$Expression(segs, shortResolver) {
//   let res = {};
//   for (let i = 0; i < segs.length; i++) {
//     const { selector, shorts } = segs[i];
//     for (let short of shorts)
//       res = shortResolver.interpret(res, selector, short, i);
//   }
//   return res;
// }

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

class ShortStyleElement {
  constructor(styleEl) {
    this.styleEl = styleEl;
    styleEl.textContent = ShortStyleElement.defaultCss + styleEl.textContent + `/* dynamic content comes here! */`;
  }

  //todo add injectItemRule
  //todo add injectContainerRule
  //todo should i bunch these calls in a requestAnimationFrame call?
  injectRule(shortName, short) {
    const res = this.styleEl.textContent;
    for (let rule of toCssText(shortName, short)) {
      const { item, specificity } = ShortStyleElement.analyzeRule(rule);
      if (item === "item") {
        for (let m; m = ShortStyleElement.ITEM.exec(res);)
          if (parseInt(m[0]) > specificity)
            return this.styleEl.textContent = res.slice(0, m.index) + rule + res.slice(m.index);
        if (m = ShortStyleElement.CONTAINER.exec(res))
          return this.styleEl.textContent = res.slice(0, m.index) + rule + res.slice(m.index);
      } else {
        for (let m; m = ShortStyleElement.CONTAINER.exec(res);)
          if (parseInt(m[0]) > specificity)
            return this.styleEl.textContent = res.slice(0, m.index) + rule + res.slice(m.index);
      }
      return this.styleEl.textContent = res + rule;
    }
  }

  static ITEM = /\/\*item (\d+)\*\//g;
  static CONTAINER = /\/\*container (\d+)\*\//g;
  static defaultCss = `
  * { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
    scroll-behavior: smooth;
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
  static analyzeRule(rule) {
    const [, item, specificity] = rule.match(/\/\*(item|container) (\d+)\*\//);
    return { item: item === "item", specificity: parseInt(specificity) };
  }
}