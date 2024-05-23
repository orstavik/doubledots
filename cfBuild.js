const fs = require('fs');
const path = require('path');

// Function to recursively generate the directory structure as a JSON object
function makeTree(dir) {
  const res = {};
  for (let item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    res[item] = fs.statSync(p).isDirectory() ? makeTree(p) : 1;
  }
  return res;
}

function filterDirectories(tree, func) {
  for (let [k, v] of Object.entries(tree))
    if (v instanceof Object)
      func(k) ? delete tree[k] : filterDirectories(v, func);
}


function main() {
  const result = makeTree(__dirname);
  const result2 = filterDirectories(result, name => name[0] === 0);
  const result3 = JSON.stringify(result2, null, 2);
  fs.writeFileSync(path.join(__dirname, 'manifest.json'), result3, 'utf8');
  return result3;
}

let res;
try {
  res = main();
} catch (err) {
  res = JSON.stringify(err, null, 2);
}
console.log(`



####### :: ########
${res}
####### :: ########





`);

