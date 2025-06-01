export function classList() { return this.ownerElement.classList; }

export function clazz() { return this.ownerElement.getAttribute("class"); }

export function classDot(name) {
  name = name.split(".")[1];
  if (!name) throw new SyntaxError("'class.' needs a name such as 'class.cssClassName'.");
  return function classDot() {
    return this.ownerElement.classList.contains(name) ? name : undefined;
  }
}

export function class_(name) {
  name = name.split("_")[1];
  if (!name)
    return function class_(input) { return this.ownerElement.classList.add(input), input; }
  return function class_name() { return this.ownerElement.classList.add(name), name; }
}

export function toggleClass_(name) {
  const segs = name.split("_");
  const name2 = segs[1];
  let previous;
  if (!name2) {
    return function toggleClass_input(input) {
      if (previous)
        this.ownerElement.classList.remove(previous);
      previous = input;
      return this.ownerElement.classList.toggle(input), input;
    }
  }
  if (segs.length === 3)
    return function toggleClass_onOff(input) {
      return this.ownerElement.classList.toggle(name2, !!input), !!input ? name2 : undefined;
    }
  return function toggleClass_name() {
    return this.ownerElement.classList.toggle(name2), name2;
  }
}