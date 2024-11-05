# `:define`

## Syntax

The main, regular `:define` syntax is:
1. reaction: `?reaction`
2. trigger: `?Trigger`
3. reactionRule: `reaction~`. Examples: `ol.~`, `el.~`, and `--~`(dash rule).
4. triggerRule: `Trigger~`. Examples: `timeout_~` => `timeout_123:` and `observeAttr_~` => `observe-attr_class:`.

The portal `:define` syntax is:
1. `TRIGGER`: trigger and reaction with the same name. `&NAV` equals `&Nav&nav` in regular syntax.
2. `TRIGGER_~`: triggerRule and reactionRule with the same name.
3. `TRIGGER~~`: trigger, triggerRule, reaction, and reactionRule with the same name. Default divider for the rules are `_`. If you add a character after `~~`, then this is the divider; The divider in `TRIGGER~~.` is `.`. Example: `STATE~~` => `State&State_~&state&state_~`.

* "camelCase" means reaction. converted into kebab-case for reaction name.
* "PascalCase" means trigger. First letter is lowercased, then converted into kebab-case for trigger name.
* Trailing `~` means rule.
* "UPPER_SNAKE" means portal.
* portal syntax is optional. You can define all portals using multiple regular syntax values.

### implementation 

1. split the name using `~`. If the result has length 1, it is not a rule; length is 2, then rule; length 3, quadrant rule. The 
1. UPPER_SNAKE is recognized by first *two* letters being uppercase: `/[_.-]*[A-Z]{2}/`
2. then, camelCase is recognized by first letter being lowercase: `/[_.-]*[a-z]/`
3. then, PascalCase is recognized  by first letter being uppercase and the second letter being lowercase: `/[_.-]*[A-Z]/`.

First, the UPPER_SNAKE is converted to PascalCase. Then reaction name is extracted by lowerCasing the first letter. `_` before name, before another `_` character, and after the name are ignored.

If the TriggerName is a The TriggerName is first converted from UPPER_SNAKE to PascalCase. Then the reactionName is converted to camelCase.

The reaction name is the same as the trigger name. The reaction definition (value) name is the same as the trigger definiton name (but with the first letter in lower case).

## Portal race condition

If the portal reaction (inputs) are set up, while the system still waits for the portal triggers (outputs) to be set up, then the portal reactions will be called, they will try to pass the output into the portals, but as there are no outpus yet, then the things will be passed into a portal that has no backend, thus causing the things to simply vanish in the aether/thin air. Classic adventure literature problem.

Therefore, **all portals** must be defined **Trigger first, reaction last**.

When the portal shortcut syntax is used in `:define`, then this order of upgrade Trigger first, reaction last, is ensured. (todo ensure that this happens with triggerRules as well, that they completely run before the simple reactions are upgraded.)

## Sync portal race condition 

the race condition can occur if Portals are set up sync:
```html
<script>
  const attrs = new DoubleDots.AttrWeakSet();
  class Portal extends AttrCustom {
    upgrade() { attrs.add(this); }
  }
  
  function portal(data) {
    const e = new Event("portal");
    e.data = data;
    eventLoop.dispatchBatch(e, [...attrs]);
  }
  document.Reactions.define("portal", portal);
  document.Triggers.define("portal", Portal);
  document.Reactions.define("some-data", _ => ({hello: "sunshine"}));
  document.Reactions.define("log", console.log);
</script>
<ol _:some-data:portal>
  <li portal:log>hello</li>
</ol>
```

This will cause the `some-data` reaction to fire immediately, *before* the subsequence `<li>` and its `portal:log` have been discovered by the browser's parser, and therefore the `{hello:"sunshine"}` is sent into a portal that has no end and is lost into nothingness.