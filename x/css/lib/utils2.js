
//args is an array of objects, grabbers is an array of dictionaries.
//i can add a boundary for the number of arguments by for example adding 1 at the end of the array.
function grabArgumentsArray(grabbers, args) {
  const res = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const grabber = grabbers[i] ?? grabbers[0];
    if (grabber === 1)
      throw new SyntaxError("Too many arguments");
    const b = grabArgumentSingle(grabber, a);
    if (b === undefined)
      return;
    res.push(b);
  }
  return res;
}

//arg is an object, grabber is a dictionary
function grabArgumentSingle(grabber, a) {
  const key = Object.keys(a)[0];
  let g = grabber[key];
  if (g == null) //type mismatch, try another grabber
    return;
  const v = a[key];
  if (g instanceof Array && v instanceof Array)
    return grabArgumentsArray(g, v);
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
    for (const [key, funcs] of Object.entries(FUNCS)) {
      const args2 = grabArgumentsArray(funcs, topArg);
      if (args2 === undefined)
        continue;
      res[key] = args2;  //todo mark the function as used? used = new Set(); used.add(funcs)
      continue arg;
    }
  }
  return res;
}

export function doSequence2(FUNCS, topArgs) {
  const res = {};
  for (let i = 0; i < topArgs.length; i++) {
    const topArg = topArgs[i];
    if (!topArg) continue;
    const [prop, funcs] = FUNCS[i];
    const args2 = grabArgumentsArray(funcs, topArg);
    if (args2 !== undefined)
      res[prop] = args2;
  }
  return res;
}

export function postProcess(POST, res) {
  for (let key in res)
    if (key in POST)
      Object.assign(res, POST[key](res[key], key));
  for (let key in res)
    if (res[key] == null)
      delete res[key];
  return res;
}
/********
 * postProcessing reusables 
 *********/
export const single = ([a], prop) => ({ [prop]: a });

export function tailToVariables(args, prop) {
  const res = { [prop]: args[0] };
  for (let i = args.length - 1; i >= 1; i--)
    res[prop + "-" + i] = args[i];
  return res;
}

function splitIn4(keys, args, prop) {
  const [head, tail] = prop.split(/-(?=[^-]*$)/);
  const [bStart, iStart = bStart, bEnd = bStart, iEnd = iStart] = args;
  const res = { [prop]: undefined };
  res[`${head}-${keys[0]}-${tail}`] = bStart;
  res[`${head}-${keys[1]}-${tail}`] = iStart;
  res[`${head}-${keys[2]}-${tail}`] = bEnd;
  res[`${head}-${keys[3]}-${tail}`] = iEnd;
  return res;
}
export const logicalPairs = splitIn4.bind(null,
  ["block-start", "inline-start", "block-end", "inline-end"]);

export const tlbr = splitIn4.bind(null,
  ["top", "left", "bottom", "right"]);
