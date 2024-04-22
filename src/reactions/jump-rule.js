/**
 * This method is just as bad as eval. But, 
 * if you use this during development, and 
 * then switch to a static Reaction Trigger in production,
 * then you will be fine.
 * 
 * @param {string} The body of the function to be created from the string.
 * @returns Function 
 */
async function evalFunctionBody(codeString) {
  const blob = new Blob([codeString], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const module = await import(url);
  URL.revokeObjectURL(url);
  return module.default;
}

const numNullUndefinedBooleanThisWindowOi =
  /^(-?\d+(\.\d+)?([eE][-+]?\d+)?)|null|undefined|true|false|this|window|oi$/;
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
  if (prop.startsWith("e."))
    prop = "eventLoop.event" + prop.slice(1);
  if (prop.startsWith("el."))
    prop = "this.ownerElement" + prop.slice(1);
  prop = DoubleDots.kebabToPascal(prop);
  args = args.map(a => processArg(a));
  return `${prop}(${args.join(", ")})`;
}

function JumpReactionRule(fullname) {
  let n = fullname.slice(2);
  n = parseInt(n);
  if (!n || isNaN(n))
    throw new DoubleDots.SyntaxError("ReactionJump must be done using a positive or negative integer: " + fullname.slice(2));
  return function jumpReaction(oi) {
    return new EventLoop.ReactionJump(num);
  };
}


function BreakOnFalseReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `export default function filterReaction(oi) { return ${exp} || EventLoop.break; }`;
  return evalFunctionBody(code);
}

function BreakOnTrueReactionRule(fullname) {
  const exp = textToExp(fullname.slice(2));
  const code = `export default function filterReaction(oi) { return ${exp} && EventLoop.break; }`;
  return evalFunctionBody(code);
}

function breakOnFalse(oi) { return oi || EventLoop.break; }
function breakOnTrue(oi) { return oi && EventLoop.break; }

document.Reactions.defineRule(".", DotReactionRule);
document.Reactions.defineRule("f.", BreakOnFalseReactionRule);
document.Reactions.defineRule("t.", BreakOnTrueReactionRule);
document.Reactions.define("f.", breakOnFalse);
document.Reactions.define("t.", breakOnTrue);
