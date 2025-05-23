export function e_() {
  const e = window.eventLoop.event;
  return e.preventDefault(), e;
}

export function eDot(name) {
  const [, ...props] = name.split(".");
  return function eDot() {
    return props.reduce((acc, prop) => acc[prop], window.eventLoop.event);
  }
}