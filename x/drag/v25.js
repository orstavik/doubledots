class StateMachine {
  constructor(currentState, typeToNextState, typeToNextStatePrevented, exitStateActions) {
    this.attrs = new DoubleDots.AttrWeakSet();
    this.elements = [];
    this.currentState = currentState ?? "Listening";
    this.typeToNextState = typeToNextState ?? {};
    this.typeToNextStatePrevented = typeToNextStatePrevented ?? {};
    this.exitStateActions = exitStateActions ?? {};
  }
  transition(e) {
    const { type, defaultPrevented } = e;
    const next = (defaultPrevented ? this.typeToNextStatePrevented : this.typeToNextState)[type];
    if (!next || next === this.currentState)
      return;
    for (let at of this.attrs)
      at["end" + this.currentState]?.();
    this.exitStateActions[this.currentState]?.(this, e);
    this.currentState = next;
    for (let at of this.attrs)
      at["start" + this.currentState]?.();
  }
  addAttr(at) {
    this.attrs.add(at);
    at["start" + this.currentState]?.();
  }
  removeAttr(at) {
    at["end" + this.currentState]?.();
    this.attrs.delete(at);
  }
  addElement(el) {
    this.elements.push(el);
  }
}

const typeToNextState = {
  "drag-down": "Active",
  // "drag-move":"Active", 
  // "drag-enter": "Active",
  "drag-up": "Listening",
  "drag-cancel": "Listening",
};
const typeToNextStatePrevented = {
  ...typeToNextState,
  "drag-down": "Listening",
  "drag-move": "Listening",
};
//portal state change happens after propagation of portal event. If portal-event.prevented, then override nextState when needed
const exitStateActions = { //actions always performed when leaving a state.
  "Active": function removeElements(state, e) { state.elements.forEach(el => el.remove()); state.elements.length = 0; },
  // "Listening": function saveStartEvent(state, e) { }, //inlined in the DragEvent class instead. Timing is difficult here.
};
const defaultActions = {
  // "drag-down": makeGhostCloneAndMakeItFollow, possible, but better as a separate reaction?
};

class Portal {
  constructor(stateMachine, defaultActions) {
    this.defaultActions = defaultActions;
    this.stateMachine = stateMachine;
    this.globals = {};
  }
  add(at) {
    if (at.trigger.endsWith("_")) (this.globals[at.trigger.slice(1)] ??= new DoubleDots.AttrWeakSet()).add(at);
    this.stateMachine.addAttr(at);
  }
  remove(at) {
    if (at.trigger.endsWith("_")) this.globals[at.trigger.slice(1)].delete(at);
    this.stateMachine.removeAttr(at);
  }
  //todo this is the same propagation as normal?
  *bubble(e) {
    if (e.type.endsWith("_"))
      debugger;
    if (!e.type.endsWith("_"))
      for (let n of e.composedPath())
        if (n.attributes)
          for (let at of n.attributes)
            if (at.trigger === e.type)
              yield at;
    if (this.globals[e.type])
      for (let at of this.globals[e.type])
        yield at;
    !e.defaultPrevented && this.defaultActions[e.type]?.(portal, e);
    this.stateMachine.transition(e);
  }
}

const state = new StateMachine("Listening", typeToNextState, typeToNextStatePrevented, defaultActions, exitStateActions);
const portal = new Portal(state, defaultActions);

class DragEvent extends Event {

