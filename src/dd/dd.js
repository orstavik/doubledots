import { } from "./1_DoubleDots.js";
import { } from "./2_AttrCustom.js";
import { } from "./3_definition_registers_v4.js";
import { } from "./4_eventLoop_v2.js";
import { loadDoubleDots } from "./5_load_DoubleDots.js";
import { define } from "../../x/define/v1.js";
import { Template, template } from "../../x/template/v1.js";
import { wait_ } from "../../x/wait/v1.js";

document.Triggers.define("template", Template);
document.Reactions.define("template", template);
document.Reactions.define("define", define);
document.Reactions.defineRule("wait_", wait_);
document.Reactions.define("prevent-default",
  i => (eventLoop.event.preventDefault(), i));

loadDoubleDots(EventTarget.prototype.addEventListener);
