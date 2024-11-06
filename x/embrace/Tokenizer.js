const ignore = /\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|switch|throw|true|try|typeof|var|void|while|with|yield|async|await)\b/;
const dotWords = /\.\s*[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}_$][\p{L}\p{N}_$]*)*/u;
const words = /#?[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}_$][\p{L}\p{N}_$]*)*/u;
const quote1 = /'([^'\\]*(\\.[^'\\]*)*)'/;
const quote2 = /"([^"\\]*(\\.[^"\\]*)*)"/;
const number = /0[xX][0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?/;
const regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
const linecomment = /\/\/[^\n]*/;
const starcomment = /\/\*[^]*?\*\//;

//todo security problems.
//1. template strings: `comments ${here can come devils}`. strategy 1) make it throw an error, 2) tokenize ${} inside recursively?..
//2. something["bad"].CAN.HAPPEN.HERE.constructor.__proto__.etc strategy a) make it throw an error? b) make the function work hiddenly?
// const dangerous = /super|window|this|document|globalThis|arguments|Function|eval/;
// These dangerous words are captured, replaced with args[1], and attempted gotten from the context. Thus, they are safe.

const tokens = [ignore, words, dotWords, quote1, quote2, number, linecomment, starcomment, regex];
const tokenizer = new RegExp(tokens.map(r => `(${r.source})`).join("|"), "gu");

export function extractArgs(txt, params = []) {
  txt = txt.replaceAll(tokenizer, (o, _, prop) => {
    if (!prop)
      return o;
    prop = prop.replaceAll(/\s+/g, "");
    let i = params.indexOf(prop);
    if (i < 0)
      i = params.push(prop) - 1;
    return `args[${i}]`;
  });
  return txt;
};

const tsts = [[
  `//the word are all references. They will *all* be replaced with arg[i]
  const word = / #something.else */u;
  const quote = / name /;
  const number = /n . a . m . e/;
  const regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
  const starcomment = /\/\*[^]*?\*\//;`,

  `//the word are all references. They will *all* be replaced with arg[i]
  const args[0] = / #something.else */u;
  const args[1] = / name /;
  const args[2] = /n . a . m . e/;
  const args[3] = //[^/\\]*(?:\\.[^/\\]*)*/[gimyu]*/;
  const args[4] = //*[^]*?*//;`
], [
  `name hello . sunshine #hello.world bob123 _123`,
  `args[0] args[1] args[2] args[3] args[4]`
], [
  `name.hello["bob"].sunshine  . bob`,
  `args[0]["bob"].sunshine  . bob`
]

];

function test() {
  for (let [before, after] of tsts) {
    const res = extractArgs(before).trim();
    if (res !== after)
      console.log(res);
  }
}

// test();