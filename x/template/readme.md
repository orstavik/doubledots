## The purpose of `template:`

is to wrap `.childNodes` into a `<template>` element runTime. It *essentially* and *only* injects `<template>` and `</template>` elements into the DOM. If you want, you *can absolutely* just write `<template>` tags in your code immediatly. And skip `template:` all together.

So, why use `template:`? The reason is that `<template>` will change the structure of the DOM designTime vs runTime. In other words, if you use `<template>` in your code, you will see *this* in VSCode:

```html
<h1>VirtualDOM reality</h1>
<ol do:loop="item in items">
  <template>
    <li>{{item}}</li>
```
while with `template:` you will see *this* in VSCode:
```html
<h1>CSSOM reality</h1>
<ol do:loop="item in items" template:>
  <li>{{item}}</li>
```

These two views represent two different realities: VirtualDom vs CSSOM reality. 

The VirtualDOM reality comes first. This reality represents the structure of the DOM at **renderTime**. **renderTime** is when the template engine runs and takes a) JSON object and b) a virtual DOM, and then use methods called something like `reuseElement()`, `cloneNode(true)`, `removeNoLongerNeededElements()` etc. to update the DOM to the new state in the JSON. In actuality, you *only really need* to inject some `<template>` and `</template>` tags to make such a fully function html description of a virtual DOM. So VirtualDOM reality is *essentially* just the "end" HTML description with some injected `<template>` tags.

The fact that you *only* need to inject `<template>` tags in your DOM to go from a *fully functional, end HTML description, DOM ready* model, would speak volumes for *staying KISS* and *just use `<template>` tags*. So, again, why `template:`?.

The problem `<template>` tag needs to be injected *between* parent and child element in the HTML/DOM structure. Sometimes this is "a ok". Some parent-child relationships in HTML/CSS can be replaced with a descendant-relationship, no problem: `<form> <input>`, `<a href>`, `position:relative/absolute` work just as well parent-descendant as parent-child. But. *Not all*! *Many* HTML and CSS relationships are exclusively parent-child. Sacred. For example, in CSS, the `grid` layout model only works between parent-child, *not* parent-descendant. In HTML, `<li>`s are *only* numbered as the direct child of `<ol>`. In fact, *lots* of HTML, CSS, and web component logic *only* work between parent-child.

Support for, recognition of, and illustration of such parent-child relationships are built into both the browsers' runTime and many IDEs' tooling. But, and more importantly, support for recognizing and working with such parent-child relationships are built into *your* developer mind. When you read and process HTML, you *will need to use compute resources* to mentaly transform `<ol><template><li>` structures into `<ol><li>` structures. And to remember this when jumping between files and upto style tags etc. If you have many, it can be taxing. Wast of *your most precious* compute resource.

This is the *usecase* of `template:`. The `template:` is an alternativ to *injecting* `<template>` tags in your (vs)code designTime, a way to make `<template>` tags go avoid. And *only* that. Nothing else.

> But but! `template:` is completely optional. You can use `<template>` if you want, and see your HTML code the way the template engine sees it. In fact, we recommend that you do that, and that you switch between `<template>` and `template:` in your HTML code so that you can see the HTML both from the VirtualDOM perspective and CSSOM perspective, **renderTime** and **end cssom runTime**.

## `template:` is reaction-less

The `template:` cannot have any reactions. The reason for this is that the `template:` should not dispatch an event, but *only* mutate the DOM during the construction (`upgrade()`) process. Therefore, reactions would never be triggered, and their precense only confuse. Secondly, `template:` needs to search for similar reactions inside the `.ownerElement` and subsume them. This should happen *before* any other triggers are called, and to find these triggers a simple search for `template:` without any trigger names would be easier.

## `template:` and dynamic `setAttributeMode`

There are three ways that a custom attribute (ie. trigger) can be added to the DOM.
1. As part of an **element tag** when HTML template code is added in the main .html document, or via `innerHTML` or `insertAdjacentHTML`;
2. As part of an **element object** when such an object is added from a `<template>.content` object; or
3. As an isolated attribute using `setAttribute()` added to an already existing element.

When the attribute is added in isolation, all custom attributes on the child elements within the `.ownerElement` have already been instantiated; when the attribute is added as part of an element tag or object, all the attributes on child elements of the `.ownerElement` has not yet been instantiated.

This matters for `template:`. When the attribute is added as part of HTML template code or an HTML `<template>.content` object added from a  The attribute is added during template setting mode. The attribute/trigger is added via `setAttribute()`. 

## `<!--tempate-->` and `<!--/template>`

Inside the `:template`.ownerElement descendants, we can have commented `<!--template-->` and `<!--/template>` tags. These tags are essentially start and end `<template></template>` tags that are converted into `<!--template--><!--/template-->` tags.

The end tag is optional. If it is missing, the `<!--template-->` tag will be converted into a `<template>` tag that wraps all the following siblings until the end of the `.ownerElement`.

~~The template can also be defined inside a `<!--template-->` and `<!--/template>` comment tags. This is a way to wrap only some `.childNodes` into a `<template>` element, while leaving some other `childNodes` unaffected. This is useful when you need to wrap for example two lists of `<li>` items inside the same `<ol>` element. Or when you need to add a `<th>` separated from the `<td>` inside a `<tr>`.~~

## still draft stage 

## Implementation:

have this  then the DOM will have a `<template>` element in it. But if you use `template:`, then the DOM will not have a `<template>` element in it.

 and the `<!-- startTxt {-->` and ``<!--} endTxt-->`


1. The root `template:` or `template:="startTxt"` triggers.
2. Wraps *all* `.childNodes` into a `<template start="startTxt">`. There is no room for end=txt attribute here. This is a weakness.
3. Then it will recursively seek all the template: attributes and then turn all their children into templates. It will do so upside down using a [... querySA('[template\\:]')]. And then ritar it. While at the same time putting all the templates in an array treeOrder.

4. Then it will run through each template and look for comment templates. The algo here is as most recent:
   1. startComment.endsWith("{"). the text is the `start=txt` on the template. 
   2. endComment.startsWith("}"). the text is the `end=txt` on the template.
   3. noMoreSiblings is also endComment.
5. We need a test function that prints the dom, with the .content of the template as the templates children. First, move all the .content to childNodes. Then print outerHtml.

## old

//template: and :template => trigger-reaction pair for extracting and retrieving the childNodes as a template. templatet: is an alternative to template: that will not re-interpret the html-nodes, but it *can only be added in html template text, not via setAttribute() from js*. To implement this, we could add a parameter to upgrade that says what context the current upgrade is called from. It is easy to add such an argument for the simple case when .setAttribute() is done via js.
