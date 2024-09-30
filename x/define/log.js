export function log(oi) {
  console.log(this.ownerElement);
  console.log(oi);
}

export function log_(rule) {
  const [_, ...args] = rule.split("_");
  return _ => console.log(...args);
}

export const info = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  return function info(oi) {
    console.info(this.ownerElement);
    console.info(oi);
  };
})();

export const info_ = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  return function info_(rule) {
    const [_, ...args] = rule.split("_");
    return _ => console.info(...args);
  };
})();

export const warn_ = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  return async function warn_(rule) {
    const [_, ...args] = rule.split("_");
    await new Promise(r => setTimeout(r, 1000));
    return _ => console.warn(...args);
  };
})();

export const warn1_ = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  return function warn1_(rule) {
    const [_, ...args] = rule.split("_");
    return _ => console.warn("warn1_", ...args);
  };
})();

export const warn2_ = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  return function warn2_(rule) {
    const [_, ...args] = rule.split("_");
    throw new Error("testing warn2_");
    // return _ => console.warn("warn2_", ...args);
  };
})();

export const error = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  throw new Error("testing error");
  // return _ => console.erro(...args);
})();

export const error_ = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  throw new Error("testing error_");
  // return function error_(rule) {
  //   const [_, ...args] = rule.split("_");
  //   return _ => console.error(...args);
  // };
})();

export const trace_ = (async function () {
  await new Promise(r => setTimeout(r, 1000));
  return async function trace_(rule) {
    await new Promise(r => setTimeout(r, 1000));
    throw new Error("testing trace_");
    // const [_, ...args] = rule.split("_");
    // return _ => console.error(...args);
  };
})();
