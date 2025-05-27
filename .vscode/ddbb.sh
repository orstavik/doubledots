#!/bin/bash
# npx esbuild src/dd/dd.js src/dd/ddStrict.js --format=iife --target=es2018 --outdir=. --bundle --sourcemap --minify
# npx esbuild x/ddx.js --bundle --format=esm --outdir=. --tree-shaking=false --sourcemap --minify

# npx esbuild src/dd/dd.js src/dd/dd_dev.js  --bundle --format=esm --outdir=. --sourcemap
npx rollup --input src/dd/dd.js --file dd.js --format=esm --sourcemap --no-treeshake --preserveEntrySignatures=strict
npx rollup --input src/dd/dd_dev.js --file dd_dev.js --format=esm --sourcemap --no-treeshake --preserveEntrySignatures=strict
# npx esbuild x/ddx.js --bundle --format=esm --outdir=. --tree-shaking=false --sourcemap
npx rollup --input x/ddx.js --file ddx.js --format=esm --sourcemap --no-treeshake --preserveEntrySignatures=strict
# todo in addition, use esbuild to create a minified transpiled version compatible with say 2020?

output_files=$(find . -maxdepth 1 -type f -name "*.js" -o -name "*.js.map")
git add $output_files
dd_files=$(find src/dd/ -maxdepth 1 -type f  -name "*.js" -o -name "*.js.map")
git add $dd_files
