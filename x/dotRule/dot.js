const scopes = {
  ".": "this.",
  "e.": "window.eventLoop.event.",
  "t.": "window.eventLoop.event.target.",
  "w.": "window.",
  "d.": "window.document.",
  // "i.": "args[0].",  //todo implement this instead of .oi
  // "i(0-9)+": "args[$1].",//todo implement this instead of .oi
  "oi.": "oi.",
  "at.": "window.eventLoop.attribute.", //useful when dash rules have moved the origin
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
  const ref = processRef(prop);
  args = args.map(arg => processRef(arg) || primitives.test(arg) ? arg : `"${arg}"`);
  const sargs = args.join(", ");
  const setter = !args.length ? "" : args.length === 1 ? `=${sargs}` : `=[${sargs}]`;
  return `(${ref} instanceof Function ? ${ref}(${sargs}) : (${ref}${setter}))`;
}

function DotReactionRule(fullname) {
  const exp = textToExp(fullname);
  const code = `function dotReaction(oi) { return ${exp}; }`;
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

//jump
function JumpReactionRule(fullname) {
  const n = parseInt(fullname.slice(2));
  if (!n || isNaN(n))
    throw new DoubleDots.SyntaxError("ReactionJump only accept positive and negative integers: " + fullname.slice(2));
  // return _ => new EventLoop.ReactionJump(n);
  return DoubleDots.importBasedEval(`_ => new EventLoop.ReactionJump(${n})`);
}

const dynamics = {};
for (let prefix in scopes)
  dynamics[prefix] = DotReactionRule;
dynamics["x."] = BreakOnFalseReactionRule;
dynamics["y."] = BreakOnTrueReactionRule;
dynamics["j."] = JumpReactionRule;

export default dynamics;