import { } from "./1_DoubleDots.js";
import { } from "./2_AttrCustom.js";
import { } from "./3_definition_registers_v25.js";
import { } from "./4_eventLoop_v2.js";
import { loadDoubleDots } from "./5_load_DoubleDots_v25.js";
import { define, defineReaction, defineTrigger, defineReactionRule, defineTriggerRule } from "../../x/define/v25.js";
import { Template } from "../../x/template/v25.js";
import { wait_ } from "../../x/wait/v1.js";
//todo this should probably be Wait_ too
//Wait_100:do-something:at.repeat //which would enable us to have a set timeout

document.Triggers.define("template", Template);
// document.Reactions.define("template", template);
document.Reactions.define("define", define);
document.Reactions.define("define-reaction", defineReaction);
document.Reactions.define("define-trigger", defineTrigger);
document.Reactions.define("define-reaction-rule", defineReactionRule);
document.Reactions.define("define-trigger-rule", defineTriggerRule);
document.Reactions.defineRule("wait_", wait_);
document.Reactions.define("prevent-default", i => (eventLoop.event.preventDefault(), i));
document.Reactions.define("log", function (...i) { console.log(this, ...i); return i[0]; });
document.Reactions.define("debugger", function (...i) { console.log(this, ...i); debugger; return i[0]; });

loadDoubleDots(EventTarget.prototype.addEventListener);
//adding colors