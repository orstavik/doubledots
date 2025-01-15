import { PrefixTable, calcNum, trbl } from "./SHORT.js";

const calc = calcNum.bind(null, 1 / 3, "rem");

//$border_[5%,2px,3rem]_solid_r[5%]_vr[4%,2%]
//$border_[5%,2px,3rem]_[solid,dotted]_r[5%]_vr[4%,2%]
//$border_w[2px,3rem]_style[solid,dotted]

const borderStyle = /solid|dashed|dotted|double|groove|ridge|inset|outset|none/;

function lengthSlash(a) {
  if (a.expr == "/")
    return "/";
  // return length;
  return a;
};


const borderPrefix = PrefixTable(
  //1. turn the arguments into a vector of arguments.
  //2. then start to find the prefix, match.
  //1. then, try to convert all arguments. if one of the arguments fail, then try the next prefix match.
  {
    //ArgumentConverter / valueConverter
    "border-width": [/|w|width/, [calc], [trbl]],
    "border-style": [/|s|style/,
      [({ word }) => word, borderStyle],
      [trbl]
    ],
    "border-radius": [/r|radius|hr/, [calc], [/*trbl*/]], //todo change somehow //aSlashB
    //todo when we have an empty array, then we do the calc on the inner of that array?
    "border-collapse": [/collapse|separate/],
  }
);

function slashTrbl(dict, prop) {
  const args = dict[prop];
  if (!args?.length)
    return dict;
  //todo we don't change that this is a slash. we just change the values.
  const [head, tail] = prop.split(/-(?=[^-]*$)/);
  dict[`${head}-top-${tail}`] = args[0];
  dict[`${head}-right-${tail}`] = args[1] ?? args[0];
  dict[`${head}-bottom-${tail}`] = args[2] ?? args[0];
  dict[`${head}-left-${tail}`] = args[3] ?? args[1] ?? args[0];
  return dict;
}

//$border_r[[5%,2%],[5%,2%],[5%,2%],[5%,2%]]
//$border_r[[5%,2%,3%,4%],[5%,2%]]
//$border_r[5%,2%,3%]
//$border_r[5%,2%,3%,[6%,7%]]
//$border_r[5%,2%,3%,/,6%,7%]
//todo have a rule that says that the empty argument is a slash in the 
//border radius. if the first argument is empty, then we do vr. Or we do vr after the first empty argument?

export class Border {

  static parse(args) {
    const res = borderPrefix(args);
    debugger;
    if (res["border-collapse"]) {
      res["border-spacing"] = calc(res["border-collapse"]);
      res["border-collapse"] = res["border-collapse"].prefix;
    }
    return res;
  }
}