function log(name, first, ...rest) {
  console.groupCollapsed(first);
  console[name](...rest);
  console.groupEnd();
}

function setupCubes() {
  const data = [];
  let firstTime = function () {
    console.log("DoubleDots.cubes();");
    firstTime = undefined;
  };

  let i = 0;
  const makeDocId = doc => doc === document ? "#document" : `${doc.host?.tagName}#${i++}`;
  const eventInfo = e => `${e.type}#${e.timeStamp}`;

  function cubeJson(k, v) {
    return (v instanceof Document || v instanceof ShadowRoot) ? v.__uid ??= makeDocId(v) :
      v instanceof Promise ? `Promise#${v.__uid ??= i++}` :
        v instanceof Attr ? v.name :
          v instanceof Function ? v.name || v.toString() :
            v instanceof Event ? eventInfo(v) :
              v;
  }

  function cubes() {
    const data2 = data.reduce((res, [key, json], I) => {
      const value = Object.assign({ I, key }, JSON.parse(json));
      if (key.startsWith("task")) {
        res.task.push(value);
      } else if (key.startsWith("define")) {
        const { I, Def, root, type, key, name } = value;
        const reg = [root, type, key].reduce((o, p) => (o[p] ??= {}), res.defs);
        (reg[name] ??= []).push({ I, Def });
      }
      return res;
    }, { task: [], defs: {} });
    const { task, defs } = data2;
    const viewCubeHtml = `
    <pre>${task.map(t => JSON.stringify(t, cubeJson)).join("\n")}</pre>
    <pre>${JSON.stringify(defs, cubeJson, 2)}</pre>`; //add webcomp in viewCubeHtml

    const url = URL.createObjectURL(new Blob([viewCubeHtml], { type: "text/html" }));
    //todo cleanup the objectUrl..
    window.open(url, "_blank");
  }

  function cube(key, value) {
    firstTime?.();
    log("debug", key, value);
    data.push([key, JSON.stringify(value.info ?? value, cubeJson)]);
  }
  return { cube, cubes };
}

const funcs = setupCubes();
funcs.debugger = function (...args) { console.log(this, ...args); debugger; };

for (let name of ["debug", "log", "info", "warn", "error"])
  funcs[name] = log.bind(null, name);

export { funcs as console };