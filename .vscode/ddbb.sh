#!/bin/bash
npx esbuild src/dd/dd.js src/dd/ddStrict.js --format=iife --target=es2018 --outdir=. --bundle --sourcemap --minify
npx esbuild x/ddx.js --target=es2018 --outdir=. --bundle --sourcemap --minify 
