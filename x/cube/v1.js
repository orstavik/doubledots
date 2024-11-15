console.log("DoubleDots.cubes();");
const data = [];


// cube() and STRINGIFY
let _i = 0;
function makeDocId(doc) {
  return doc === document ? "#document" : `${doc.host?.tagName}#${_i++}`;
}

const eInfo = e => `${e.type}#${e.timeStamp}`;
const dInfo = v => v.__uid ??= makeDocId(v);

function stringifyCube(k, v) {
  return (v instanceof Document || v instanceof ShadowRoot) ? dInfo(v) :
    v instanceof Event ? eInfo(v) :
      v instanceof Promise ? `Promise#${v.__uid ??= _i++}` :
        v instanceof Function ? v.name || v.toString() :
          v;
}

export function cube(k, v) {
  data.push([k, JSON.parse(JSON.stringify(v, stringifyCube))]);
}


//cubes() and conversion
function cubeToHtml(data) {
  return `
<view-cube>${JSON.stringify(data)}</view-cube>
<script type="module">
import {ViewCube} from "http://localhost:3003/x/cube/v1.js";
customElements.define("view-cube", ViewCube);
</script>`;
}
//todo the link here is a problem. Only used while developing.


export function cubes() {
  const url = URL.createObjectURL(new Blob([cubeToHtml(data)], { type: "text/html" }));
  //todo cleanup the objectUrl..
  window.open(url, "_blank");
}


const template = /*html*/`
<style>
  :host {
    display: block;
    border: 1px solid black;
    padding: 1em;
    margin: 1em;
  }
  pre {
    border: 1px solid black;
    padding: 1em;
    margin: 1em;
  }
</style>
<div></div>
`;


//ViewCube
export class ViewCube extends HTMLElement {

  static parseCube(data) {
    return data.reduce((res, [key, pojo], I) => {
      const value = Object.assign({ I, key }, pojo);
      if (key.startsWith("task")) {
        res.task.push(value);
      } else if (key.startsWith("define")) {
        const { I, Def, root, type, key, name } = value;
        const reg = [root, type, key].reduce((o, p) => (o[p] ??= {}), res.defs);
        (reg[name] ??= []).push({ I, Def });
      }
      return res;
    }, { task: [], defs: {} });
  }

  connectedCallback() {
    const data = JSON.parse(this.textContent);
    const { task, defs } = ViewCube.parseCube(data);
    const viewCubeHtml = `
    <pre>${task.map(t => JSON.stringify(t, stringifyCube, 2)).join("\n")}</pre>
    <pre>${JSON.stringify(defs, stringifyCube, 2)}</pre>`;
    this.attachShadow({ mode: "open" }).innerHTML = viewCubeHtml;
  }
}