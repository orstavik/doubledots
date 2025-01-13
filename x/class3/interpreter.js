import { border, _border } from "./shorts/Border.js";
// import { color, _color } from "./shorts/Color.js";
// import { Palette } from "./shorts/Palette.js";
// import { Flex } from "./shorts/Flex.js";

import { parse$Expression, parse$SuperShorts, toCssText } from "./parser.js";

function spaceJoin(dict) {
  for (let prop in dict)
    if (dict[prop] instanceof Array)
      dict[prop] = dict[prop].join(" ");
  return dict;
}

class ShortsResolver {
  constructor(funcs) {
    this.functions = funcs.slice().sort((a, b) => b.name.length - a.name.length);
    this.superShorts = {};
  }

  addSuperShorts(shortTxt) {
    const parsed = parse$SuperShorts(shortTxt);
    for (let [k, v] of Object.entries(parsed))
      this.superShorts[k] = interpret$Expression(v, this);
  }

  interpret(res, selector, { name, camel, args }, item) {
    if (!item)
      if (name in this.superShorts)
        for (let key in this.superShorts[name])
          res[key] = Object.assign(res[key] || {}, this.superShorts[name][key]);
    const func = this.functions.find(func => camel.startsWith(func.name));
    if (!func)
      throw new SyntaxError(`The $short "${name}" with lookup "${camel}" doesn't match any $short function.`);
    res[selector] = spaceJoin(func(res[selector] ?? {}, args));
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

// Color, Palette, Flex], shortTxt);
const shorts = new ShortsResolver([border, _border]);

function init(shortTxt) {
  shorts.addSuperShorts(shortTxt);
}

function add$Classes(classList, shortsToCss) {
  let tmp;
  for (let txt of classList)
    if (!(txt in shortsToCss))
      if (tmp = parse$Expression(txt))
        if (tmp = interpret$Expression(tmp, shorts))
          if (tmp = toCssText(txt, tmp))
            shortsToCss[txt] = `/*\n${txt}\n*/\n${tmp}`;
}

const defaultCss = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
:not(html) {
  /*COLOR INHERITANCE  (don't use native css shorthands: border, text-decoration)*/
  border-color: inherit;
  border-top-color: inherit;
  border-right-color: inherit;
  border-bottom-color: inherit;
  border-left-color: inherit;
  text-decoration-color: inherit;
}  
`;

export function run(style) {
  init(style.getAttribute("css-shorts"));
  const shortsToCss = {}; //this should be a global variable??
  for (let el of document.querySelectorAll('[class*="$"]'))
    add$Classes(el.classList, shortsToCss);
  style.discovered = shortsToCss;
  style.textContent += defaultCss + Object.values(shortsToCss).join("\n\n");
}


//1. $border-one=border_[2px,4px]_dashed
//2. $border-one_solid
//=>
//run separately, and then assign custom over existing.
//   Object.assign( $border_[2px,4px]_dashed , $border_solid )
//so what with the children? would the child selector overwrite the entire previous child selector? or would the previous child selectors remain? So, here, we would assign the childSelectorCss over the shortshort default childSelectorCss.

//alt. run as a single unit. merge the $short texts.
//   $border_[2px,4px]_dashed_solid_dashed_dashed_overflow
//but this is problematic.. what when the sequence of the arguments matter? what if the presence of one argument influence the interpretation of another argument? how to adjust for that?

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