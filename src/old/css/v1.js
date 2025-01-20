function* sameCssAttr(trigger, root) {
  for (let el of root.querySelectorAll(`[${trigger}\\:]`))
    yield el.getAttributeNode(trigger + ":");
  for (let temp of root.querySelectorAll("template"))
    yield* sameCssAttr(trigger, temp.content);
}

//PARSER
function parse(name) {
  const [type, ...args] = name.split("_");
  if (type === "color") {
    const [color, backgroundColor, borderColor] = args;
    return { [name]: { color, backgroundColor, borderColor } };
  }
  return {};
}

//INTERPRET
function interpretSelector(name){
  return ["hover", "valid", "invalid"].includes(name)? ":" + name : name;
}

function updateStyleSheet(name, values, selectors) {
  const selector = selectors?.map(interpretSelector).join("") ?? "";

  const style = document.querySelector("style#" + name) ?? (document.head.insertAdjacentHTML("beforeend", `<style id="${name}"></style>`), document.head.lastElementChild);

  let txt = ""
  for (let rule in values) {
    const body = Object.entries(values[rule]).map(([k,v])=>{
      k = DoubleDots.pascalToKebab(k);
      // const a = `  --${k}: unset;`;
      return `  ${k}: var(--${k}, ${v});`
    }).join("\n");
    txt += `.${name+rule}${selector} {\n${body}\n}\n\n`;
  }
  style.textContent = txt;
}

//todo grid
//todo --color, --background-color, --border-color overrides
export class Css extends AttrCustom {
  upgrade() {
    let [_, ...selectors] = this.trigger.split("_");
    const attrs = [this, ...sameCssAttr(this.trigger, this.ownerElement)].filter(at => at.value);

    const parsed = attrs.reduce((acc, at) => Object.assign(acc, parse(at.value)), {});
    updateStyleSheet(this.trigger, parsed, selectors);

    for (let at of attrs) {
      at.ownerElement.classList.add(this.trigger+at.value);
      at.ownerElement.removeAttribute(at.name);
    }
  }
}

export function Css_(rule) { return Css; }

const seletorsStrings = ["hover", "valid", "invalid", ""];
const selector = new RegExp(seletorsStrings.join("|"));

const valueGroups = {
  color: {
    red:1,
    pink:1,
    purple:1,
    "deep-purple":1,
    indigo:1,
    blue:1,
    "light-blue":1,
    cyan:1,
    teal:1,
    green:1,
    "light-green":1,
    lime:1,
    yellow:1,
    amber:1,
    orange:1,
    "deep-orange":1,
    brown:1,
    gray:1,
    "blue-gray":1,

    hex: 1,
    rgb: 1,
    hsl: 1,
    color: 1,

    lighten:1,
    darken:1,
    contrast:1,
  },
  font: {
    serif: 1,
    "sans-serif": 1,
    monospace: 1,
    fantasy: 1,
    cursive: 1,
    "system-ui": 1,
    system: "system-ui",
    sans: "sans-serif",
    times: "Times New Roman, serif",
    georgia: "Georgia, serif",
    arial: "Arial, sans-serif",
    helvetica: "Helvetica, sans-serif",
    verdana: "Verdana, sans-serif",
    tahoma: "Tahoma, sans-serif",
    courier: "Courier New, monospace",
    consolas: "Consolas, monospace",
    lucida: "Lucida Console, monospace",
    impact: "Impact, fantasy",
    comic: "Comic Sans MS, cursive",
  
  
    "word-spacing": 1,
    weight: 1, //inheritable bold
    
    //todo don't know the details for wrapping/white-space.
    //todo I think it should just be a series of self explanatory names.
  
    
    "white-space-normal": 1,
    nowrap: 1,
    pre: 1,
    "pre-wrap": 1,
    "pre-line": 1,
    "break-spaces": 1,
    collapse: 1,
    preserve: 1,
    "preserve-breaks": 1,
    "preserve-spaces": 1,
    "break-spaces": 1,
    "white-space-balance": 1,
  }
}

const colors = [];

const hex = /hex-(\d{3}|\d{6})/;    //hex, rgb, hsl are directions, for a range!
const rgb = /rgb-(\d{1,3}-\d{1,3}-\d{1,3})/;
const hsl = /hsl-(\d{1,3}-\d{1,3}-\d{1,3})/;
const colorNum = /color\d+/
const colorCore = new RegExp(`(${colors.join("|")}|${hex}|${rgb}|${hsl}|${colorNum})`);
const colorName = new RegExp(`${colorCore}(-(\d{2}))?`);

//css type as css variable  
const possibleWords = ["margin", "padding", "shadow", "bg", "linear", "radial", "image"];
const word = new RegExp(`-(${possibleWords.join("|")})[0-9]*`);

