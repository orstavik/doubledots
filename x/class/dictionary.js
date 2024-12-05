const GLOBAL_KEYS = {
  width: /w|width/,
  color: /red|blue|green|rgb|hsl/,
  direction: /(top|left|bottom|right|t|l|r|b|x|y)+/,
  inherit: /inherit/
};

const CSS_KEYWORDS = {
  border: {
    style: /solid|dashed|dotted|double|groove|ridge|inset|outset|none/,
    width: /|w|width/,
    radius: /r|radius/,
    collapse: /collapse|separate/
  }
};

const IDENTIFIERS = {
  border: /border|solid|dashed|dotted|double|groove|ridge|inset|outset/
};

const MATCHERS = {
  border: [
    /border(_direction)?(_(style|width#|radius#|color#?|collapse#?))*/,
    /style(_direction)?(_(width#|radius#|color#?|collapse#?))*/
  ]
};

const DEFAULT_NUM_TYPES = {
  border: "px"
};


export function identify(value) {
  const firstWord = value.match(/[a-z]+/)?.[0];
  if (firstWord)
    for (let [valueType, rx] of Object.entries(IDENTIFIERS))
      if (firstWord.match(new RegExp(`^(?:${rx.source})$`)))
        return { valueType, defaultNumType: DEFAULT_NUM_TYPES[valueType]};
  throw new SyntaxError("Unknown valueGroup: " + value);
}

export function checkShorthandSignature(valueGroup, valueString, typeString) {
  for (let shorthand of MATCHERS[valueGroup])
    if (typeString.match(shorthand))
      return;
  throw new SyntaxError(
    `The given values "${valueString}" was identified as "${valueGroup}".
However, when parsed into typeString "${typeString}" it didn't match any valueGroup signature.`);
}

export function findType(valueGroup, word) {
  const enums = Object.assign({}, GLOBAL_KEYS, CSS_KEYWORDS[valueGroup]);
  for (let [type, rx] of Object.entries(enums))
    if (word.match(new RegExp(`^(?:${rx.source})$`)))
      return type;
}