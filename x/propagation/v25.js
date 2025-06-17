const stopPropOG = DoubleDots.nativeMethods("Event.prototype.stopImmediatePropagation");
const addEventListenerOG = DoubleDots.nativeMethods("EventTarget.prototype.addEventListener");
const removeEventListenerOG = DoubleDots.nativeMethods("EventTarget.prototype.removeEventListener");

function* bubble(e) {
  const path = e.composedPath();
  for (let i = path.indexOf(e.currentTarget); i < path.length; i++)
    if (path[i].attributes)
      for (let at of path[i].attributes)
        if (at.trigger === e.type)
          yield at;
  for (let at of GLOBALS[e.type] ?? [])
    yield at;
}

function* nonBubble(e) {
  const path = e.composedPath();
  let i = e.currentTarget == window ? 0 : path.indexOf(e.currentTarget);
  for (; i < path.length; i++)
    if (path[i].attributes)
      for (let at of path[i].attributes)
        if (at.trigger === e.type)
          yield at;
  for (let at of GLOBALS[e.type] ?? [])
    yield at;
}

function propagateGlobal(e) { stopPropOG.call(e); eventLoop.dispatchBatch(e, GLOBALS[e.type]); }
function propagateGlobalBubbleNo(e) { stopPropOG.call(e); eventLoop.dispatchBatch(e, nonBubble(e)); }
function propagate(e) { stopPropOG.call(e); eventLoop.dispatchBatch(e, bubble(e)); }

const GLOBALS = {};
function addFrosenProp(thiz, name, value) {
  Object.defineProperty(thiz, name, { value, writable: false, configurable: false, enumerable: true });
}

class AttrEventBubble extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagate.bind(this));
    addEventListenerOG.call(this.ownerElement, this._type, this._listener);
  }
  remove() { removeEventListenerOG.call(this.ownerElement, this._type, this._listener); }
}

class AttrEventWindowBubbleNo extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagateGlobalBubbleNo.bind(this));
    (GLOBALS[this._type] ??= new Set()).add(this);
    addEventListenerOG.call(document, this._type, this._listener);
  }
  remove() {
    GLOBALS[this._type]?.delete(this);
    removeEventListenerOG.call(document, this._type, this._listener);
  }
}

class AttrEventWindow extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagateGlobal.bind(this));
    (GLOBALS[this._type] ??= new Set()).add(this);
    addEventListenerOG.call(window, this._type, this._listener);
  }
  remove() {
    GLOBALS[this._type]?.delete(this);
    removeEventListenerOG.call(window, this._type, this._listener);
  }
}

