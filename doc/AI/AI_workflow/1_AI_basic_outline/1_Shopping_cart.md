## Shopping Cart with Doubledots

Here's an example of a shopping cart with add-to-cart functionality using Doubledots:

**1. Template:**

```html
<div id="shopping-cart">
  <h2>Shopping Cart</h2>
  <ul id="cart-items"></ul>
  <button click:show-products>Browse Products</button>
  <div id="products" style="display: none;">
    </div>
</div>
```

This template defines the shopping cart section with a list for displaying cart items, a button to show products, and a hidden section for displaying product details.

**2. Breakdown of Functionality:**

* Clicking the "Browse Products" button should show the product list section.
* Clicking the "Add to Cart" button on a product should add the product information to the cart list.

**3. Reactions and Attributes:**

* `show-products`: This reaction will toggle the visibility of the product list section.
* `add-to-cart`: This reaction will add product information to the cart list when the "Add to Cart" button is clicked.

**4. Putting it Together:**

```html
<div id="shopping-cart">
  <h2>Shopping Cart</h2>
  <ul id="cart-items"></ul>
  <button click:show-products>Browse Products</button>
  <div id="products" style="display: none;">
    <article click:add-to-cart="data-product-id">
      <button>Add to Cart</button>
    </article>
    </div>
</div>

<script>
  customReactions.define('show-products', (e, oi) => {
    const products = document.getElementById('products');
    products.style.display = products.style.display === 'none' ? 'block' : 'none';
  });

  customReactions.define('add-to-cart', (e, productId) => {
    const cartItems = document.getElementById('cart-items');
    // Get product information based on productId (logic not shown here)
    const productInfo = getProductInfo(productId);
    // Create a list item for the cart
    const cartItem = document.createElement('li');
    cartItem.innerText = `${productInfo.name} - ${productInfo.price}`;
    cartItems.appendChild(cartItem);
  });
</script>
```

**Explanation:**

* We define two custom reactions: `show-products` and `add-to-cart`.
* The `show-products` reaction toggles the visibility of the product list section.
* The `add-to-cart` reaction takes the product ID from the clicked button's `data-product-id` attribute.
* It retrieves product information using the `getProductInfo` function (not shown here, should fetch details based on ID).
* It creates a list item with product name and price and appends it to the cart list.

**5. Enhancements:**

* You can add functionalities like quantity selection, product removal from the cart, and displaying the total price.
* Implement the `getProductInfo` function to retrieve product details based on the provided ID.
* You can improve the styling of the cart and product list.

This is a basic example showcasing Doubledots functionalities for adding items to a shopping cart. You can extend it further based on your specific needs.
