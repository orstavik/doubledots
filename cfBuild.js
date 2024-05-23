const fs = require('fs');
const path = require('path');

// Function to recursively generate the directory structure as a JSON object
function generateDirectoryObject(dir) {
  const result = {};
  const items = fs.readdirSync(dir);
  for (let item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      result[item] = generateDirectoryObject(itemPath);
    } else {
      result[item] = 1;
    }
  }
  return result;
}

// Define the base directory
// const baseDir = path.join(__dirname, '..'); // Adjust to the appropriate base directory
// Generate the directory object
const directoryObject = generateDirectoryObject(__dirname);

// Define the output file path
const outputPath = path.join(__dirname, 'hello.json');

// Write the JSON object to hello.json
fs.writeFileSync(outputPath, JSON.stringify(directoryObject, null, 2), 'utf8');

console.log('hello sunshine.');
