#!/bin/bash
npx esbuild src/dd/dd.js src/dd/ddStrict.js --format=iife --target=es2018 --outdir=. --bundle --sourcemap --minify
npx esbuild x/ddx.js --target=es2018 --outdir=. --bundle --sourcemap --minify 

output_files=$(find . -maxdepth 1 -type f -name "*.js" -o -name "*.js.map")
git add $output_files
