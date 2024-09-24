# DoubleDouts

The re-discovery of HTML


## How to run tests

1. In a terminal, do as follows:
```bash
npx http-server -p 3000 --cors -S -C test/cert.pem -K test/key.pem
```

2. Then open in [https://127.0.0.1:3000/test](https://127.0.0.1:3000/test) your browser.

## `cdn.jsdelivr.net`

### link to the framework

```
https://cdn.jsdelivr.net/combine/
gh/orstavik/doubledots@a.2/src/1_1_DoubleDots.js,
gh/orstavik/doubledots@a.2/src/1_2_AttrCustom.js,
gh/orstavik/doubledots@a.2/src/3_definition_registers_v4.js,
gh/orstavik/doubledots@a.2/src/4_eventLoop_v2.js,
gh/orstavik/doubledots@a.2/src/6_load_DoubleDots.js,
gh/orstavik/doubledots@a.2/src/7_nativeMethods.js,
gh/orstavik/doubledots@a.2/src/triggers/PropagationSimple.js,
```
=> 
```
https://cdn.jsdelivr.net/combine/gh/orstavik/doubledots@a.2/src/1_1_DoubleDots.js,gh/orstavik/doubledots@a.2/src/1_2_AttrCustom.js,gh/orstavik/doubledots@a.2/src/3_definition_registers_v4.js,gh/orstavik/doubledots@a.2/src/4_eventLoop_v2.js,gh/orstavik/doubledots@a.2/src/6_load_DoubleDots.js,gh/orstavik/doubledots@a.2/src/7_nativeMethods.js,gh/orstavik/doubledots@a.2/src/triggers/PropagationSimple.js
```

### link to render testing 

```
https://cdn.jsdelivr.net/combine/
gh/orstavik/doubledots@a.2/src/triggers/Render_p.js,
gh/orstavik/doubledots@a.2/test_render/tools.js,
gh/orstavik/doubledots@a.2/test_render/brace.js,
gh/orstavik/doubledots@a.2/test_render/tloop.js
```

```
https://cdn.jsdelivr.net/combine/gh/orstavik/doubledots@a.2/src/triggers/Render_p.js,gh/orstavik/doubledots@a.2/test_render/tools.js,gh/orstavik/doubledots@a.2/test_render/brace.js,gh/orstavik/doubledots@a.2/test_render/tloop.js
```