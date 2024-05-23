// build/helloWorld.js
const fs = require('fs');
const path = require('path');

// Define the file path
const filePath = path.join(__dirname, 'hello.txt');

// Write the content "world" to hello.txt
fs.writeFileSync(filePath, 'world', 'utf8');

console.log('hello.txt has been created with content "world"');
