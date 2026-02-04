const cart = {};

 

const foodButtons = document.querySelectorAll(".food-item .cart-btn");

const navCart = document.querySelector(".nav-cart");

const cartDropdown = document.getElementById("cart-dropdown");

const cartItems = document.getElementById("cart-items");

const cartCount = document.getElementById("cart-count");

const emptyCart = document.querySelector(".empty-cart");

 

// Add to cart

foodButtons.forEach(btn => {

  btn.addEventListener("click", () => {

    const name = btn.dataset.name;

    const price = btn.dataset.price;

 

    if (cart[name]) {

      cart[name].qty += 1;

    } else {

      cart[name] = { price, qty: 1 };

    }

 

    updateCartCount();

    renderCart();

  });

});

 

// Toggle dropdown

navCart.addEventListener("click", () => {

  cartDropdown.style.display =

    cartDropdown.style.display === "block" ? "none" : "block";

});

 

// Update count

function updateCartCount() {

  let total = 0;

  Object.values(cart).forEach(item => total += item.qty);

  cartCount.textContent = total;

}

 

// Render items

function renderCart() {

  cartItems.innerHTML = "";

 

  const items = Object.keys(cart);

 

  if (items.length === 0) {

    emptyCart.style.display = "block";

    return;

  }

 

  emptyCart.style.display = "none";

 

  items.forEach(name => {

    cartItems.innerHTML += `

      <li>${name} × ${cart[name].qty}</li>

    `;

  });

}










// const cart = {};

 

// const foodCartButtons = document.querySelectorAll(".food-item .cart-btn");

// const navCartButton = document.querySelector(".nav-cart");

 

// const cartCount = document.getElementById("cart-count");

// const cartPanel = document.getElementById("cart-panel");

// const cartItems = document.getElementById("cart-items");

// const closeCart = document.getElementById("close-cart");

 

// // Add items

// foodCartButtons.forEach(btn => {

//   btn.addEventListener("click", () => {

//     const name = btn.getAttribute("data-name");

//     const price = btn.getAttribute("data-price");

 

//     if (cart[name]) {

//       cart[name].quantity += 1;

//     } else {

//       cart[name] = { price, quantity: 1 };

//     }

 

//     updateCartCount();

//   });

// });

 

// // Update cart count

// function updateCartCount() {

//   let total = 0;

//   Object.values(cart).forEach(item => total += item.quantity);

//   cartCount.textContent = total;

// }

 

// // Open cart

// navCartButton.addEventListener("click", () => {

//   renderCart();

//   cartPanel.style.display = "block";

// });

 

// // Close cart

// closeCart.addEventListener("click", () => {

//   cartPanel.style.display = "none";

// });

 

// // Render cart items

// function renderCart() {

//   cartItems.innerHTML = "";

 

//   for (let item in cart) {

//     cartItems.innerHTML += `

//       <li>

//         ${item} × ${cart[item].quantity}

//       </li>

//     `;

//   }

 

//   if (cartItems.innerHTML === "") {

//     cartItems.innerHTML = "<li>Your cart is empty</li>";

//   }

// }

 