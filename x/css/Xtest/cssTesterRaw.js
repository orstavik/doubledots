import { toCss } from "../lib/Xengine.js";
// import { toCss } from "https://cdn.jsdelivr.net/gh/orstavik/doubledots@main25.02.11.10/x/css/lib/Xengine.js";

(async _ => {
  for (let el of document.body.querySelectorAll('[class*="$"]'))
    for (let clazz of el.classList)
      if (clazz.includes("$")) {
        try {
          console.log(toCss(clazz));
        } catch (er) {
          console.log(er.message);
        }
      }
})();