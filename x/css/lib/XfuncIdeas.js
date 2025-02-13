
function Dimension2(divider, name, cb) {
  return function dim2(exp) {
    if (typeof exp == "string")
      return cb(new Expression(name, exp.split(divider)));
  };
}

//size() is either inline/block/w/height/etc.
const BasicLength = Either(
  Word(/(min|max)(-content)?/, (m, c = "-content") => m + c),
  PositiveLengthPercent
);
const MinEdgeLength = Either(
  BasicLength,
  Dimension2(":", "max", BasicLength)
);
const MaxEdgeLength = Either(
  BasicLength,
  Dimension2(":", "max", BasicLength)  //the dime
);
function Size(DIR) {
  return Either(
    P("color", Color),

    ListOf(BasicLength),
    Dimension2("/", "clamp", MinEdgeLength, BasicLength, MaxEdgeLength)
  );
}
// function Size(DIR) {
//   return Either(
//     P(`${DIR}-size`, PositiveLengthPercent),
//     P(`${DIR}-size`, CssTextFunction("fit-content", ListOf("fit|fit-content", PositiveLengthPercent))),
//     P(`${DIR}-size`, CssTextFunction("clamp", ListOf("clamp", PositiveLengthPercent))),
//     P(`min-${DIR}-size`, ListOf("min", PositiveLengthPercent)),
//     P(`max-${DIR}-size`, ListOf("max", PositiveLengthPercent))
//   );
// }

