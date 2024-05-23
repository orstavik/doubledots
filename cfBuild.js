const fs = require('fs');
const path = require('path');

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
  filterDirectories(result, name => name[0] === ".");
  const json = JSON.stringify(result, null, 2);
  fs.writeFileSync(path.join(__dirname, 'manifest.json'), json, 'utf8');
  return json;
}

let res;
try {
  res = main();
} catch (err) {
  res = JSON.stringify(err, null, 2);
}
console.log(`
============== :: ================
${res.substring(0, 5000)}
============== :: ================
`);

