const scopes = {
  ".": "this.",
  "e.": "window.eventLoop.event.",
  "t.": "window.eventLoop.event.target.",
  "w.": "window.",
  "d.": "window.document.",
  "oi.": "oi.",  //the input argument
  "at.": "window.eventLoop.attribute.",
  "el.": "window.eventLoop.attribute.ownerElement.",
  "this.": "this.",
  "window.": "window.",
  "document.": "document."
};

function processRef(prop) {
  for (let prefix in scopes)
    if (prop.startsWith(prefix))
      return DoubleDots.kebabToPascal(scopes[prefix] + prop.slice(prefix.length));
}

const primitives =
  /^((-?\d+(\.\d+)?([eE][-+]?\d+)?)|this|window|document|i|e|true|false|undefined|null)$/;

function textToExp(txt) {
  let [prop, ...args] = txt.split("_");
  const ref = processRef(prop);
  args = args.map(arg => processRef(arg) || primitives.test(arg) ? arg : `"${arg}"`);
  const sargs = args.join(", ");
  const setter = !args.length ? "" : args.length === 1 ? `=${sargs}` : `=[${sargs}]`;
  return `(${ref} instanceof Function ? ${ref}() : (${ref}${setter}))`;
}

function DotReactionRule(fullname) {
  const exp = textToExp(fullname);
  const code = `function dotReaction(oi) { return ${exp}; }`;
  return DoubleDots.importBasedEval(code);
}

for (let prefix in scopes)
  document.Reactions.defineRule(prefix, DotReactionRule);

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
document.Reactions.defineRule("x.", BreakOnFalseReactionRule);
document.Reactions.defineRule("y.", BreakOnTrueReactionRule);