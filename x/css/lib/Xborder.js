import { PositiveLengthPercent, Word, Dictionary, LogicalFour } from "./Xfuncs2.js";

function BorderSwitch(func) {
  return function (exp) {
    const res = func(exp);  //style  and width are 5 char long
    return Object.fromEntries(Object.entries(res).map(([k, v]) => {
      const [wsr, ...dirs] = k.split("-");
      k = ["border", ...dirs, wsr].join("-");
      return [k, v];
    }));
  };
}

function LogicalEight(PROP_ALIASES, PositiveLengthPercent) {
  const [PROP] = PROP_ALIASES.split("|")[0];
  PROP_ALIASES = new RegExp(`^(${PROP_ALIASES})$`);
  return function ({ name, args }) {
    if (!args?.length || args.length > 8 || !name.match(PROP_ALIASES))
      return;

    let [bss, iss, bes, ies, bse, ise, bee, iee] = args.map(PositiveLengthPercent);
    if (args.length === 1) iss = bes = ies = bse = ise = bee = iee = bss;
    if (args.length === 2) ise = ies = iee = iss, bse = bes = bee = bss;
    if (args.length === 3) ise = ies = iee = iss, bse = bss, bee = bes;
    if (args.length === 4) ise = iss, iee = ies, bse = bss, bee = bes;
    if (args.length === 5) ise = iss, iee = ies, bee = bes;
    if (args.length === 6) iee = ies, bee = bes;
    if (args.length === 7) iee = ies;
    return {
      [PROP + "-top-start"]: bss,
      [PROP + "-top-end"]: bse,
      [PROP + "-bottom-start"]: bes,
      [PROP + "-bottom-end"]: bee,
      [PROP + "-start-start"]: iss,
      [PROP + "-end-start"]: ies,
      [PROP + "-start-end"]: ise,
      [PROP + "-end-end"]: iee,
    };
  };
}

export const border = Dictionary(  //border-colors controlled by $color
  BorderSwitch(LogicalFour("width|w", PositiveLengthPercent)),
  BorderSwitch(LogicalFour("style|s", Word("solid|dotted|dashed|double"))),
  BorderSwitch(LogicalFour("radius|r", PositiveLengthPercent)),
  BorderSwitch(LogicalEight("radius|r|logical-radius", PositiveLengthPercent))
);
