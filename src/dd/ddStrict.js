import {
  noPrimitiveConstructor,
  ShadowRootAlwaysOpen,
  DoubleDotStrictMask,
  deprecate
} from "./strict_deprecation.js";

//DoubleDots doesn't treat objects made using new as primitives.
//You can remove this restriction if you have a 3rd party library that
//use such objects, and these libraries will still work ok.
//But if you make stuff from scratch, 
//stay away from "new String/Number/Boolean()".
noPrimitiveConstructor(String);
noPrimitiveConstructor(Number);
noPrimitiveConstructor(Boolean);

//DoubleDots MUST access full .composedPath for all events.
ShadowRootAlwaysOpen();

//Deprecate lots of the native methods
deprecate(DoubleDotStrictMask, window.DoubleDots ??= {});