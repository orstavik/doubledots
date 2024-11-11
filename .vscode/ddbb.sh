#!/bin/bash
# npx esbuild src/dd/dd.js src/dd/ddStrict.js --format=iife --target=es2018 --outdir=. --bundle --sourcemap --minify
# npx esbuild x/ddx.js --bundle --format=esm --outdir=. --tree-shaking=false --sourcemap --minify

npx esbuild src/dd/dd.js src/dd/dd_dev.js  --bundle --format=esm --outdir=. --sourcemap
npx esbuild x/ddx.js --bundle --format=esm --outdir=. --tree-shaking=false --sourcemap

output_files=$(find . -maxdepth 1 -type f -name "*.js" -o -name "*.js.map")
git add $output_files
dd_files=$(find src/dd/ -maxdepth 1 -type f  -name "*.js" -o -name "*.js.map")
git add $dd_files
