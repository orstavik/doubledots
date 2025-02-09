function MaxArgs(max, cb) {
  return function (name, args) {
    if (!args.length || args.length > max)
      throw new SyntaxError(`Must have one argument for ${name}`);
    if (args.length > max)
      throw new SyntaxError(`Too many arguments for ${name}`);
    return cb(name, args);
  };
}

export function align(p, args) {
  if (args.length > 2 || !args.length)
    throw new SyntaxError("align needs 1 or 2 arguments: (block, inline)");
  return { placeContent: args.join(" ") };
};

export function gap(name, args) {
  if (args.length > 2 || !args.length)
    throw new SyntaxError("Invalid gap arguments");
  return { gap: args.join(" ") };
}

export function LogicalFour(PROP, ArgHandler) {
  return function (exp) {
    let [bs, is, be, ie] = exp.args.map(ArgHandler);
    if (args.length === 1 && bs)
      return { [PROP]: bs };
    else if (args.length === 2 && bs && is)
      return {
        [PROP]: `${bs} ${is}`,
        [PROP + "-block"]: bs,
        [PROP + "-inline"]: is
      };
    if (args.length === 3 && bs && is && be)
      return {
        [PROP]: `${bs} ${is} ${be}`,
        [PROP + "-block"]: `${bs} ${be}`,
        [PROP + "-inline"]: is
      };
    if (args.length === 4 && bs && is && be && ie)
      return {
        [PROP]: `${bs} ${ie} ${be} ${is}`,
        [PROP + "-block"]: `${bs} ${be}`,
        [PROP + "-inline"]: `${is} ${ie}`
      };
    return {
      [PROP + "-top"]: bs,
      [PROP + "-right"]: ie,
      [PROP + "-bottom"]: be,
      [PROP + "-left"]: is,

      [PROP + "-block-start"]: bs,
      [PROP + "-block-end"]: be,
      [PROP + "-inline-start"]: is,
      [PROP + "-inline-end"]: ie
    };
  };
}

export function flex(name, args) {
  const res = { display: "flex" };
  if (args.includes("column"))
    res.flexDirection = "column";
  if (args.includes("reverse"))
    res.flexDirection = (res.flexDirection || "row") + "-reverse";
  const snapType = args.find(a => a.match?.(/(block|inline|both)-mandatory/));
  if (snapType)
    res.scrollSnapType = snapType.replace("-", " ");
  Object.assign(res, ...args.filter(a => a instanceof Object));
  return res;
}

export function _flex(name, args) {
  const res = {};
  Object.assign(res, ...args.filter(a => a instanceof Object));
  if (args.includes("safe"))
    res.alignSelf = "safe " + res.alignSelf;
  return res;


  const todo = {
    "flex-grow": [uno, { word: w => w.match(/^grow(\d+(?:\.\d+)?)$/)?.[1] }],
    "flex-shrink": [uno, { word: w => w.match(/^shrink(\d+(?:\.\d+)?)$/)?.[1] }],
    "order": [uno, { order: [uno, INT] }],
    "flex-basis": [uno, { basis: [uno, WIDTH] }],
  };
}

export function flexItemAlign(name, args) {
  if (args.length !== 1)
    throw new SyntaxError("Must have one argument");
  return { placeSelf: args[0] };
}


//todo there is no logical version for overflowX and overflowY
export function wrap(name, args) {
  if (args.length > 2 || !args.length)
    throw new SyntaxError("wrap needs 1 or 2 arguments: (block, inline)");
  const [block, inline] = args;
  const res =
    ["ellipsis", "clip"].includes(block) ? {
      overflowY: "hidden",
      textOverflow: block,
      whiteSpace: "nowrap"
    } :
      block ? { overflowY: block } :
        {};
  if (inline)
    res.overflowX = inline;
  return res;
}

export function flexWrap(name, args) {
  const res = wrap(name, args);
  if (["wrap", "wrap-reverse"].includes(args[1])) {
    res.flexWrap = args[1];
    delete res.overflowX;
  }
  return res;
}

export function snapType(name, args) {
  return { snapType: args[0].replace("-", " ") };
}

export function border(name, args) {

}