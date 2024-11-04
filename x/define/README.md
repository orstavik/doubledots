## Url definition syntax

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

## Regular `:define` syntax

We have the `:define` syntax. Here, we need to be able to quickly write:
1. reaction: `?reaction`
2. trigger: `?Trigger`
3. reactionRule: `~Reaction`. Usecases are `~ol.`, `~el.`, and `~-`(dash).
4. triggerRule: `~Trigger`. Usecases are `timeout_123:`, `mutation_attr:`.

### Portal shortcut syntax

The reaction name is the same as the trigger name. The reaction definition (value) name is the same as the trigger definiton name (but with the first letter in lower case).

1. `Trigger~` with same name reaction.
2. `Trigger~_` with reactionRule.
3. `~Trigger_~` TriggerRule with plain reaction. The reaction `name = triggerName.slice(0,-1)`.
4. `~Trigger_~_` TriggerRule and ReactionRule. ReactionRule `name = triggerName.slice(0,-1) + divider`.

Portal shortcut syntax is basically converted to regular `:define` syntax like this.

1. `Portal~` => `Portal&portal`
2. `Portal~_` => `Portal&~portal_`
3. `~Portal_~` => `~Portal_&portal`
4. `~Portal_~_` => `~Portal_&~portal_`

* If you need other portals with other combinations, just define them manually in full regular `:define` format: `Portal&~Portal_&portal&~portal_`. Att! Remember to always define the Triggers first, and reactions last.