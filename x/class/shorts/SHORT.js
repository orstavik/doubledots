function prefixSuffix({ prefix, suffix }) {
  return !suffix ? prefix : `${prefix}-${suffix}`;
}

export function PrefixTable(dict) {
  const aliases = {}, counts = {}, calcs = {};
  for (let [type, [names, count, ...funcs]] of Object.entries(dict)) {
    for (let name of names.source.split("|")) //todo we assume no regex here.. that is wrong, we have it with the variable..
      aliases[name] = type;
    counts[type] = count;
    calcs[type] = funcs;
  }

  for (let [type, funcs] of Object.entries(calcs)) {
    if (!(funcs[0] instanceof Function))
      calcs[type].unshift(prefixSuffix);

    for (let i = 0; i < funcs.length; i++) {
      const calc = funcs[i];
      if (calc instanceof RegExp) {
        const CHECK = new RegExp(`^(${calc.source})$`);
        funcs[i] = function (word) {
          if (word.match(CHECK))
            return word;
          throw new SyntaxError(`Bad C$$  ${type}: ${word} ((is not "${calc.source}")).`);
        };
      }
    }
  }

  //todo the default values of colors and inheritance etc are not added yet.
  // color: /red|blue|green|rgb|hsl/,
  // inherit: /inherit/


  return function toTable(args) {
    const res = {};
    //1. group arguments under css prop type
    for (let arg of args) {
      const type = aliases[arg.prefix ?? ""] ?? arg.prefix ?? "";
      (res[type] ??= []).push(arg);
    }
    //2. check argument count
    for (let [type, args] in Object.entries(res))
      if (type in counts && args.length > counts[type])
        throw new SyntaxError("too many arguments for the given value type: " + type);
    //3. preprocess arguments according to calcs
    for (let type in res) {
      const funcs = calcs[type];
      res[type] = res[type].map(arg => funcs.reduce((acc, func) => func(acc), arg));
    }
    return res;
  };
}

export function calcNum(defaultValue, defaultType, { sign, num, suffix }) {
  if (suffix === "auto")
    throw new Error("implement this");
  if (sign)
    return `calc(${defaultValue + defaultType} ${sign} ${num + suffix})`;
  if (suffix)
    return num + suffix;
  return (defaultValue * num) + defaultType;
}

