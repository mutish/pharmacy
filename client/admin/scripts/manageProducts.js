// Frontend logic: fetch products, add product, update product
(() => {
  const API_BASE = "http://localhost:5000/api/products";

  let products = [];
  let filteredProducts = [];
  const pageSize = 8;
  let currentPage = 1;
  let editIdx = null;
  let bulkSelected = [];

  // DOM helpers
  const byId = id => document.getElementById(id);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_BASE}/allproducts`, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch products');
      products = await res.json();
      if (!Array.isArray(products)) products = Array.isArray(products.products) ? products.products : [];
      filteredProducts = products.slice();
      renderStats();
      renderTable();
      renderPagination();
    } catch (err) {
      console.error("fetchProducts error", err);
      alert("Failed to load products. Check console for details.");
    }
  }

  function renderStats() {
    byId('totalCount') && (byId('totalCount').textContent = products.length || 0);
    byId('outStockCount') && (byId('outStockCount').textContent = products.filter(p => p.stock <= 0 || p.status === "Out of Stock").length);
    byId('prescriptionCount') && (byId('prescriptionCount').textContent = products.filter(p => p.prescriptionRequired || p.prescription === "Yes").length);
  }

  function renderTable() {
    const tbody = byId('productsTable') || byId('productsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const start = (currentPage - 1) * pageSize;
    const pageProducts = filteredProducts.slice(start, start + pageSize);

    pageProducts.forEach((product, idx) => {
      const tr = document.createElement('tr');
      const price = product.price != null ? `KES ${Number(product.price).toLocaleString()}` : '—';
      const prescription = product.prescriptionRequired ? 'Yes' : 'No';
      const mfg = product.mfgDate ? new Date(product.mfgDate).toLocaleDateString() : '';
      const exp = product.expDate ? new Date(product.expDate).toLocaleDateString() : '';
      tr.innerHTML = `
        <td><input type="checkbox" class="bulkSelect" data-idx="${start + idx}" /></td>
        <td>${product.productId || product.id || ''}</td>
        <td><img src="${product.imageUrl || product.image || '/client/assets/images/paracetamol.jpg'}" alt="${product.productName || product.name || ''}" width="48" height="48" class="rounded" /></td>
        <td>${product.productName || product.name || ''}</td>
        <td class="small text-muted">${product.productDescription || ''}</td>
        <td>${product.category || ''}</td>
        <td>${price}</td>
        <td>${product.stock != null ? product.stock : ''}</td>
        <td>${mfg}</td>
        <td>${exp}</td>
        <td>${prescription}</td>
        <td>
          <button class="btn btn-xs btn-outline btn-success edit-btn" data-idx="${start + idx}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-xs btn-outline btn-error delete-btn ms-2" data-idx="${start + idx}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach edit handlers
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.onclick = () => {
        editIdx = Number(btn.getAttribute('data-idx'));
        openEditProductModal(editIdx);
      };
    });
    // Attach delete handlers
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => {
        const idx = Number(btn.getAttribute('data-idx'));
        const product = products[idx];
        if (!product) return alert('Product not found');
        if (!confirm(`Delete product "${product.productName}"?`)) return;
        try {
          const res = await fetch(`http://localhost:5000/api/products/delete/${product.productId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || data?.message || 'Delete failed');
          // refresh list
          await fetchProducts();
        } catch (err) {
          console.error('Delete product failed', err);
          alert('Failed to delete product: ' + (err.message || err));
        }
      };
    });

    // Bulk select logic
    tbody.querySelectorAll('.bulkSelect').forEach(box => {
      box.onchange = function() {
        const idx = parseInt(this.getAttribute('data-idx'));
        if (this.checked) {
          if (!bulkSelected.includes(idx)) bulkSelected.push(idx);
        } else {
          bulkSelected = bulkSelected.filter(i => i !== idx);
        }
      };
    });
    const bulkAll = byId('bulkSelectAll');
    if (bulkAll) {
      bulkAll.onchange = function() {
        const checked = this.checked;
        tbody.querySelectorAll('.bulkSelect').forEach(box => {
          box.checked = checked;
          box.onchange();
        });
      };
    }
  }

  function renderPagination() {
    const pag = byId('pagination');
    if (!pag) return;
    pag.innerHTML = '';
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
      const b = document.createElement('button');
      b.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline'}`;
      b.textContent = i;
      b.onclick = () => { currentPage = i; renderTable(); renderPagination(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
      pag.appendChild(b);
    }
  }

  // Filter/search
  const searchInput = byId('searchProduct');
  const categoryFilter = byId('categoryFilter');
  if (searchInput) searchInput.addEventListener('input', filterProducts);
  if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);

  function filterProducts() {
    const search = (searchInput?.value || '').trim().toLowerCase();
    const cat = categoryFilter?.value || '';
    filteredProducts = products.filter(p =>
      (!search || (p.productName || p.name || '').toString().toLowerCase().includes(search) || (p.category || '').toString().toLowerCase().includes(search)) &&
      (!cat || p.category === cat)
    );
    currentPage = 1;
    renderStats();
    renderTable();
    renderPagination();
  }

  // Edit product modal helpers (assumes IDs from HTML exist)
  function openEditProductModal(idx) {
    const product = products[idx];
    if (!product) return alert('Product not found');
    byId('editName') && (byId('editName').value = product.productName || product.name || '');
    byId('editCategory') && (byId('editCategory').value = product.category || '');
    byId('editPrice') && (byId('editPrice').value = product.price != null ? product.price : '');
    byId('editStock') && (byId('editStock').value = product.stock != null ? product.stock : '');
    byId('editPrescription') && (byId('editPrescription').value = (product.prescriptionRequired || product.prescription === "Yes") ? 'Yes' : 'No');
    byId('editStatus') && (byId('editStatus').value = product.status || 'Active');
    // show modal
    const dlg = byId('editProductModal');
    dlg && dlg.showModal && dlg.showModal();
  }

  // Save edited product (PUT price & stock as backend expects)
  byId('saveEditProductBtn')?.addEventListener('click', async () => {
    if (editIdx == null) return;
    const product = products[editIdx];
    if (!product) return;
    const price = Number(byId('editPrice').value);
    const stock = Number(byId('editStock').value);
    try {
      const res = await fetch(`${API_BASE}/update/${product.productId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, stock })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Update failed');
      // update local product and refresh
      await fetchProducts();
      byId('editProductModal')?.close();
    } catch (err) {
      console.error('Update product failed', err);
      alert('Failed to update product: ' + (err.message || err));
    }
  });

  byId('cancelEditProductBtn')?.addEventListener('click', () => byId('editProductModal')?.close());

  // Add product flow
  byId('addProductBtn')?.addEventListener('click', () => {
    // clear add modal inputs if present
    ['addName','addCategory','addDescription','addImage','addMfgDate','addExpDate','addPrice','addStock','addPrescription','addStatus'].forEach(id => { const el = byId(id); if (el) el.value = ''; });
    byId('addName') && (byId('addName').value = '');
    byId('addCategory') && (byId('addCategory').value = '');
    byId('addDescription') && (byId('addDescription').value = '');
    byId('addImage') && (byId('addImage').value = '');
    byId('addMfgDate') && (byId('addMfgDate').value = new Date().toISOString().split('T')[0]);
    byId('addExpDate') && (byId('addExpDate').value = new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
    byId('addPrice') && (byId('addPrice').value = '');
    byId('addStock') && (byId('addStock').value = '');
    byId('addPrescription') && (byId('addPrescription').value = 'No');
    byId('addStatus') && (byId('addStatus').value = 'Active');
    byId('addProductModal')?.showModal();
  });

  byId('saveAddProductBtn')?.addEventListener('click', async () => {
    const productName = byId('addName')?.value?.trim();
    const productDescription = byId('addDescription')?.value?.trim() || '';
    const category = byId('addCategory')?.value?.trim();
    const price = Number(byId('addPrice')?.value || 0);
    const stock = Number(byId('addStock')?.value || 0);
    const mfgDate = byId('addMfgDate')?.value || new Date().toISOString();
    const expDate = byId('addExpDate')?.value || new Date(Date.now() + 365*24*60*60*1000).toISOString();
    const prescriptionRequired = (byId('addPrescription')?.value === 'Yes');

    if (!productName || !category || isNaN(price) || isNaN(stock)) {
      return alert('Please provide product name, category, price and stock.');
    }

    // Send to backend (server will handle image/placeholder)
    try {
      const payload = {
        productName,
        productDescription,
        category,
        price,
        stock,
        mfgDate,
        expDate,
        prescriptionRequired
        // imageUrl optional
      };
      const res = await fetch(`${API_BASE}/add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Create failed');
      await fetchProducts();
      byId('addProductModal')?.close();
    } catch (err) {
      console.error('Add product failed', err);
      alert('Failed to add product: ' + (err.message || err));
    }
  });

  byId('cancelAddProductBtn')?.addEventListener('click', () => byId('addProductModal')?.close());

  // Initial load
  fetchProducts();

})();
