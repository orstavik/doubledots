//todo the default values of colors and inheritance etc are not added yet.
// color: /red|blue|green|rgb|hsl/,
// inherit: /inherit/

function prepArgsCalcs(calc, type) {
  if (calc instanceof Function)
    return calc;
  if (calc instanceof RegExp) {
    const CHECK = new RegExp(`^(${calc.source})$`);
    return function (word) {
      if (word.match(CHECK))
        return word;
      throw new SyntaxError(`Bad C$$  ${type}: ${word} ((is not "${calc.source}")).`);
    };
  }
  throw new SyntaxError("Bad C$$ calc: " + calc);
}

function processTopArg(dict, { prefix, args }) {
  for (let [type, [matcher, funcs = [], dictFuncs = []]] of Object.entries(dict)) {
    try {
      if (prefix.match(new RegExp(`^(${matcher.source})$`))) {
        args = args.map(arg => funcs.reduce((acc, func) => func(acc, type), arg));
        return dictFuncs.reduce((acc, func) => func(acc, type), { [type]: args });
      }
    } catch (err) {
    }
  }
  throw new SyntaxError("bad argument: " + topArgs.join(" "));
}

export function PrefixTable(dict, css = {}) {
  for (let type in dict)
    dict[type][1] &&= dict[type][1].map(c => prepArgsCalcs(c, type));
  const topFunc = processTopArg.bind(null, dict);
  return args => Object.assign(css, ...args.map(topFunc));
}

export function calcNum(defaultValue, defaultType, { N, n, num, unit, expr }) {
  if (!N && !expr)
    throw new SyntaxError("not a number value");
  if (unit === "auto")
    throw new Error("implement this");
  if (expr?.endsWith(/[-+/*]/))
    return `calc(${expr} ${defaultValue + defaultType})`;
  if (expr?.startsWith(/[-+/*]/))
    return `calc(${defaultValue + defaultType} ${expr})`;
  if (unit)
    return n + unit;
  return defaultValue * n + defaultType;
}

export function trbl(dict, prop) {
  const args = dict[prop];
  if (!args?.length)
    return dict;
  const [head, tail] = prop.split(/-(?=[^-]*$)/);
  dict[`${head}-top-${tail}`] = args[0];
  dict[`${head}-right-${tail}`] = args[1] ?? args[0];
  dict[`${head}-bottom-${tail}`] = args[2] ?? args[0];
  dict[`${head}-left-${tail}`] = args[3] ?? args[1] ?? args[0];
  return dict;
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