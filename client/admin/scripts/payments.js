// User profile:
(() => {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      const avatarEl = document.getElementById("userAvatar");
      if (avatarEl && user && user.profilePic) {
        avatarEl.src = user.profilePic;
        console.log("Loaded user avatar:", user.profilePic);
      } else {
        console.log("Avatar not set. user:", user, "avatarEl:", avatarEl);
      }
    }
  } catch (e) {
    console.log("Error loading avatar:", e);
  }
})();

// Fetch and render MPESA transactions for admin UI
(() => {
  const API_BASE = "http://localhost:5000/api/checkout";
  let payments = [];
  let filteredPayments = [];
  const pageSize = 8;
  let currentPage = 1;

  const byId = id => document.getElementById(id);

  async function fetchPayments() {
    try {
      const res = await fetch(`${API_BASE}/mpesa`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch payments');
      payments = await res.json();
      filteredPayments = Array.isArray(payments) ? payments.slice() : [];
      renderTable();
      renderPagination();
    } catch (err) {
      console.error('fetchPayments error', err);
      alert('Failed to load payments. Check console for details.');
    }
  }

  function renderTable() {
    const tbody = byId('paymentsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    const start = (currentPage - 1) * pageSize;
    const pagePayments = filteredPayments.slice(start, start + pageSize);

    pagePayments.forEach((p, idx) => {
      const status = (p.status || '').toString().toLowerCase();
      let statusColor = 'badge-warning';
      if (status === 'successful' || status === 'successful' || status === 'completed') statusColor = 'badge-success';
      if (status === 'failed') statusColor = 'badge-error';
      if (status === 'initiated' || status === 'pending') statusColor = 'badge-info';

      const displayUser = (p.userId && (p.userId.fullname || p.userId.email)) || (p.userId && p.userId.userId) || 'N/A';
      const txId = p.mpesaTransactionId || p.checkoutRequestId || p.checkoutId || p._id;
      const orderRef = (p.orderId && (p.orderId.orderId || p.orderId._id)) || 'N/A';
      const date = new Date(p.createdAt || p.updatedAt).toLocaleString();

      const tr = document.createElement('tr');
      tr.className = "cursor-pointer hover:bg-green-50 transition-all";
      tr.innerHTML = `
        <td>${txId}</td>
        <td>${displayUser}</td>
        <td>${orderRef}</td>
        <td>KES ${(p.amount || 0).toLocaleString()}</td>
        <td><span class="badge ${statusColor}">${p.status || 'N/A'}</span></td>
        <td>${date}</td>
      `;
      tr.onclick = () => openDetailsModal(start + idx);
      tbody.appendChild(tr);
    });
  }

  function openDetailsModal(idx) {
    const p = filteredPayments[idx];
    if (!p) return;
    const modalContent = byId('modalContent');
    modalContent.innerHTML = `
      <div class="mb-2 font-semibold">Transaction ID: <span class="text-primary">${p.mpesaTransactionId || p.checkoutRequestId || p.checkoutId || p._id}</span></div>
      <div class="mb-2 font-semibold">User: <span class="text-primary">${(p.userId && (p.userId.fullname || p.userId.email || p.userId.userId)) || 'N/A'}</span></div>
      <div class="mb-2 font-semibold">Order: <span class="text-primary">${(p.orderId && (p.orderId.orderId || '')).toString().toLowerCase()}</span></div>
      <div class="mb-2 font-semibold">Amount: <span class="text-success">KES ${(p.amount || 0).toLocaleString()}</span></div>
      <div class="mb-2 font-semibold">Status: <span class="badge ${p.status === 'successful' ? 'badge-success' : p.status === 'failed' ? 'badge-error' : 'badge-info'}">${p.status}</span></div>
      <div class="mb-2 font-semibold">Phone: <span class="text-primary">${p.phoneNumber || 'N/A'}</span></div>
      <div class="mb-2 font-semibold">MPESA Metadata:</div>
      <pre class="text-xs bg-gray-100 p-2 rounded">${JSON.stringify(p.mpesa || {}, null, 2)}</pre>
    `;
    byId('detailsModal')?.showModal();
  }

  byId('closeDetailsBtn')?.addEventListener('click', () => byId('detailsModal')?.close());

  // Search/filter logic
  byId('searchPayment')?.addEventListener('input', () => {
    const q = (byId('searchPayment').value || '').trim().toLowerCase();
    filteredPayments = payments.filter(p => {
      const txId = (p.mpesaTransactionId || p.checkoutRequestId || p.checkoutId || p._id || '').toString().toLowerCase();
      const user = ((p.userId && (p.userId.fullname || p.userId.email)) || '').toString().toLowerCase();
      const order = (p.orderId && (p.orderId.orderId || '')).toString().toLowerCase();
      const date = (p.createdAt || '').toString().toLowerCase();
      return !q || txId.includes(q) || user.includes(q) || order.includes(q) || date.includes(q);
    });
    currentPage = 1;
    renderTable();
    renderPagination();
  });

  function renderPagination() {
    const pag = byId('pagination');
    if (!pag) return;
    pag.innerHTML = '';
    const totalPages = Math.ceil(filteredPayments.length / pageSize);
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-outline btn-sm ${i === currentPage ? 'btn-active btn-primary' : ''}`;
      btn.textContent = i;
      btn.onclick = () => {
        currentPage = i;
        renderTable();
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      pag.appendChild(btn);
    }
  }

  // initial load
  fetchPayments();
})();