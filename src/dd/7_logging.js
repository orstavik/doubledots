function log(name, first, ...rest){
  console.groupCollapsed(first);
  console[name](...rest);
  console.groupEnd();
}

const funcs ={};
for (let name of ["debug", "log", "info", "warn", "error"])
  funcs[name] = log.bind(null, name);

export {funcs as console};