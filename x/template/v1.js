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
  return function template() {
    return this.__template ??= getHoistTemplate(this.ownerElement, name);
  };
}

//todo untested
export function template() {
  return this.__template ??= getHoistTemplate(this.ownerElement, this.ownerElement.getAttribute("template"));
};

//todo the template_attr_val_attr2_val2... rule. The .val are interpreted as dotGetters.
//todo tag-name is always ownerElement.tagName
//todo other empty values are attempted replaced with the value of 
//todo a prop of the incoming data element. Again, this will work if 
//todo the incoming element is not an Event, but just the data object. 
//todo This means that we need to filter the value.
//todo if no value, then the attribute is just checked for presence.
//todo the "if/else" of works by selecting a template based on the value from first argument.

//:template_type_.post.type       => <template type="${post.type}">
//:template_name_hellosunshine    => <template name="hellosunshine">
//:template_tag-name              => <template tag-name="my-component">
//:template                       => ownerElement.firstChild template.

//the rules inside the brace don't allow us to 
//remove any nodes from the branch dynamically.
//if we do, then the rules will run against the wrong node.