  #target;
  constructor(e) {
    super(e.type.replace("pointer", "drag-"), e);
    this.#target = e.currentTarget;
  }
  get relatedTarget() {
    return DragEvent.startEvent?.target;
  }
  get target() {
    return this.#target;
  }
  composedPath() {
    const path = [];
    for (let n = this.#target; n; n = n.assignedSlot ?? n.parentNode ?? n.host ?? n.defaultView)
      path.push(n);
    return path;
  }

  static startEvent;
  static first(e) { return this.startEvent = new DragEvent(e); }
  static second(e) { return new DragEvent(e); }
}

// TRIGGERS
class DragFirst extends AttrCustom {
  get reaction() { return this.trigger.replace("drag-", "pointer") + ":" + this.trigger; }
  upgrade() { portal.add(this); this.ownerElement.setAttribute(this.reaction, ""); }
  startActive() {
    this.ownerElement.setAttribute("_pointerup:drag-end", "");
    this.ownerElement.setAttribute("_pointerdown:drag-cancel", "");
    this.ownerElement.setAttribute("_pointercancel:drag-cancel", "");
  }
  endActive() {
    this.ownerElement.removeAttribute("_pointerup:drag-end");
    this.ownerElement.removeAttribute("_pointerdown:drag-cancel");
    this.ownerElement.removeAttribute("_pointercancel:drag-cancel");
  }
  remove() {
    portal.remove(this);
    super.remove();
    if (!this.ownerElement.attributes.find(a => a.name.startsWith(this.trigger + ":")))
      this.endActive();
  }
}

class DragSecond extends AttrCustom {
  get reaction() { return this.trigger.replace("drag-", "pointer") + ":" + this.trigger; }
  upgrade() { portal.add(this); }
  startActive() { this.ownerElement.setAttribute(this.reaction, ""); }
  endActive() { this.ownerElement.removeAttribute(this.reaction); }
  remove() {
    portal.remove(this);
    super.remove();
    if (!this.ownerElement.attributes.find(a => a.name.startsWith(rule + ":")))
      this.endActive();
  }
}

// REACTIONS
function dragFirst(e1) {
  if (e1.buttons != 1) return;
  e1.preventDefault();
  const e = DragEvent.first(e1);
  eventLoop.dispatchBatch(e, portal.bubble(e));
}
function dragSecond(e1) {
  e1.preventDefault();
  const e = DragEvent.second(e1);
  eventLoop.dispatchBatch(e, portal.bubble(e));
}
// function dragDrop(e){
//   const e = DragEvent.flipper(e);
//   e.preventDefault();
//   eventLoop.dispatchBatch(e, portal.bubble(e, this));
// }

//EXTRAS
function extractHardStyle(node) {
  const res = {};
  const cs = window.getComputedStyle(node);
  const clone = document.createElement(node.tagName);
  document.body.appendChild(clone);
  const cs2 = window.getComputedStyle(clone);
  debugger
  for (let p of cs)
    if (cs2.getPropertyValue(p) !== cs.getPropertyValue(p) || cs2.getPropertyPriority(p) !== cs.getPropertyPriority(p))
      res[p] = cs.getPropertyValue(p) + " " + cs.getPropertyPriority(p);
  clone.remove();
  const { width, height } = node.getBoundingClientRect();
  res.width = width + 'px';
  res.height = height + 'px';
  return res;
}

function dragClone(node) {
  if (node.nodeType === Node.TEXT_NODE)
    return document.createTextNode(node.textContent);
  if (node.nodeType !== Node.ELEMENT_NODE)
    return;
  const clone = document.createElement(node.tagName);
  clone.style = extractHardStyle(node);
  for (let c of node.childNodes)
    clone.appendChild(viewClone(c));
  return clone;
}

function dragTrack(node, e) {
  const target = e.target;
  const mLeft = e.clientX - target.getBoundingClientRect().left;
  const mTop = e.clientY - target.getBoundingClientRect().top;
  const ghost = document.createElement("div");
  document.body.appendChild(ghost);
  ghost.style.position = "static";
  ghost.style.left = (e.clientX - mLeft) + "px";
  ghost.style.top = (e.clientY - mTop) + "px";
  ghost.setAttribute("clientx", e.clientX);
  ghost.setAttribute("clienty", e.clientY);
  ghost.style.pointerEvents = "none";
  ghost.style.opacity = "0.5";
  ghost.style.zIndex = "1000000";
  ghost.style.backgroundColor = "blue";
  ghost.append(node);
  dragElements.push(ghost);
  ghost.setAttribute("_pointermove:drag-element-move", "");
  return ghost;
}

function dragElementMove({ clientX, clientY }) {
  const x = clientX - this.ownerElement.getAttribute("clientx");
  const y = clientY - this.ownerElement.getAttribute("clienty");
  this.style.transform = `translate(${x}px, ${y}px)`;
}

export {
  DragFirst as "DragDown",
  DragSecond as "DragUp",
  DragSecond as "DragCancel",
  DragSecond as "DragMove",
  DragSecond as "DragEnter",
  DragSecond as "DragLeave",
  // DragSecond as "DragDrop",
  DragFirst as "DragDown_",
  DragSecond as "DragUp_",
  DragSecond as "DragCancel_",
  DragSecond as "DragMove_",
  DragSecond as "DragEnter_",
  DragSecond as "DragLeave_",
  // DragSecond as "DragDrop_",

  dragFirst as "dragDown",
  dragSecond as "dragUp",
  dragSecond as "dragCancel",
  dragSecond as "dragMove",
  dragSecond as "dragEnter",
  dragSecond as "dragLeave",
  // dragDrop,

  dragTrack,
  dragClone,
  dragElementMove,
};