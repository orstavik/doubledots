import { LENGTH_PERCENT_POS } from "./utils.js";

//args is an array of objects, grabbers is an array of dictionaries.
function grabArgumentsArray([resolver, ...grabbers], args, key) {
  const res = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const grabber = grabbers[i] ?? grabbers[0];
    const b = grabArgumentSingle(grabber, a);
    if (b === undefined)
      return;
    res.push(b);
  }
  return resolver(res, key);
}

//arg is an object, grabber is a dictionary
function grabArgumentSingle(grabber, a) {
  const key = Object.keys(a)[0];
  let g = grabber[key];
  if (g == null) //type mismatch, try another grabber
    return;
  const v = a[key];
  if (g instanceof Array && v instanceof Array)
    return grabArgumentsArray(g, v, key);
  if (g instanceof Array || v instanceof Array)
    throw new SyntaxError("Type mismatch");
  if (g instanceof RegExp)
    return a[key]?.match?.(new RegExp(`^(${g.source})$`))?.[0];
  if (g instanceof Function)
    return g(a[key], key);
  throw new SyntaxError("Invalid grabber type description");
}

export function doPrefix(FUNCS, topArgs) {
  const res = {};
  arg: for (let topArg of topArgs) {
    if (!topArg) continue; //throw new SyntaxError("Empty argument for prefix-based $short.");
    //todo mark the function as used? used = new Set(); used.add(funcs)
    for (const [prop, funcs] of Object.entries(FUNCS)) {
      const res2 = grabArgumentsArray(funcs, topArg, prop); //todo try/catch
      if (res2 == undefined)
        continue;
      typeof res2 === "object" ? Object.assign(res, res2) :
        res[prop] = res2;
      continue arg;
    }
    //throw new SyntaxError("Unused argument for prefix-based $short.");
  }
  return res;
}

export function doSequence2(FUNCS, topArgs) {
  const res = {};
  for (let i = 0; i < topArgs.length; i++) {
    const topArg = topArgs[i], [prop, funcs] = FUNCS[i];
    if (!topArg) {
      res[prop] = "";
    } else {
      const res2 = grabArgumentsArray(funcs, topArg, prop); //todo try/catch
      typeof res2 === "object" ? Object.assign(res, res2) :
        res[prop] = res2;
    }
  }
  return res;
}

/********
 * postProcessing reusables 
 *********/
export const uno = args => args.length === 1 ? args[0] : undefined;

export function minNormalMax(res, prefix, min = `min-${prefix}`, max = `max-${prefix}`) {
  const dict = {};
  if (res.one) dict["three" in res ? min : prefix] = res.one;
  if (res.two) dict["three" in res ? prefix : max] = res.two;
  if (res.three) dict[max] = res.three;
  return dict;
}

export function tailToVariables(args, prop) {
  // if(!args)return
  const res = { [prop]: args[0] };
  for (let i = args.length - 1; i >= 1; i--)
    res[prop + "-" + i] = args[i];
  return res;
}

/*
 * create function for splitting list of 1-4 values into logicalProps:
 * scroll-margin => scroll-margin-block / -inline
 * border-width => border-block-width / -inline
 */
export function logicalFour(args, p) {
  if (args.length > 4)
    throw new SyntaxError("Too many arguments");
  const [bs, is = bs, be, ie] = args;
  return {
    [p]: undefined,
    [p.replace(/(^border|$)/, "$1-block")]: be == null ? bs : `${bs} ${be}`,
    [p.replace(/(^border|$)/, "$1-inline")]: ie == null ? is : `${is} ${ie}`
  };
}

//WIDTH
function fitContent(args) {
  if (args.length === 1)
    return `fit-content(${args[0]})`;
}
export const WIDTH = {
  ...LENGTH_PERCENT_POS,
  word: /min-content|max-content/,
  fit: [fitContent, LENGTH_PERCENT_POS],
  //expr: //relative expression.
};
