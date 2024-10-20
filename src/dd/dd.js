/*

dd.js => target=es2018 (old browser safe)
dd_dev.js => target=es2022 (no rewriting of the code)

npx esbuild src/dd/dd.js \
   --bundle \
   --outfile=dd.js \
   --format=iife \
   --target=es2018 \
   --sourcemap \
   --minify

*/

import {} from "./1_1_DoubleDots.js";
import {} from "./1_2_AttrCustom.js";
import {} from "./3_definition_registers_v4.js";
import {} from "./4_eventLoop_v2.js";
import {} from "./6_load_DoubleDots.js";
import {} from "./7_nativeMethods.js";