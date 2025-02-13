import { toCss } from "../lib/Xengine.js";
// import { toCss } from "https://cdn.jsdelivr.net/gh/orstavik/doubledots@main25.02.11.10/x/css/lib/Xengine.js";

(async _ => {
  let res = [];
  for (let el of document.body.querySelectorAll('[class*="$"]'))
    for (let clazz of el.classList)
      if (clazz.includes("$")) {
        try {
          res.push(toCss(clazz));
        } catch (er) {
          console.error(er);
        }
      }
  res = res.join("\n\n");
  const expected = document.getElementById("expected").textContent.trim();
  const resZ = res.replaceAll(/\s+/g, "");
  const expectedZ = expected.replaceAll(/\s+/g, "");
  if (resZ == expectedZ)
    return console.log("OK");
  console.log(res);

  const style = document.createElement("style");
  document.head.append(style);
  style.textContent = res;
})();