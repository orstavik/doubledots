const fs = require('fs');
const path = require('path');

// Function to recursively generate the directory structure as a JSON object
function dirList(dir) {
  const res = {};
  for (let item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    res[item] = fs.statSync(p).isDirectory() ? dirList(p) : 1;
  }
  return res;
}

const result = dirList(__dirname);
const filename = path.join(__dirname, 'hello.json');
fs.writeFileSync(filename, JSON.stringify(result, null, 2), 'utf8');
console.log('hello sunshine.');
