function replaceInPlace(ar, map) {
  for (let i = 0; i < ar.length; i++) {
    const strAr = ar[i];
    if (strAr instanceof ar)
      replaceInPlace(strAr, map);
    if (typeof strAr == "string")
      ar[i] = strAr.replaceAll(/"(\d+)"/, (_, d) => map[d]);
  }
}

function commas(str) {
  const qs = [];
  str = str.replaceAll(/([`'"])((?:\\.|(?!\1).)*?)\1/g, m => `"${qs.push(m) - 1}"`);
  const res = commaArray(str, 0);
  replaceInPlace(res, qs);
  return res;
}

function commaArray(str, I = 0) {
  let b = I, a = I, res = [];
  while (b < str.length) {
    const c = str[b];
    if (c === ",") {
      res.push(str.substring(a, b));
      a = ++b;
    } else if (c === "[") {
      const [inner, B] = commaArray(str, b + 1);
      res.push(inner);
      a = b = B;
    } else if (c === "]") {
      if (!I)
        throw new SyntaxError("Ending a [vector] too quickly? " + str);
      res.push(str.substring(a, b - 1));
      return [res, b + 1];
    }
  }
  if (I)
    throw new SyntaxError("[] must end with a ]: " + str);
  res.push();
  return res;
}

function parseHelper(str) {
  let result = [];
  let currentElement = '';
  let i = 0;

  while (i < str.length) {
    if (str[i] === '[') {
      // Start of a nested array
      let nestedArray = '';
      let openBrackets = 1;
      i++;
      while (i < str.length && openBrackets > 0) {
        if (str[i] === '[') openBrackets++;
        if (str[i] === ']') openBrackets--;
        if (openBrackets > 0) nestedArray += str[i];
        i++;
      }
      result.push(parseHelper(nestedArray.trim()));
    } else if (str[i] === ',') {
      // End of an element, add to result
      if (currentElement.trim()) {
        result.push(currentElement.trim());
      }
      currentElement = '';
      i++;
    } else {
      // Accumulate characters for the current element
      currentElement += str[i];
      i++;
    }
  }

  // Add the last element if it exists
  if (currentElement.trim()) {
    result.push(currentElement.trim());
  }

  return result;
}


function parseArrayNotation(inputString) {

  // Remove outer brackets if they exist and call the helper
  let trimmedString = inputString;
  if (trimmedString.startsWith('[') && trimmedString.endsWith(']')) {
    trimmedString = trimmedString.slice(1, -1);
  }
  return parseHelper(trimmedString);
}

// Example usage
const input = "[1, 2, [3, 4], 5, [6, [7, 8]], 9]";
const parsedArray = parseArrayNotation(input);
console.log(parsedArray);


const str = /*css*/`
  --color: red;

  --color-1: oklab(from var(--color) l a -0.4);
  --color-2: oklab(from var(--color) l a -0.3);
  --color-3: oklab(from var(--color) l a -0.2);
  --color-4: oklab(from var(--color) l a -0.1);
  --color-5: oklab(from var(--color) l a 0);
  --color-6: oklab(from var(--color) l a 0.1);
  --color-7: oklab(from var(--color) l a 0.2);
  --color-8: oklab(from var(--color) l a 0.3);
  --color-9: oklab(from var(--color) l a 0.4);
  
  --color-a1: oklab(from var(--color) l -0.4 b);
  --color-a2: oklab(from var(--color) l -0.3 b);
  --color-a3: oklab(from var(--color) l -0.2 b);
  --color-a4: oklab(from var(--color) l -0.1 b);
  --color-a5: oklab(from var(--color) l 0 b);
  --color-a6: oklab(from var(--color) l 0.1 b);
  --color-a7: oklab(from var(--color) l 0.2 b);
  --color-a8: oklab(from var(--color) l 0.3 b);
  --color-a9: oklab(from var(--color) l 0.4 b);


  --d: 0.1;
  --color-b1: oklab(from var(--color) l calc(a - var(--d)) calc(b - var(--d)));
  --color-b2: oklab(from var(--color) l a calc(b - var(--d)));
  --color-b3: oklab(from var(--color) l calc(a + var(--d)) calc(b - var(--d)));
  --color-b4: oklab(from var(--color) l calc(a - var(--d)) b);
  --color-b5: oklab(from var(--color) l a b);
  --color-b6: oklab(from var(--color) l calc(a + var(--d)) b);
  --color-b7: oklab(from var(--color) l calc(a - var(--d)) calc(b + var(--d)));
  --color-b8: oklab(from var(--color) l a calc(b + var(--d)));
  --color-b9: oklab(from var(--color) l calc(a + var(--d)) calc(b + var(--d)));

`


/*html */`
<div style="--bg: var(--color-a1, grey)"></div>
<div style="--bg: var(--color-a2, grey)"></div>
<div style="--bg: var(--color-a3, grey)"></div>
<div style="--bg: var(--color-a4, grey)"></div>
<div style="--bg: var(--color-a5, grey)"></div>
<div style="--bg: var(--color-a6, grey)"></div>
<div style="--bg: var(--color-a7, grey)"></div>
<div style="--bg: var(--color-a8, grey)"></div>
<div style="--bg: var(--color-a9, grey)"></div>
`