const fonts = {

};

const layouts = {  //most are rem?
  block: 1,
  inline: 1,
  "inline-block": 1,
  grid: 1,
  flex: 1,
  absolute: 1,  //px?
  fixed: 1, //vw? vh?
  sticky: 1,
  overflow:1,
  hidden:1,
  scroll:1, 

    clip:1,
  ellipsis: 1,
  cliptext: 1,
  iblock: "inline-block",
  columns: "grid",
  rows: "grid",
  abs: "absolute",

  relative: 0,      //should not be implemented.
//not implemented
  static: 0,
  "inline-flex": 0,
  "inline-grid": 0,
  table: 0,
  "inline-table": 0,
  "table-row": 0,
  "table-cell": 0,
  contents: 0,
};

const shorthands = {
  margin: 1,
  padding: 1,
  border: 1,
  background: 1,
  "font-size": 1,
  em: "font-size",
  m: "margin",
  p: "padding",
  bg: "background",
};

const innerLayout = {
  valign: "vertical-align",
  halign: "horizontal-align",
  "vertical-align": 1,
  "horizontal-align": 1,
  
};





const text = {
  align: 1,
  left: 1,
  right: 1,
  center: 1,
  justify: 1,
  start: 1,
  end: 1,
  italic: 1,
  oblique: 1,
  bold: 1,
  "small-caps": 1,
  "lowercase": "small-caps",

  "underline": 1,
  "overline": 1,
  "line-through": 1,
  "capitalize": 1,
  "uppercase": 1,
  "lowercase": 1,

  "normal": 0,
  "bolder": 0,
  "lighter": 0,
  "xx-small": 0,
  "x-small": 0,
  "small": 0,
  "medium": 0,
  "large": 0,
  "x-large": 0,
  "xx-large": 0,
  "larger": 0,
  "smaller": 0,
};

const fontWords = new RegExp(Object.keys(fonts).join("|"));
const layoutWords = new RegExp(Object.keys(layouts).join("|"));
const shorthandWords = new RegExp(Object.keys(shorthands).join("|"));


const direction = /(x|y|w|h|round|tlrb]*|)/;
const digit = /([0-9]+)/;
const type = /(px|%|vh|vw|rem|em|ex|ch|cm|mm|in|pt|pc|)/;
const number = new RegExp(`${direction.source}?${digit.source}${type}?`);
const minmax = new RegExp(`${direction.source}?${digit.source}${type}?\-${digit.source}${type}?`);

const valueTypeStart = {
  empty: colorName, 
  //only color can have an empty first argument? or can we also have this with layout?
  palette: colorName,
  font: fontWords,
  command: commandWords
}

//arial_condensed7_pre_weight700

//font_arial_300px_...
//arial_300px_...

//color_red30_blue15
//red30_blue15

//layout_sticky_10_15
//sticky_10_15

//t12px => t for top 12 px
//bold400 => bold 400 weight
//purple600 => purple darkness 600
//arial400 => arial weight 400
//oblique-15 => italic slant -15deg

//abs12-20 => absolute position 12 left 20 top
//abs-60--200 => absolute position 60 right 200 bottom
//abs0-0-60px-200em => absolute position 60 right 200 bottom
//abs_l12px_t20px

//PROP
//-shadow1 => shadow: var(--shadow1);

//
//VAR_WORD = /-[a-z][a-z-]*/    
//WORD = /[a-z][a-z-]*/
//TYPE = /|px|perc|vh|vw|rem|em|ex|ch|cm|mm|in|pt|pc|deg/;
//NUM = /\-?[0-9]+(type)?/  => -001px 23 1ch 0 -0rem => -0.01px 23 1ch 0 0rem
//VAR = /-[a-z][a-z0-9-]*/
//ARG = /NUM|VAR/
//ARGS = /ARG(-ARG)*/ => -001--001px-2rem => [-0.01,-0.01px,2rem]
//ATOM = /WORD(ARGS)?/
//PROP = /VAR_WORD[0-9]+/
//UNIT = /ATOM|PROP/
//VALUE_GROUP = /UNIT(_UNIT)*/

//

//the parser returns three rules: parent, current, child. if void, then nothing.

//if the first word is
//color: palette,

//palette is if it starts with a color, then we split("_") to get the multiple colors.
// function palette(atom){
//   const segs = atom.split("_");
//   const selectors = [];
//   while (segs[0].match(selector))
//   selectors.push(segs.shift());
//   const values = [];
//   //if all the segs match colorname or blank
//   while (!segs[0])    
//     values.push(segs.shift());
//   if(segs[0].match(colorName)){

//     values.push(//ensure all the 

//   }
//   for (let firstSegment) 
    
// }
