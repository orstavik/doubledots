export function clazz() { return this.ownerElement.getAttribute("class"); }

export function classDot(name) {
  name = name.split(".")[1];
  return name ?
    function classDot() { return this.ownerElement.classList.contains(name); }:
    function classList() { return this.ownerElement.classList; } ;
}

export function class_(rule) {
  const args = rule.split("_").slice(1);
  const [name, onOff] = args;
  if (onOff != "2" && onOff != "1" && onOff != "0")
    throw new SyntaxError("second parameter to 'class_' must be either 0, 1, or 2.");

  if (onOff == "2")       //:class_name_2 :class__2
    return name ?
      function class_name_2() { return this.ownerElement.classList.toggle(name); } :
      function class__2(input) { return this.ownerElement.classList.toggle(input); };

  if (onOff == "1")        //:class_name_1 :class__1
    return name ?
      function class_name_1() { return this.ownerElement.classList.add(name), name; } :
      function class__1(input) { return this.ownerElement.classList.add(input), input; };

  if (onOff == "0")        //:class_name_0 :class__0
    return name ?
      function class_name_0() { return this.ownerElement.classList.remove(name), name; } :
      function class__0(input) { return this.ownerElement.classList.remove(input), input; };

  if (name)                //:class_name
    return function class_name(i) { return this.ownerElement.classList.toggleClass(name, !!i), name; };

  let previous;            //:class_
  return function class_(input) {
    if (previous)
      this.ownerElement.classList.remove(previous);
    return this.ownerElement.classList.add(previous = input), input;
  }
}

// export function toggleClass_(name) {
//   const segs = name.split("_");
//   const name2 = segs[1];
//   let previous;
//   if (!name2) {
//     return function toggleClass_input(input) {
//       if (previous)
//         this.ownerElement.classList.remove(previous);
//       previous = input;
//       return this.ownerElement.classList.toggle(input), input;
//     }
//   }
//   if (segs.length === 3)
//     return function toggleClass_onOff(input) {
//       return this.ownerElement.classList.toggle(name2, !!input), !!input ? name2 : undefined;
//     }
//   return function toggleClass_name() {
//     return this.ownerElement.classList.toggle(name2), name2;
//   }
// }

// class_dragging? Every time you call it, it toggles on off
// class_dragging_1? this means classList.addClass(dragging). Less used. And here the second alternative is always true.
// class_dragging_? this means classList.toggleClass(dragging, !!input)
// class_ ? means toggle the incoming class. (if the same reaction is called again, it will remove what was added last, and then add new class.)
// class.something ? classList.hasClass()checks if there is a class there.
// class? gives the classlist as a string.
// class. gives the classlist object.