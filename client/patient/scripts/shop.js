let user = null;
const API_BASE = "http://localhost:5000/api/cart";
const PRODUCTS_ENDPOINT = "http://localhost:5000/api/products";

(() => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      user = JSON.parse(userData);
      const avatarEl = document.getElementById('userAvatar');
      if (avatarEl && user?.profilePic) {
        avatarEl.src = user.profilePic;
      }
    }
  } catch (e) {
    user = null;
  }
})();

const pageSize = 6;
let currentPage = 1;
let products = [];
let filteredProducts = [];
let isLoadingProducts = false;

// Render DaisyUI product cards
function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';
  if (isLoadingProducts) {
    grid.innerHTML = '<div class="col-span-full text-center text-secondary">Loading products...</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  if (!filteredProducts.length) {
    grid.innerHTML = '<div class="col-span-full text-center text-secondary">No products found.</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageProducts = filteredProducts.slice(start, end);

  pageProducts.forEach(prod => {
    const name = prod.productName || prod.name || 'Unnamed product';
    const description = prod.productDescription || prod.desc || '';
    const category = prod.category || 'General';
    const requiresPrescription = prod.prescriptionRequired ?? prod.prescription ?? false;
    const stock = Number.isFinite(prod.stock) ? prod.stock : 0;
    const price = Number(prod.price) || 0;
    const imageSrc = prod.imageUrl || prod.image || '/client/assets/images/product-placeholder.png';
    const disabled = stock <= 0 ? "opacity-50 pointer-events-none" : "";

    const card = document.createElement('div');
    card.className = `card card-bordered shadow-md bg-base-100 hover:scale-105 hover:shadow-xl transition-all duration-200 ${disabled}`;
    card.innerHTML = `
      <figure class="px-6 pt-6">
        <img src="${imageSrc}" alt="${name}" class="rounded-xl h-32 object-contain" />
      </figure>
      <div class="card-body items-start">
        <h2 class="card-title text-primary">${name}</h2>
        <p class="text-gray-500 mb-2">${description}</p>
        <div class="flex flex-wrap gap-2 mb-2">
          <span class="badge badge-success">${category}</span>
          ${requiresPrescription ? '<span class="badge badge-error">Prescription Required</span>' : ''}
          ${stock <= 0 ? '<span class="badge badge-warning">Out of Stock</span>' : ''}
        </div>
        <div class="font-bold text-lg text-accent mb-2">Ksh ${price.toLocaleString()}</div>
        <div class="card-actions w-full">
          <button class="btn btn-primary w-full transition-all duration-200" ${stock <= 0 ? 'disabled' : ''} data-add-cart>
            Add to Cart
          </button>
        </div>
      </div>
    `;
    const addBtn = card.querySelector('[data-add-cart]');
    if (addBtn) {
      addBtn.addEventListener('click', (evt) => handleAddToCart(evt.currentTarget, prod));
    }
    grid.appendChild(card);
  });
}

// Render DaisyUI pagination
function renderPagination() {
  const pag = document.getElementById('pagination');
  pag.innerHTML = '';
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-outline btn-sm ${i === currentPage ? 'btn-active btn-primary' : ''}`;
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderProducts();
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pag.appendChild(btn);
  }
}

async function loadProducts() {
  isLoadingProducts = true;
  renderProducts();
  try {
    // public product list — call backend directly (absolute origin)
    const res = await fetch(PRODUCTS_ENDPOINT, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) products = data;
    else if (Array.isArray(data?.products)) products = data.products;
    else products = [];
  } catch (err) {
    console.error("Failed to load products:", err);
    isLoadingProducts = false;
    products = [];
    filteredProducts = [];
    document.getElementById('productGrid').innerHTML =
      '<div class="col-span-full text-center text-error">Unable to load products. Check backend at http://localhost:5000 and CORS settings (see console).</div>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }
  filteredProducts = products;
  isLoadingProducts = false;
  currentPage = 1;
  renderProducts();
  renderPagination();
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', function () {
  const val = this.value.trim().toLowerCase();
  filteredProducts = products.filter(p =>
    (p.productName || p.name || '').toLowerCase().includes(val)
  );
  currentPage = 1;
  renderProducts();
  renderPagination();
});

// Category filter logic
document.querySelectorAll('.category-link').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const cat = this.getAttribute('data-category');
    filteredProducts = cat === "All medicines"
      ? products
      : products.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
    currentPage = 1;
    renderProducts();
    renderPagination();
  });
});

async function handleAddToCart(button, product) {
  if (!user || !user._id) {
    alert("Please log in first.");
    window.location.href = "/client/index.html";
    return;
  }
  // prefer MongoDB _id (ObjectId). Fall back to productId code only if _id missing.
  const productId = product._id || product.productId || product.id;
  if (!productId) return;

  const defaultText = button.textContent;
  button.disabled = true;
  button.textContent = "Adding...";
  try {
    const res = await fetch(`${API_BASE}/addcart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, quantity: 1 })
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      console.error("Add to cart failed", res.status, txt);
      throw new Error(`HTTP ${res.status}`);
    }
    button.textContent = "Added!";
    setTimeout(() => {
      button.textContent = defaultText;
      button.disabled = false;
    }, 1200);
  } catch (err) {
    console.error("Add to cart error", err);
    button.textContent = "Retry";
    setTimeout(() => {
      button.textContent = defaultText;
      button.disabled = false;
    }, 1500);
  }
}

loadProducts();