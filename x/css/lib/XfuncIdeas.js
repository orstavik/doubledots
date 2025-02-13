//min(x) => clamp(x,,)
//max(x) => clamp(,,x)
//fit|fit-content(x) => clamp(min-content, x, max-content)
//clamp => clamp(,,x)
function MinNormalMax(PROP, cb) {
  const MIN = "min-" + PROP, MAX = "max-" + PROP;
  return function mnm(exp) {
    const { name, args } = exp;
    if (name === "min" && args.length === 1)
      return { [MIN]: cb(args[0]) };
    if (name === "max" && args.length === 1)
      return { [MAX]: cb(args[0]) };
    if ((name === "fit" || name === "fit-content") && args.length === 1)
      return { [MIN]: "min-content", [PROP]: cb(args[0]), [MAX]: "max-content" };
    if (name === "clamp" && args.length === 3)
      return { [MIN]: cb(args[0]), [PROP]: cb(args[1]), [MAX]: cb(args[2]) };
    return { [PROP]: cb(exp) };
  };
}

export const size = Merge(ListOf(null,
  MinNormalMax("block-size", PositiveLengthPercent),
  MinNormalMax("inline-size", PositiveLengthPercent)
));