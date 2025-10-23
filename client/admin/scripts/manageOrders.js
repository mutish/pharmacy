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

(() => {
  const API_BASE = "http://localhost:5000/api/orders";
  let orders = [];
  let filteredOrders = [];
  const pageSize = 8;
  let currentPage = 1;

  const byId = (id) => document.getElementById(id);

  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/allorders`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      orders = await res.json();
      if (!Array.isArray(orders))
        orders = Array.isArray(orders.orders) ? orders.orders : [];
      filteredOrders = orders.slice();
      renderStats();
      renderTable();
      renderPagination();
    } catch (err) {
      console.error("fetchOrders error", err);
      alert("Failed to load orders. Check console for details.");
    }
  }

  function renderStats() {
    byId("totalOrders") &&
      (byId("totalOrders").textContent = orders.length || 0);
    byId("pendingOrders") &&
      (byId("pendingOrders").textContent = orders.filter((o) =>
        ["placed", "processing", "shipped"].includes(
          (o.status || o.orderStatus || "").toLowerCase()
        )
      ).length);
    byId("completedOrders") &&
      (byId("completedOrders").textContent = orders.filter(
        (o) => (o.status || "").toLowerCase() === "delivered"
      ).length);
    byId("cancelledOrders") &&
      (byId("cancelledOrders").textContent = orders.filter(
        (o) => (o.status || "").toLowerCase() === "cancelled"
      ).length);
  }

  function renderTable() {
    const tbody = byId("ordersTable");
    if (!tbody) return;
    tbody.innerHTML = "";
    const start = (currentPage - 1) * pageSize;
    const pageOrders = filteredOrders.slice(start, start + pageSize);

    pageOrders.forEach((order, idx) => {
      const payment = (order.paymentStatus || order.payment || "").toString();
      const paymentBadge =
        payment.toLowerCase() === "completed"
          ? '<span class="badge badge-success">Completed</span>'
          : payment.toLowerCase() === "pending"
          ? '<span class="badge badge-warning">Pending</span>'
          : '<span class="badge badge-error">Failed</span>';

      const status = (order.status || order.orderStatus || "").toString();
      let statusColor = "badge-warning";
      if (status.toLowerCase() === "delivered") statusColor = "badge-success";
      if (status.toLowerCase() === "cancelled") statusColor = "badge-error";
      if (["processing", "shipped"].includes(status.toLowerCase()))
        statusColor = "badge-info";
      const statusBadge = `<span class="badge ${statusColor}">${status}</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order.orderId || order.id || ""}</td>
        <td>${
          (order.userId && (order.userId.fullname || order.userId.name)) ||
          order.customer ||
          "N/A"
        }</td>
        <td>KES ${(order.total || order.totalAmount || 0).toLocaleString()}</td>
        <td>${paymentBadge}</td>
        <td>${statusBadge}</td>
        <td>${new Date(
          order.createdAt || order.date || Date.now()
        ).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-xs btn-outline btn-info details-btn" data-idx="${
            start + idx
          }"><i class="fa-solid fa-eye"></i></button>
          <button class="btn btn-xs btn-outline btn-error request-cancel-btn ms-2" data-idx="${
            start + idx
          }">Cancel (by email)</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // attach handlers
    tbody.querySelectorAll(".details-btn").forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-idx"));
        openDetailsModal(idx);
      };
    });

    tbody.querySelectorAll(".request-cancel-btn").forEach((btn) => {
      btn.onclick = async () => {
        const idx = Number(btn.getAttribute("data-idx"));
        const order = orders[idx];
        if (!order) return alert("Order not found");
        // admin received an email from user asking to cancel; prompt for the email they received
        const requesterEmail = prompt(
          "Enter user email from their cancellation request (as received by email):"
        );
        if (!requesterEmail) return;
        try {
          const res = await fetch(`${API_BASE}/request-cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.orderId || order.id,
              email: requesterEmail,
            }),
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok)
            throw new Error(
              data?.error || data?.message || "Cancel request failed"
            );
          alert("Order cancelled per user request.");
          await fetchOrders();
        } catch (err) {
          console.error("Cancel by request failed", err);
          alert("Failed to cancel order: " + (err.message || err));
        }
      };
    });
  }

  function openDetailsModal(idx) {
    const o = orders[idx];
    if (!o) return alert("Order not found");
    const modalContent = byId("modalContent");
    if (!modalContent) return;
    modalContent.innerHTML = `
      <div class="mb-4">
        <div class="font-semibold">Order ID: <span class="text-primary">${
          o.orderId || o.id || ""
        }</span></div>
        <div class="font-semibold">Customer: <span class="text-primary">${
          (o.userId && (o.userId.fullname || o.userId.name)) ||
          o.customer ||
          "N/A"
        }</span></div>
        <div class="font-semibold">Date: <span class="text-primary">${new Date(
          o.createdAt || o.date || Date.now()
        ).toLocaleString()}</span></div>
        <div class="font-semibold">Total: <span class="text-success">KES ${(
          o.total ||
          o.totalAmount ||
          0
        ).toLocaleString()}</span></div>
      </div>
      <div class="mb-2 font-semibold">Ordered Items:</div>
      <div class="overflow-x-auto mb-4">
        <table class="table table-sm">
          <thead><tr><th>Name</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            ${(o.items || [])
              .map(
                (i) => `
              <tr>
                <td>${
                  (i.productId &&
                    (i.productId.productName || i.productId.name)) ||
                  i.name ||
                  "N/A"
                }</td>
                <td>${i.quantity || i.qty || ""}</td>
                <td>KES ${
                  (i.price || "").toLocaleString
                    ? i.price.toLocaleString()
                    : i.price || ""
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="mb-2 font-semibold">Delivery Location:</div>
      <div class="mb-2">${
        o.location || (o.userId && o.userId.address) || "N/A"
      }</div>
      <div class="mb-2 font-semibold">Contact:</div>
      <div class="mb-2">${
        (o.userId && o.userId.telno) || o.contact || "N/A"
      }</div>
      <div class="mb-2 font-semibold">Payment:</div>
      <div class="mb-2">${o.paymentStatus || o.payment || "N/A"}</div>
    `;
    const dlg = byId("detailsModal");
    dlg && dlg.showModal && dlg.showModal();
  }

  // modal close
  byId("closeDetailsBtn")?.addEventListener("click", () =>
    byId("detailsModal")?.close()
  );

  // Filters and pagination
  const searchEl = byId("searchOrder");
  const statusEl = byId("statusFilter");
  const paymentEl = byId("paymentFilter");
  const dateFromEl = byId("dateFrom");
  const dateToEl = byId("dateTo");

  searchEl && searchEl.addEventListener("input", filterOrders);
  statusEl && statusEl.addEventListener("change", filterOrders);
  paymentEl && paymentEl.addEventListener("change", filterOrders);
  dateFromEl && dateFromEl.addEventListener("change", filterOrders);
  dateToEl && dateToEl.addEventListener("change", filterOrders);

  function filterOrders() {
    const search = (searchEl?.value || "").trim().toLowerCase();
    const status = (statusEl?.value || "").trim().toLowerCase();
    const payment = (paymentEl?.value || "").trim().toLowerCase();
    const dateFrom = dateFromEl?.value || "";
    const dateTo = dateToEl?.value || "";

    filteredOrders = orders.filter((o) => {
      const customer = (
        (o.userId && (o.userId.fullname || o.userId.name)) ||
        o.customer ||
        ""
      )
        .toString()
        .toLowerCase();
      const id = (o.orderId || o.id || "").toString().toLowerCase();
      const st = (o.status || o.orderStatus || "").toString().toLowerCase();
      const pay = (o.paymentStatus || o.payment || "").toString().toLowerCase();
      const date = (o.createdAt || o.date || "").toString().slice(0, 10);
      return (
        (!search || customer.includes(search) || id.includes(search)) &&
        (!status || st === status) &&
        (!payment || pay === payment) &&
        (!dateFrom || date >= dateFrom) &&
        (!dateTo || date <= dateTo)
      );
    });

    currentPage = 1;
    renderStats();
    renderTable();
    renderPagination();
  }

  function renderPagination() {
    const pag = byId("pagination");
    if (!pag) return;
    pag.innerHTML = "";
    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.className = `btn btn-outline btn-sm ${
        i === currentPage ? "btn-active btn-primary" : ""
      }`;
      btn.textContent = i;
      btn.onclick = () => {
        currentPage = i;
        renderTable();
        renderPagination();
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      pag.appendChild(btn);
    }
  }

  // initial load
  fetchOrders();
})();
