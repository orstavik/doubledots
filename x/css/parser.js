function parseClassString(word) {
  //words: one one-two one-two-three (NOT: -one two- one-two3)
  const WORD = /([a-z](?:[a-z-]*[a-z])?)/; // Regular words
  // -one -one-two-three
  const VAR = new RegExp(`-${WORD.source}`);
  // -one-two3
  const VAR_WORD = new RegExp(`${VAR.source}[0-9]+`); // Property-like strings

  const WORD = /([a-z](?:[a-z-]*[a-z])?)/; // Regular words
  const TYPE = /px|perc|vh|vw|rem|em|ex|ch|cm|mm|in|pt|pc|deg/; // Units
  const DIGIT = /\-?[0-9]+/;
  const NUM = new RegExp(`(${DIGIT.source})(${TYPE.source})?`); // Numbers with optional units
  const ARGS = new RegExp(`${NUM.source}(?:-${NUM.source})*`);
  const ATOM = new RegExp(`${WORD.source}(${ARGS.source})?`); // Words with arguments
  // const UNIT = new RegExp(`(${ATOM.source}|${VAR_WORD.source})`); // Either ATOM or VAR_WORD
  // const VALUE_GROUP = new RegExp(`${UNIT.source}(_${UNIT.source})*`); // One or more UNITs separated by underscores

  const atoms = word.split("_").map(unit => {
    let res;
    if (res = unit.match(VAR_WORD))
      return { type: "var", unit, word: res[1] };
    if (res = unit.match(ATOM)) {
      const [_, word, tail] = res;
      const nums = tail.split("[^-]-");
      const args = nums.map(n => n.match(NUM).slice(1));
      return { type: "atom", word, args };
    }
  });

  // Validate the entire class string
  if (!VALUE_GROUP.test(word)) {
    throw new Error("Invalid class string format");
  }

  // Split the class string by underscores to parse individual units
  const units = word.split("_");

  // Parse each unit
  const parsedUnits = units.map((unit) => {
    if (ATOM.test(unit)) {
      return { type: "ATOM", value: unit };
    } else if (VAR_WORD.test(unit)) {
      return { type: "PROP", value: unit };
    } else {
      throw new Error(`Invalid UNIT: ${unit}`);
    }
  });

  return parsedUnits;
}

// Example usage
try {
  const parsed = parseClassString("-001--001px-2rem_atom2-prop100_unit2");
  console.log(parsed);
} catch (error) {
  console.error(error.message);
}
