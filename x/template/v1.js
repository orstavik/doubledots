//todo trim the template to remove ws text nodes before and after the template??
function getHoistTemplate(el, name) {
  name ||= el.tagName.toLowerCase();
  let res = document.head.querySelector(`template[name="${name}"]`);
  if (res)
    return res.content;
  el = el.firstElementChild;
  if (!(el instanceof HTMLTemplateElement))
    return;
  el.setAttribute("name", name);
  document.head.append(el);
  return el.content;
}

export function template_(rule) {
  let [_, name] = rule.split("_");
  const id = "__c" + Math.random();
  return function template() {
    return this[id] ??= getHoistTemplate(this.ownerElement, name);
  };
}