class AttrEventDocument extends AttrCustom {
  get #type() { return this.trigger.replace(/_/g, ""); }
  upgrade() {
    addFrosenProp(this, "_type", this.trigger.replace(/_/g, ""));
    addFrosenProp(this, "_listener", propagateGlobal.bind(this));
    (GLOBALS[this.#type] ??= new Set()).add(this);
    addEventListenerOG.call(document, this._type, this._listener);
  }
  remove() {
    GLOBALS[this.#type]?.delete(this);
    removeEventListenerOG.call(document, this._type, this._listener);
  }
}

class AttrEventDCL extends AttrCustom {
  upgrade() {
    addFrosenProp(this, "_listener", propagateGlobal.bind(this));
    (GLOBALS.domcontentloaded ??= new Set()).add(this);
    addEventListenerOG.call(document, "DOMContentLoaded", this._listener);
  }
  remove() {
    GLOBALS.domcontentloaded?.delete(this);
    removeEventListenerOG.call(document, "DOMContentLoaded", this._listener);
  }
}

// SVG animation events (on SVGAnimationElement)
// beginEvent (when an animation’s active interval begins) 
// repeatEvent (each time an animation repeats) 
// endEvent (when an animation’s active interval ends) 

export {
  AttrEventBubble as "Beforecopy", AttrEventWindow as "Beforecopy_",
  AttrEventBubble as "Beforecut", AttrEventWindow as "Beforecut_",
  AttrEventBubble as "Beforepaste", AttrEventWindow as "Beforepaste_",
  AttrEventBubble as "Search", AttrEventWindow as "Search_",
  AttrEventBubble as "Fullscreenchange", AttrEventWindow as "Fullscreenchange_",
  AttrEventBubble as "Fullscreenerror", AttrEventWindow as "Fullscreenerror_",
  AttrEventBubble as "Webkitfullscreenchange", AttrEventWindow as "Webkitfullscreenchange_",
  AttrEventBubble as "Webkitfullscreenerror", AttrEventWindow as "Webkitfullscreenerror_",
  AttrEventBubble as "Beforexrselect", AttrEventWindow as "Beforexrselect_",
  AttrEventBubble as "Beforeinput", AttrEventWindow as "Beforeinput_",
  AttrEventBubble as "Beforematch", AttrEventWindow as "Beforematch_",
  AttrEventBubble as "Beforetoggle", AttrEventWindow as "Beforetoggle_",
  AttrEventBubble as "Cancel", AttrEventWindow as "Cancel_",
  AttrEventBubble as "Canplay", AttrEventWindow as "Canplay_",
  AttrEventBubble as "Canplaythrough", AttrEventWindow as "Canplaythrough_",
  AttrEventBubble as "Change", AttrEventWindow as "Change_",
  AttrEventBubble as "Click", AttrEventWindow as "Click_",
  AttrEventBubble as "Close", AttrEventWindow as "Close_",
  AttrEventBubble as "Contentvisibilityautostatechange", AttrEventWindow as "Contentvisibilityautostatechange_",
  AttrEventBubble as "Contextlost", AttrEventWindow as "Contextlost_",
  AttrEventBubble as "Contextmenu", AttrEventWindow as "Contextmenu_",
  AttrEventBubble as "Contextrestored", AttrEventWindow as "Contextrestored_",
  AttrEventBubble as "Cuechange", AttrEventWindow as "Cuechange_",
  AttrEventBubble as "Dblclick", AttrEventWindow as "Dblclick_",
  AttrEventBubble as "Drag", AttrEventWindow as "Drag_",
  AttrEventBubble as "Dragend", AttrEventWindow as "Dragend_",
  AttrEventBubble as "Dragenter", AttrEventWindow as "Dragenter_",
  AttrEventBubble as "Dragleave", AttrEventWindow as "Dragleave_",
  AttrEventBubble as "Dragover", AttrEventWindow as "Dragover_",
  AttrEventBubble as "Dragstart", AttrEventWindow as "Dragstart_",
  AttrEventBubble as "Drop", AttrEventWindow as "Drop_",
  AttrEventBubble as "Durationchange", AttrEventWindow as "Durationchange_",
  AttrEventBubble as "Formdata", AttrEventWindow as "Formdata_",
  AttrEventBubble as "Input", AttrEventWindow as "Input_",
  AttrEventBubble as "Invalid", AttrEventWindow as "Invalid_",
  AttrEventBubble as "Keydown", AttrEventWindow as "Keydown_",
  AttrEventBubble as "Keypress", AttrEventWindow as "Keypress_",
  AttrEventBubble as "Keyup", AttrEventWindow as "Keyup_",
  AttrEventBubble as "Loadeddata", AttrEventWindow as "Loadeddata_",
  AttrEventBubble as "Loadedmetadata", AttrEventWindow as "Loadedmetadata_",
  AttrEventBubble as "Loadstart", AttrEventWindow as "Loadstart_",
  AttrEventBubble as "Mousedown", AttrEventWindow as "Mousedown_",
  AttrEventBubble as "Mousemove", AttrEventWindow as "Mousemove_",
  AttrEventBubble as "Mouseout", AttrEventWindow as "Mouseout_",
  AttrEventBubble as "Mouseover", AttrEventWindow as "Mouseover_",
  AttrEventBubble as "Mouseup", AttrEventWindow as "Mouseup_",
  AttrEventBubble as "Mousewheel", AttrEventWindow as "Mousewheel_",
  AttrEventBubble as "Progress", AttrEventWindow as "Progress_",
  AttrEventBubble as "Ratechange", AttrEventWindow as "Ratechange_",
  AttrEventBubble as "Reset", AttrEventWindow as "Reset_",
  AttrEventBubble as "Resize", AttrEventWindow as "Resize_",
  AttrEventBubble as "Scroll", AttrEventWindow as "Scroll_",
  AttrEventBubble as "Securitypolicyviolation", AttrEventWindow as "Securitypolicyviolation_",
  AttrEventBubble as "Seeked", AttrEventWindow as "Seeked_",
  AttrEventBubble as "Seeking", AttrEventWindow as "Seeking_",
  AttrEventBubble as "Select", AttrEventWindow as "Select_",
  AttrEventBubble as "Slotchange", AttrEventWindow as "Slotchange_",
  AttrEventBubble as "Submit", AttrEventWindow as "Submit_",
  AttrEventBubble as "Timeupdate", AttrEventWindow as "Timeupdate_",
  AttrEventBubble as "Toggle", AttrEventWindow as "Toggle_",
  AttrEventBubble as "Volumechange", AttrEventWindow as "Volumechange_",
  AttrEventBubble as "Waiting", AttrEventWindow as "Waiting_",
  AttrEventBubble as "Webkitanimationend", AttrEventWindow as "Webkitanimationend_",
  AttrEventBubble as "Webkitanimationiteration", AttrEventWindow as "Webkitanimationiteration_",
  AttrEventBubble as "Webkitanimationstart", AttrEventWindow as "Webkitanimationstart_",
  AttrEventBubble as "Webkittransitionend", AttrEventWindow as "Webkittransitionend_",
  AttrEventBubble as "Wheel", AttrEventWindow as "Wheel_",
  AttrEventBubble as "Auxclick", AttrEventWindow as "Auxclick_",
  AttrEventBubble as "Gotpointercapture", AttrEventWindow as "Gotpointercapture_",
  AttrEventBubble as "Lostpointercapture", AttrEventWindow as "Lostpointercapture_",
  AttrEventBubble as "Pointerdown", AttrEventWindow as "Pointerdown_",
  AttrEventBubble as "Pointermove", AttrEventWindow as "Pointermove_",
  AttrEventBubble as "Pointerrawupdate", AttrEventWindow as "Pointerrawupdate_",
  AttrEventBubble as "Pointerup", AttrEventWindow as "Pointerup_",
  AttrEventBubble as "Pointercancel", AttrEventWindow as "Pointercancel_",
  AttrEventBubble as "Pointerover", AttrEventWindow as "Pointerover_",
  AttrEventBubble as "Pointerout", AttrEventWindow as "Pointerout_",
  AttrEventBubble as "Selectstart", AttrEventWindow as "Selectstart_",
  AttrEventBubble as "Selectionchange", AttrEventWindow as "Selectionchange_",
  AttrEventBubble as "Animationend", AttrEventWindow as "Animationend_",
  AttrEventBubble as "Animationiteration", AttrEventWindow as "Animationiteration_",
  AttrEventBubble as "Animationstart", AttrEventWindow as "Animationstart_",
  AttrEventBubble as "Transitionrun", AttrEventWindow as "Transitionrun_",
  AttrEventBubble as "Transitionstart", AttrEventWindow as "Transitionstart_",
  AttrEventBubble as "Transitionend", AttrEventWindow as "Transitionend_",
  AttrEventBubble as "Transitioncancel", AttrEventWindow as "Transitioncancel_",
  AttrEventBubble as "Copy", AttrEventWindow as "Copy_",
  AttrEventBubble as "Cut", AttrEventWindow as "Cut_",
  AttrEventBubble as "Paste", AttrEventWindow as "Paste_",
  AttrEventBubble as "Command", AttrEventWindow as "Command_",
  AttrEventBubble as "Scrollend", AttrEventWindow as "Scrollend_",
  AttrEventBubble as "Scrollsnapchange", AttrEventWindow as "Scrollsnapchange_",
  AttrEventBubble as "Scrollsnapchanging", AttrEventWindow as "Scrollsnapchanging_",
  AttrEventBubble as "Touchstart", AttrEventWindow as "Touchstart_",
  AttrEventBubble as "Touchmove", AttrEventWindow as "Touchmove_",
  AttrEventBubble as "Touchend", AttrEventWindow as "Touchend_",
  AttrEventBubble as "Touchcancel", AttrEventWindow as "Touchcancel_",

  AttrEventBubble as "Abort", AttrEventWindowBubbleNo as "Abort_",
  AttrEventBubble as "Load", AttrEventWindowBubbleNo as "Load_",
  AttrEventBubble as "Error", AttrEventWindowBubbleNo as "Error_",
  AttrEventBubble as "Blur", AttrEventWindowBubbleNo as "Blur_",
  AttrEventBubble as "Focus", AttrEventWindowBubbleNo as "Focus_",
  AttrEventBubble as "Mouseenter", AttrEventWindowBubbleNo as "Mouseenter_",
  AttrEventBubble as "Mouseleave", AttrEventWindowBubbleNo as "Mouseleave_",
  AttrEventBubble as "Pointerenter", AttrEventWindowBubbleNo as "Pointerenter_",
  AttrEventBubble as "Pointerleave", AttrEventWindowBubbleNo as "Pointerleave_",
  AttrEventBubble as "Emptied", AttrEventWindowBubbleNo as "Emptied_",
  AttrEventBubble as "Pause", AttrEventWindowBubbleNo as "Pause_",
  AttrEventBubble as "Play", AttrEventWindowBubbleNo as "Play_",
  AttrEventBubble as "Playing", AttrEventWindowBubbleNo as "Playing_",
  AttrEventBubble as "Ended", AttrEventWindowBubbleNo as "Ended_",
  AttrEventBubble as "Stalled", AttrEventWindowBubbleNo as "Stalled_",
  AttrEventBubble as "Suspend", AttrEventWindowBubbleNo as "Suspend_",

  AttrEventWindow as "Appinstalled",
  AttrEventWindow as "Beforeinstallprompt",
  AttrEventWindow as "Afterprint",
  AttrEventWindow as "Beforeprint",
  AttrEventWindow as "Beforeunload",
  AttrEventWindow as "Hashchange",
  AttrEventWindow as "Languagechange",
  AttrEventWindow as "Message",
  AttrEventWindow as "Messageerror",
  AttrEventWindow as "Offline",
  AttrEventWindow as "Online",
  AttrEventWindow as "Pagehide",
  AttrEventWindow as "Pageshow",
  AttrEventWindow as "Popstate",
  AttrEventWindow as "Rejectionhandled",
  AttrEventWindow as "Storage",
  AttrEventWindow as "Unhandledrejection",
  AttrEventWindow as "Unload",
  AttrEventWindow as "Devicemotion",
  AttrEventWindow as "Deviceorientation",
  AttrEventWindow as "Deviceorientationabsolute",
  AttrEventWindow as "Pageswap",
  AttrEventWindow as "Pagereveal",

  AttrEventDocument as "Readystatechange",
  AttrEventDocument as "Pointerlockchange",
  AttrEventDocument as "Pointerlockerror",
  AttrEventDocument as "Freeze",
  AttrEventDocument as "Prerenderingchange",
  AttrEventDocument as "Resume",
  AttrEventDocument as "Visibilitychange",

  AttrEventDCL as "Domcontentloaded",
};