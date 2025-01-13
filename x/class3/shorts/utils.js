//todo the default values of colors and inheritance etc are not added yet.
// color: /red|blue|green|rgb|hsl/,
// inherit: /inherit/

export const spaceJoin = (a) => a.join(" ");

export class PrefixTable {
  constructor(dict) {
    for (let [type, [matcher, func, func2]] of Object.entries(dict)) {
      matcher = new RegExp(`^(${matcher.source})$`);
      if (func instanceof RegExp) {
        const CHECK = new RegExp(`^(${func.source})$`);
        func = word => (word.match?.(CHECK) ? word : undefined);
      }
      dict[type] = { matcher, func, func2 };
    }
    this.dict = Object.entries(dict);
  }

  #processTop(args, func) {
    args = args.slice();
    for (let i = 0; i < args.length; i++)
      if ((args[i] = func(args[i])) === undefined)
        return;
    return args;
  }

  argsToDict(topArgs) {
    const res = {};
    top: for (let { prefix, args } of topArgs) {
      type: for (let [type, { matcher, func, func2 }] of this.dict)
        if (prefix.match(matcher)) {
          const a = this.#processTop(args, func);
          if (a === undefined)
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
}