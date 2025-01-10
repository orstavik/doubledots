function parseArrayNotation(inputString) {
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
