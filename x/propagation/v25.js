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
  AttrEventBubble as "beforecopy", AttrEventWindow as "beforecopy_",
  AttrEventBubble as "beforecut", AttrEventWindow as "beforecut_",
  AttrEventBubble as "beforepaste", AttrEventWindow as "beforepaste_",
  AttrEventBubble as "search", AttrEventWindow as "search_",
  AttrEventBubble as "fullscreenchange", AttrEventWindow as "fullscreenchange_",
  AttrEventBubble as "fullscreenerror", AttrEventWindow as "fullscreenerror_",
  AttrEventBubble as "webkitfullscreenchange", AttrEventWindow as "webkitfullscreenchange_",
  AttrEventBubble as "webkitfullscreenerror", AttrEventWindow as "webkitfullscreenerror_",
  AttrEventBubble as "beforexrselect", AttrEventWindow as "beforexrselect_",
  AttrEventBubble as "beforeinput", AttrEventWindow as "beforeinput_",
  AttrEventBubble as "beforematch", AttrEventWindow as "beforematch_",
  AttrEventBubble as "beforetoggle", AttrEventWindow as "beforetoggle_",
  AttrEventBubble as "cancel", AttrEventWindow as "cancel_",
  AttrEventBubble as "canplay", AttrEventWindow as "canplay_",
  AttrEventBubble as "canplaythrough", AttrEventWindow as "canplaythrough_",
  AttrEventBubble as "change", AttrEventWindow as "change_",
  AttrEventBubble as "click", AttrEventWindow as "click_",
  AttrEventBubble as "close", AttrEventWindow as "close_",
  AttrEventBubble as "contentvisibilityautostatechange", AttrEventWindow as "contentvisibilityautostatechange_",
  AttrEventBubble as "contextlost", AttrEventWindow as "contextlost_",
  AttrEventBubble as "contextmenu", AttrEventWindow as "contextmenu_",
  AttrEventBubble as "contextrestored", AttrEventWindow as "contextrestored_",
  AttrEventBubble as "cuechange", AttrEventWindow as "cuechange_",
  AttrEventBubble as "dblclick", AttrEventWindow as "dblclick_",
  AttrEventBubble as "drag", AttrEventWindow as "drag_",
  AttrEventBubble as "dragend", AttrEventWindow as "dragend_",
  AttrEventBubble as "dragenter", AttrEventWindow as "dragenter_",
  AttrEventBubble as "dragleave", AttrEventWindow as "dragleave_",
  AttrEventBubble as "dragover", AttrEventWindow as "dragover_",
  AttrEventBubble as "dragstart", AttrEventWindow as "dragstart_",
  AttrEventBubble as "drop", AttrEventWindow as "drop_",
  AttrEventBubble as "durationchange", AttrEventWindow as "durationchange_",
  AttrEventBubble as "formdata", AttrEventWindow as "formdata_",
  AttrEventBubble as "input", AttrEventWindow as "input_",
  AttrEventBubble as "invalid", AttrEventWindow as "invalid_",
  AttrEventBubble as "keydown", AttrEventWindow as "keydown_",
  AttrEventBubble as "keypress", AttrEventWindow as "keypress_",
  AttrEventBubble as "keyup", AttrEventWindow as "keyup_",
  AttrEventBubble as "loadeddata", AttrEventWindow as "loadeddata_",
  AttrEventBubble as "loadedmetadata", AttrEventWindow as "loadedmetadata_",
  AttrEventBubble as "loadstart", AttrEventWindow as "loadstart_",
  AttrEventBubble as "mousedown", AttrEventWindow as "mousedown_",
  AttrEventBubble as "mousemove", AttrEventWindow as "mousemove_",
  AttrEventBubble as "mouseout", AttrEventWindow as "mouseout_",
  AttrEventBubble as "mouseover", AttrEventWindow as "mouseover_",
  AttrEventBubble as "mouseup", AttrEventWindow as "mouseup_",
  AttrEventBubble as "mousewheel", AttrEventWindow as "mousewheel_",
  AttrEventBubble as "progress", AttrEventWindow as "progress_",
  AttrEventBubble as "ratechange", AttrEventWindow as "ratechange_",
  AttrEventBubble as "reset", AttrEventWindow as "reset_",
  AttrEventBubble as "resize", AttrEventWindow as "resize_",
  AttrEventBubble as "scroll", AttrEventWindow as "scroll_",
  AttrEventBubble as "securitypolicyviolation", AttrEventWindow as "securitypolicyviolation_",
  AttrEventBubble as "seeked", AttrEventWindow as "seeked_",
  AttrEventBubble as "seeking", AttrEventWindow as "seeking_",
  AttrEventBubble as "select", AttrEventWindow as "select_",
  AttrEventBubble as "slotchange", AttrEventWindow as "slotchange_",
  AttrEventBubble as "submit", AttrEventWindow as "submit_",
  AttrEventBubble as "timeupdate", AttrEventWindow as "timeupdate_",
  AttrEventBubble as "toggle", AttrEventWindow as "toggle_",
  AttrEventBubble as "volumechange", AttrEventWindow as "volumechange_",
  AttrEventBubble as "waiting", AttrEventWindow as "waiting_",
  AttrEventBubble as "webkitanimationend", AttrEventWindow as "webkitanimationend_",
  AttrEventBubble as "webkitanimationiteration", AttrEventWindow as "webkitanimationiteration_",
  AttrEventBubble as "webkitanimationstart", AttrEventWindow as "webkitanimationstart_",
  AttrEventBubble as "webkittransitionend", AttrEventWindow as "webkittransitionend_",
  AttrEventBubble as "wheel", AttrEventWindow as "wheel_",
  AttrEventBubble as "auxclick", AttrEventWindow as "auxclick_",
  AttrEventBubble as "gotpointercapture", AttrEventWindow as "gotpointercapture_",
  AttrEventBubble as "lostpointercapture", AttrEventWindow as "lostpointercapture_",
  AttrEventBubble as "pointerdown", AttrEventWindow as "pointerdown_",
  AttrEventBubble as "pointermove", AttrEventWindow as "pointermove_",
  AttrEventBubble as "pointerrawupdate", AttrEventWindow as "pointerrawupdate_",
  AttrEventBubble as "pointerup", AttrEventWindow as "pointerup_",
  AttrEventBubble as "pointercancel", AttrEventWindow as "pointercancel_",
  AttrEventBubble as "pointerover", AttrEventWindow as "pointerover_",
  AttrEventBubble as "pointerout", AttrEventWindow as "pointerout_",
  AttrEventBubble as "selectstart", AttrEventWindow as "selectstart_",
  AttrEventBubble as "selectionchange", AttrEventWindow as "selectionchange_",
  AttrEventBubble as "animationend", AttrEventWindow as "animationend_",
  AttrEventBubble as "animationiteration", AttrEventWindow as "animationiteration_",
  AttrEventBubble as "animationstart", AttrEventWindow as "animationstart_",
  AttrEventBubble as "transitionrun", AttrEventWindow as "transitionrun_",
  AttrEventBubble as "transitionstart", AttrEventWindow as "transitionstart_",
  AttrEventBubble as "transitionend", AttrEventWindow as "transitionend_",
  AttrEventBubble as "transitioncancel", AttrEventWindow as "transitioncancel_",
  AttrEventBubble as "copy", AttrEventWindow as "copy_",
  AttrEventBubble as "cut", AttrEventWindow as "cut_",
  AttrEventBubble as "paste", AttrEventWindow as "paste_",
  AttrEventBubble as "command", AttrEventWindow as "command_",
  AttrEventBubble as "scrollend", AttrEventWindow as "scrollend_",
  AttrEventBubble as "scrollsnapchange", AttrEventWindow as "scrollsnapchange_",
  AttrEventBubble as "scrollsnapchanging", AttrEventWindow as "scrollsnapchanging_",
  AttrEventBubble as "touchstart", AttrEventWindow as "touchstart_",
  AttrEventBubble as "touchmove", AttrEventWindow as "touchmove_",
  AttrEventBubble as "touchend", AttrEventWindow as "touchend_",
  AttrEventBubble as "touchcancel", AttrEventWindow as "touchcancel_",

  AttrEventBubble as "abort", AttrEventWindowBubbleNo as "abort_",
  AttrEventBubble as "load", AttrEventWindowBubbleNo as "load_",
  AttrEventBubble as "error", AttrEventWindowBubbleNo as "error_",
  AttrEventBubble as "blur", AttrEventWindowBubbleNo as "blur_",
  AttrEventBubble as "focus", AttrEventWindowBubbleNo as "focus_",
  AttrEventBubble as "mouseenter", AttrEventWindowBubbleNo as "mouseenter_",
  AttrEventBubble as "mouseleave", AttrEventWindowBubbleNo as "mouseleave_",
  AttrEventBubble as "pointerenter", AttrEventWindowBubbleNo as "pointerenter_",
  AttrEventBubble as "pointerleave", AttrEventWindowBubbleNo as "pointerleave_",
  AttrEventBubble as "emptied", AttrEventWindowBubbleNo as "emptied_",
  AttrEventBubble as "pause", AttrEventWindowBubbleNo as "pause_",
  AttrEventBubble as "play", AttrEventWindowBubbleNo as "play_",
  AttrEventBubble as "playing", AttrEventWindowBubbleNo as "playing_",
  AttrEventBubble as "ended", AttrEventWindowBubbleNo as "ended_",
  AttrEventBubble as "stalled", AttrEventWindowBubbleNo as "stalled_",
  AttrEventBubble as "suspend", AttrEventWindowBubbleNo as "suspend_",

  AttrEventWindow as "appinstalled",
  AttrEventWindow as "beforeinstallprompt",
  AttrEventWindow as "afterprint",
  AttrEventWindow as "beforeprint",
  AttrEventWindow as "beforeunload",
  AttrEventWindow as "hashchange",
  AttrEventWindow as "languagechange",
  AttrEventWindow as "message",
  AttrEventWindow as "messageerror",
  AttrEventWindow as "offline",
  AttrEventWindow as "online",
  AttrEventWindow as "pagehide",
  AttrEventWindow as "pageshow",
  AttrEventWindow as "popstate",
  AttrEventWindow as "rejectionhandled",
  AttrEventWindow as "storage",
  AttrEventWindow as "unhandledrejection",
  AttrEventWindow as "unload",
  AttrEventWindow as "devicemotion",
  AttrEventWindow as "deviceorientation",
  AttrEventWindow as "deviceorientationabsolute",
  AttrEventWindow as "pageswap",
  AttrEventWindow as "pagereveal",

  AttrEventDocument as "readystatechange",
  AttrEventDocument as "pointerlockchange",
  AttrEventDocument as "pointerlockerror",
  AttrEventDocument as "freeze",
  AttrEventDocument as "prerenderingchange",
  AttrEventDocument as "resume",
  AttrEventDocument as "visibilitychange",

  AttrEventDCL as "domcontentloaded",
};