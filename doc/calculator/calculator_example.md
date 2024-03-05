# Demo: How to build a calculator

## 1. Template first

In this example we implement doubledots on a classic calculator. We start with the pure, normal html template and lay it out:

```html
only the calculator, link to the css, table, no custom reaction nor script
```

## 2. Add first reaction

The first reaciton is to add numbers to the input, when we click on a button inside the calculator. First, we do this by adding a the custom reaction `click:add_number` to the container parent that is the closest ancestor to all the elements involved.

```html
script with a very basic, gullable definition. No checks, just positive assumptions (that might error, often).
adding the `click:add_number` to the `<table>`
```

Problems: the reaction doesn't have a check. if you click something other than a number, we have errors.

## 3. add filter

How to fix this? we add a filter in the chain `click:is_number:add_number`

```html
add a filter function that returns the innerText as a number if the innerText is a number, else customReactions.break. 
adding the `click:is_number:add_number` to the `<table>`
```

## 4. add the operator function

Let's build the entire calculator. Here we need to explain the logic with the previous operator and the hidden result etc. Once the strategy is explained, just add the extra custom reaction definitions, and the custom reaction invocations on the `<table>` element.


```html
add a filter function that returns the innerText as a number if the innerText is a number, else customReactions.break. 
adding the `click:is_number:add_number` to the `<table>`
```

## 5. add the keypress functionality

With a calculator you want multiple events. Add reactions for keypress too.
