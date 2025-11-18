// Cart logic for fetching and updating cart from backend

const API_BASE = "http://localhost:5000/api/cart";
const deliveryFee = 150;

let cart = [];
let user = null;

// Get logged in user from localStorage
try {
  const userData = localStorage.getItem('user');
  if (userData) user = JSON.parse(userData);
} catch (e) {
  user = null;
}

function setUserAvatar() {
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl && user?.profilePic) {
    avatarEl.src = user.profilePic;
  }
}

async function fetchCart() {
  if (!user || !user._id) {
    cart = [];
    renderCart();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/getCart/${user._id}`, {
      credentials: "include"
    });
    if (res.status === 401) {
      cart = [];
    } else if (res.ok) {
      const data = await res.json();
      cart = data
        .filter(item => item?.productId)
        .map(item => ({
          _id: item._id,
          cartId: item.cartId,
          // prefer product ObjectId and keep product code for reference
          productId: item.productId._id || item.productId.productId,
          productCode: item.productId.productId,
          name: item.productId.productName,
          price: item.productId.price,
          image: item.productId.imageUrl,
          qty: item.quantity
        }));
    } else {
      cart = [];
    }
  } catch (e) {
    cart = [];
  }
  renderCart();
}

async function updateCartItem(idx, newQty) {
  const item = cart[idx];
  if (!item || !item._id) return;
  try {
    await fetch(`${API_BASE}/updatecart/${item._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity: newQty })
    });
    cart[idx].qty = newQty;
    renderCart();
  } catch (e) {}
}

async function removeCartItem(idx) {
  const item = cart[idx];
  if (!item || !item._id) return;
  try {
    await fetch(`${API_BASE}/deletecart/${item._id}`, {
      method: "DELETE",
      credentials: "include"
    });
    cart.splice(idx, 1);
    renderCart();
  } catch (e) {}
}

function renderCart() {
  const cartItemsDiv = document.getElementById('cartItems');
  const cartContentDiv = document.getElementById('cartContent');
  const cartEmptyDiv = document.getElementById('cartEmpty');
  cartItemsDiv.innerHTML = '';

  if (cart.length === 0) {
    cartContentDiv.classList.add('hidden');
    cartEmptyDiv.classList.remove('hidden');
    updateSummary();
    return;
  } else {
    cartContentDiv.classList.remove('hidden');
    cartEmptyDiv.classList.add('hidden');
  }

  cart.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = "card card-bordered flex flex-row items-center gap-4 p-4 shadow transition-all duration-200";
    card.innerHTML = `
      <div class="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary flex-shrink-0">
        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
      </div>
      <div class="flex-1 flex flex-col gap-1">
        <div class="font-bold text-lg text-primary">${item.name}</div>
        <div class="text-base text-gray-500">Ksh ${item.price.toLocaleString()}</div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-sm btn-outline join-item" aria-label="Decrease" data-idx="${idx}" data-action="dec">-</button>
        <input type="number" min="1" value="${item.qty}" class="input input-bordered w-20 text-center join-item" data-idx="${idx}" />
        <button class="btn btn-sm btn-outline join-item" aria-label="Increase" data-idx="${idx}" data-action="inc">+</button>
      </div>
      <div class="ml-4">
        <button class="btn btn-error btn-sm transition-all duration-200" aria-label="Remove" data-idx="${idx}">Remove</button>
      </div>
    `;
    cartItemsDiv.appendChild(card);
  });

  // Quantity controls
  cartItemsDiv.querySelectorAll('button[data-action]').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      if (this.getAttribute('data-action') === 'dec') {
        if (cart[idx].qty > 1) {
          updateCartItem(idx, cart[idx].qty - 1);
        }
      } else {
        updateCartItem(idx, cart[idx].qty + 1);
      }
    };
  });
  cartItemsDiv.querySelectorAll('input[type="number"]').forEach(input => {
    input.onchange = function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      let val = parseInt(this.value);
      if (isNaN(val) || val < 1) val = 1;
      updateCartItem(idx, val);
    };
  });
  cartItemsDiv.querySelectorAll('button.btn-error').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.getAttribute('data-idx'));
      removeCartItem(idx);
    };
  });

  updateSummary();
}

function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  document.getElementById('subtotal').textContent = `Ksh ${subtotal.toLocaleString()}`;
  document.getElementById('deliveryFee').textContent = `Ksh ${cart.length > 0 ? deliveryFee : 0}`;
  document.getElementById('total').textContent = `Ksh ${(cart.length > 0 ? subtotal + deliveryFee : 0).toLocaleString()}`;
  document.getElementById('checkoutBtn').classList.toggle('btn-disabled', cart.length === 0);
}

// Initial setup
setUserAvatar();
fetchCart();