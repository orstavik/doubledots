/**
 * This method is just as bad as eval. But, 
 * if you use this during development, and 
 * then switch to a static Reaction Trigger in production,
 * then you will be fine.
 * 
 * @param {string} The body of the function to be created from the string.
 * @returns Function 
 */
async function importBasedEval(codeString) {
  const blob = new Blob([codeString], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const module = await import(url);
  URL.revokeObjectURL(url);
  return module.default;
}

function fixPrefix(prop) {
  if (prop[0] === ".")
    return "this" + prop;
  if (prop.startsWith("el."))
    return "this.ownerElement" + prop.slice(2);
  if (prop.startsWith("e."))
    return "window.eventLoop.event" + prop.slice(1);
  return prop;
}

const primitives = /^((-?\d+(\.\d+)?([eE][-+]?\d+)?)|this|window|document|oi|e|true|false|undefined|null)$/;
const validScopes = /^(this|window|document|oi)\..*/;

function parseArg(word) {
  return primitives.test(word) ? word :
    validScopes.test(word) ? DoubleDots.kebabToPascal(arg) :
      `"${arg}"`;
}
const numNullUndefinedBooleanThisWindowOi =
  /^null|undefined|true|false|this|window|oi$/;
const startsWithThisWindowOi = /^this\.|^window\.|^oi\./;
function processArg(arg) {
  return arg === "e" ? "eventLoop.event" :
    arg.startsWith("e.") ? "eventLoop.event" + arg.slice(1) :
      arg === "el" ? "this.ownerElement" :
        arg.startsWith("el.") ? "this.ownerElement" + arg.slice(1) :
          numNullUndefinedBooleanThisWindowOi.test(arg) ? arg :
            startsWithThisWindowOi.test(arg) ? DoubleDots.kebabToPascal(arg) :
              `"${arg}"`;
}

/**
 * @param {string} txt 
 * @returns {string} with the input as a valid js expression
 */
function textToExp(txt) {
  let [prop, ...args] = txt.split("_");
  prop = DoubleDots.kebabToPascal(prop);
  args = args.map(a => processArg(a));
  const getSet = !args.length ? prop :
    args.length === 1 ? `${prop} = ${args[0]}` :
      `${prop} = [${args.join(", ")}]`;
  return `${prop} instanceof Function ? ${prop}(${args.join(", ")}) : ${getSet}`;
}

function DotReactionRule(corrected) {
  const exp = textToExp(corrected);
  const code = `export default function dotReaction(oi) { return ${exp}; }`;
  return importBasedEval(code);
}

function eDotReactionRule(fullname) {
  fullname = "eventLoop.event" + fullname.slice(1);
  return DotReactionRule(fullname);
}

function thisDotReactionRule(fullname) {
  fullname = "this" + fullname;
  return DotReactionRule(fullname);
}

function elDotReactionRule(fullname) {
  fullname = "this.ownerElement" + fullname.slice(2);
  return DotReactionRule(fullname);
}

document.Reactions.defineRule(".", thisDotReactionRule);
document.Reactions.defineRule("e.", eDotReactionRule);
document.Reactions.defineRule("el.", elDotReactionRule);
document.Reactions.defineRule("window.", DotReactionRule);
document.Reactions.defineRule("document.", DotReactionRule);


//todo these don't work yet!!!
//todo we need to write them as wrappers..
function BreakOnFalseReactionRule(fullname) {
  const name = fullname.slice(2);
  //todo if we have the previous  
  if (!name)
    return function breakOnFalse(oi) { return oi || EventLoop.break; };
  const exp = textToExp(name);
  const code = `export default function filterReaction(oi) { return ${exp} || EventLoop.break; }`;
  return importBasedEval(code);
}

function BreakOnTrueReactionRule(fullname) {
  const name = fullname.slice(2);
  if (!name)
    return function breakOnTrue(oi) { return oi && EventLoop.break; };
  const exp = textToExp(fullname.slice(2));
  const code = `export default function filterReaction(oi) { return ${exp} && EventLoop.break; }`;
  return importBasedEval(code);
}

// document.Reactions.defineRule("f.", BreakOnFalseReactionRule);
// document.Reactions.defineRule("t.", BreakOnTrueReactionRule);