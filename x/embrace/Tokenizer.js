// const illegals = /window|this|document|globalThis|arguments/;
//the word are all references. They will *all* be replaced with arg[i]
const dangerous = /super|this|globalThis|window|document/;
const words = /#?[\p{L}_$][\p{L}\p{N}_$]*(?:\s*\.\s*[\p{L}_$][\p{L}\p{N}_$]*)*/u;
const ignore = /\b(?:break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|implements|import|in|instanceof|interface|let|new|null|package|private|protected|public|return|static|switch|throw|true|try|typeof|var|void|while|with|yield|async|await)\b/;
const quote = /(["'])(?:\\.|(?!\1).)*\1/;
const number = /0[xX][0-9a-fA-F]+|\d*\.?\d+(?:[eE][+-]?\d+)?/;
const regex = /\/[^/\\]*(?:\\.[^/\\]*)*\/[gimyu]*/;
const linecomment = /\/\/[^\n]*/;
const starcomment = /\/\*[^]*?\*\//;

const tokens = [ignore, words, quote, number, linecomment, starcomment, regex];
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