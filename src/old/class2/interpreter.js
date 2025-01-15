import { Color } from "./shorts/Color.js";
import { Border } from "./shorts/Border.js";
import { Palette } from "./shorts/Palette.js";
import { Flex } from "./shorts/Flex.js";

import { parse$Expression } from "./parser.js";

function spaceJoin(dict) {
  for (let prop in dict)
    if (dict[prop] instanceof Array)
      dict[prop] = dict[prop].join(" ");
  return dict;
}

function interpret$short(short, rules) {
  const { name, args, childArgs } = short;
  const Type = rules[name];
  if (!Type)
    throw new SyntaxError(`$short named "${name}" is unknown.`);

  const css = spaceJoin(Type.parse(args));
  const childCss = {};
  for (let { select, args } of childArgs)
    childCss[select] = spaceJoin(Type.parseChild(args));
  return { name, css, childCss, Type };
}

function interpret$Expression(txt, rules) {
  try {
    const expr = parse$Expression(txt);
    expr.shorts = expr.shorts.map(short => interpret$short(short, rules));
    return expr;
  } catch (err) {
    return console.error(`C$$ short didn't manage to interpret expression with $: ${txt}.`);
  }
}

function interpret$ShortShort(txt, rules) {
  //todo verify that the interpretExpression only returns 1 $short (with no select?).
  const expr = interpret$Expression(txt, rules);
  const { name, css, childCss, Type } = expr.shorts[0];
  return { name, css, childCss, parse: Type.parse, parseChild: Type.parseChild };
}

class Shorts {
  constructor(classes, shortTxt) {
    this.shorts = {};
    for (let cls of classes)
      this.shorts[cls.name.replace(/(?<!^)[A-Z]/g, "-$&").toLowerCase()] = cls;
    for (let [, name, value] of shortTxt.matchAll(/\$([a-z0-9-]+)\=([^\s]*)/g))
      (this.shorts[name] = interpret$ShortShort("$" + value, this.shorts)).name = name;
  }
}

function toCssText({ shorts, select: { name: selector } }) {
  const resultRules = { [selector]: [] };
  const main = resultRules[selector];
  for (let { css, childCss, Type } of shorts) {
    main.push(`\n  /**${Type.name}**/`);
    main.push(...Object.entries(css).map(([k, v]) => `\n  ${k}: ${v};`));
    for (let [select, css] of Object.entries(childCss)) {
      const body = resultRules[selector + " > " + select] ??= [];
      body.push(...Object.entries(css).map(([k, v]) => `\n  ${k}: ${v};`));
    }
  }
  return Object.entries(resultRules).map(([s, b]) => `\n\n${s} {${b.join("")}\n}`).join("");
}

export function init(styleEl, shortTxt) {
  styleEl.shorts = new Shorts([Color, Border, Palette, Flex], shortTxt);
}

export function interpret(classList, styleEl) {
  const newRules = styleEl.shortRules = {};
  let val;
  for (let txt of classList)
    if (txt.includes("$"))
      if (val = interpret$Expression(txt, styleEl.shorts.shorts)) {
        newRules[val.expression] = val;
        styleEl.textContent += toCssText(val);
      }

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

how to run the list of shorts:
1. run list in reverse, get the value object for the name or {} and then assign those. This becomes the start object.
2. Then run the list forward. If there are arguments, then get the function for the name and run the argument inside that function, using the object as the basis.
*/