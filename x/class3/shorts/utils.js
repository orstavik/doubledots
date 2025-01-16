//todo the default values of colors and inheritance etc are not added yet.
// color: /red|blue|green|rgb|hsl/,
// inherit: /inherit/

export const spaceJoin = (a) => a.join(" ");

function twoIsThree(a, b, c) {
  return b == c || undefined;
}

function funcOutRegex(func) {
  return func instanceof RegExp ?
    str => str?.match?.(func)?.[0] == str ? str : undefined :
    func;
}
function processTop(args, func) {
  args = args.slice();
  for (let i = 0; i < args.length; i++)
    if ((args[i] = func(args[i])) == null)
      return;
  return args;
}

export class PrefixTable {
  #rules;
  constructor(dict) {
    this.#rules = Object.entries(dict).map(([type, [matcher, func, func2]], i) => [
      type,
      funcOutRegex(matcher ?? twoIsThree),
      funcOutRegex(func),
      func2,
      i
    ]);
  }

  argsToDict(topArgs) {
    const res = {};
    top: for (let [i, { prefix, args }] of topArgs.entries()) {
      type: for (let [type, matcher, func, func2, j] of this.#rules)
        if (matcher(prefix, i, j) != undefined) {
          const a = processTop(args, func);
          if (a == null)
            continue type;
          res[type] = func2?.(a) ?? a;
          continue top;
        }
    }
    return res;
  }
}

export function calcNum(defaultValue, defaultType, arg) {
  let { N, n, /*fraction, frac,*/ num, unit, expr } = arg;
  if (!N && !expr)
    throw new SyntaxError("not a number value");
  if (unit === "auto")
    throw new Error("implement this");
  // debugger
  // if(frac && !unit)
  //   return `calc(${expr} ${defaultValue + defaultType})`;
  if (expr?.endsWith(/[-+/*]/))
    return `calc(${expr} ${defaultValue + defaultType})`;
  if (expr?.startsWith(/[-+/*]/))
    return `calc(${defaultValue + defaultType} ${expr})`;
  if (unit)
    return n + unit;
  return defaultValue * n + defaultType;
}

export function normalizeArray4(ar) {
  if (ar.length > 4 || !ar.length)
    throw new SyntaxError("Array must have 1-4 items: " + ar);
  return ar.length == 3 ? (ar.push(ar[1]), ar) :
    ar.length == 2 ? (ar.push(...ar), ar) :
      ar.length == 1 ? [ar[0], ar[0], ar[0], ar[0]] :
        ar; /*ar.length == 4*/
}

export function trbl(dict, prop) {
  const args = dict[prop];
  if (!args)
    return;
  const [head, tail] = prop.split(/-(?=[^-]*$)/);
  dict[`${head}-top-${tail}`] = args[0];
  dict[`${head}-right-${tail}`] = args[1];
  dict[`${head}-bottom-${tail}`] = args[2];
  dict[`${head}-left-${tail}`] = args[3];
  delete dict[prop];
}

export function tailToVariables(dict, prop) {
  const args = dict[prop];
  if (!args?.length)
    return dict;
  while (args.length > 1)
    dict[prop + "-" + args.length] = args.pop();
  dict[prop] = args[0];
  return dict;
}

export function tryVariableFirst(val, prop) {
  return `var(--${prop},${val})`;
}

export function isOnlyOne(args) {
  if (args.length > 1)
    throw new SyntaxError("too many arguments");
  return args[0];
}