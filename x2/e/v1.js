function e_() {
  const e = window.eventLoop.event;
  return e.preventDefault(), e;
}

function eDot(name) {
  name = DoubleDots.kebabToPascal(name);
  const [, ...props] = name.split(".");
  return function eDot() {
    return props.reduce((acc, prop) => acc[prop], window.eventLoop.event);
  }
}

export {
  e_,
  eDot as "e."
}
