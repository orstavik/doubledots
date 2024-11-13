function log(name, first, ...rest) {
  console.groupCollapsed(first);
  console[name](...rest);
  console.groupEnd();
}

const funcs = {
  cube: log.bind(null, "debug"),
  debugger: function (...args) { console.log(this, ...args); debugger; },
};
for (let name of ["debug", "log", "info", "warn", "error"])
  funcs[name] = log.bind(null, name);

export { funcs as console };