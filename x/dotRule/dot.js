const scopes = {
  ".": "this.",
  "e.": "window.eventLoop.event.",
  "t.": "window.eventLoop.event.target.",
  "w.": "window.",
  "d.": "window.document.",

  "i.": "args[0].",
  "i0.": "args[0].",
  "i1.": "args[1].",
  "i2.": "args[2].",
  "i3.": "args[3].",
  "i4.": "args[4].",
  "i5.": "args[5].",
  "i6.": "args[6].",
  "i7.": "args[7].",
  "i8.": "args[8].",
  "i9.": "args[9].",
  "i10.": "args[10].",
  "i11.": "args[11].",
  "i12.": "args[12].",
  "i13.": "args[13].",
  "i14.": "args[14].",
  "i15.": "args[15].",
  "args": "args",

  "oi.": "args[0].",
  "at.": "window.eventLoop.attribute.", //useful when dash rules have moved the origin. dash rules break lob.. used in gestures?
  "el.": "window.eventLoop.attribute.ownerElement.", //todo same as this.ownerElement??
  "this.": "this.",
  "window.": "window.",
  "document.": "document."
};

//todo must rename oi to i, because of the change of structures.
function processRef(prop) {
  for (let prefix in scopes)
    if (prop.startsWith(prefix))
      return DoubleDots.kebabToPascal(scopes[prefix] + prop.slice(prefix.length));
}

const primitives =
  /^((-?\d+(\.\d+)?([eE][-+]?\d+)?)|this|window|document|i|e|true|false|undefined|null)$/;

function textToExp(txt) {
  let [prop, ...args] = txt.split("_");
  const ref = processRef(prop).replaceAll(".", "?.");
  args = args.map(arg => processRef(arg) || primitives.test(arg) ? arg : `"${arg}"`);
  const sargs = args.join(", ");
  const setter = !args.length ? "" : args.length === 1 ? `=${sargs}` : `=[${sargs}]`;
  return `(${ref} instanceof Function ? ${ref}(${sargs}) : (${ref}${setter}))`;
}

function DotReactionRule(fullname) {
  const exp = textToExp(fullname);
  const code = `function dotReaction(...args) { return ${exp}; }`;
  return DoubleDots.importBasedEval(code);
}

//basic filters
function BreakOnFalseReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `function dotReaction(oi) { return ${exp} || EventLoop.break; }`;
  return DoubleDots.importBasedEval(code);
}

function BreakOnTrueReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `function dotReaction(oi) { return ${exp} && EventLoop.break; }`;
  return DoubleDots.importBasedEval(code);
}

const dynamicDots = {};
for (let prefix in scopes)
  dynamicDots[prefix] = DotReactionRule;
dynamicDots["x."] = BreakOnFalseReactionRule;
dynamicDots["y."] = BreakOnTrueReactionRule;

export { dynamicDots as dynamicsDots };