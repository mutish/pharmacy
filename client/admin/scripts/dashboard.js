// User profile:
    (() => {
      try {
      
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl && user && user.profilePic) {
          avatarEl.src = user.profilePic;
          console.log('Loaded user avatar:', user.profilePic);
        } else {
          console.log('Avatar not set. user:', user, 'avatarEl:', avatarEl);
        } 
      }
    } catch (e) {
      console.log('Error loading avatar:', e);
    }
    })();

// Example: Fetch stats and recent data from backend
let allOrders = [];
let allPrescriptions = [];

async function fetchDashboardStats() {
  try {
    // Users
    const usersRes = await fetch("http://localhost:5000/api/auth/allusers", {
      credentials: "include",
    });
    const users = await usersRes.json();
    document.getElementById("userCount").textContent = Array.isArray(users)
      ? users.length
      : "--";
    const usersTableBody = document.getElementById("usersTableBody");
    usersTableBody.innerHTML = "";
    if (Array.isArray(users)) {
      users.forEach((user) => {
        const row = usersTableBody.insertRow();
        row.insertCell().textContent = user.userId || user._id;
        row.insertCell().textContent = user.fullname;
        row.insertCell().textContent = user.email;
        row.insertCell().textContent = user.telno;
        row.insertCell().textContent = user.gender;
        const imgCell = row.insertCell();
        const img = document.createElement("img");
        img.src = user.profilePic;
        img.alt = "Profile";
        img.width = 40;
        img.height = 40;
        img.style.borderRadius = "50%";
        imgCell.appendChild(img);
        row.insertCell().textContent = user.address;
        row.insertCell().textContent = user.role;
      });
    }

    // Products
    const productsRes = await fetch(
      "http://localhost:5000/api/products/allproducts",
      { credentials: "include" }
    );
    let products = await productsRes.json();
    // If products is not an array, try to extract array from property
    if (!Array.isArray(products)) {
      if (Array.isArray(products.products)) {
        products = products.products;
      } else {
        products = [];
      }
    }
    document.getElementById("productCount").textContent =
      products.length || "--";
    const productsTableBody = document.getElementById("productsTableBody");
    productsTableBody.innerHTML = "";
    products.forEach((product) => {
      productsTableBody.innerHTML += `
                        <tr>
                    <td>${product.productId}</td>
                    <td>${product.productName}</td>
                    <td>${product.productDescription}</td>
                    <td>${product.category}</td>
                    <td><img src="${
                      product.imageUrl
                    }" alt="Product" width="40" height="40"></td>
                    <td>${product.price}</td>
                    <td>${product.stock}</td>
                    <td>${
                      product.mfgDate
                        ? new Date(product.mfgDate).toLocaleDateString()
                        : ""
                    }</td>
                    <td>${
                      product.expDate
                        ? new Date(product.expDate).toLocaleDateString()
                        : ""
                    }</td>
                    <td>${product.prescriptionRequired ? "Yes" : "No"}</td>
                </tr>
                    `;
    });

    // Orders
    const ordersRes = await fetch(
      "http://localhost:5000/api/orders/allorders",
      { credentials: "include" }
    );
    let orders = await ordersRes.json();
    if (!Array.isArray(orders)) {
      if (Array.isArray(orders.orders)) {
        orders = orders.orders;
      } else {
        orders = [];
      }
    }
    document.getElementById("orderCount").textContent = orders.length || "--";
    const ordersTableBody = document.getElementById("ordersTableBody");
    ordersTableBody.innerHTML = "";
    orders.slice(0, 5).forEach((order) => {
      ordersTableBody.innerHTML += `
                        <tr>
                            <td>${order.orderId || order._id}</td>
                            <td>${
                              order.user?.fullname || order.user || "N/A"
                            }</td>
                            <td>${order.status || "N/A"}</td>
                            <td>${order.total || "N/A"}</td>
                            <td>${new Date(
                              order.createdAt
                            ).toLocaleDateString()}</td>
                        </tr>
                    `;
    });

    // Prescriptions
    const prescriptionsRes = await fetch(
      "http://localhost:5000/api/prescription/allprescriptions",
      { credentials: "include" }
    );
    let prescriptions = await prescriptionsRes.json();
    if (!Array.isArray(prescriptions)) {
      if (Array.isArray(prescriptions.prescriptions)) {
        prescriptions = prescriptions.prescriptions;
      } else {
        prescriptions = [];
      }
    }
    document.getElementById("prescriptionCount").textContent =
      prescriptions.length || "--";
    const prescriptionsTableBody = document.getElementById(
      "prescriptionsTableBody"
    );
    prescriptionsTableBody.innerHTML = "";
    prescriptions.slice(0, 5).forEach((rx) => {
      prescriptionsTableBody.innerHTML += `
                        <tr>
                            <td>${rx.prescriptionId || rx._id}</td>
                            <td>${rx.user?.fullname || rx.user || "N/A"}</td>
                            <td><a href="${
                              rx.fileUrl
                            }" target="_blank">View</a></td>
                            <td>${new Date(
                              rx.createdAt
                            ).toLocaleDateString()}</td>
                        </tr>
                    `;
    });

    // Transactions (new)
    try {
      const txRes = await fetch("http://localhost:5000/api/checkout", {
        credentials: "include",
      });
      let transactions = await txRes.json();
      // normalize common response shapes to an array
      if (!Array.isArray(transactions)) {
        if (Array.isArray(transactions.checkouts)) {
          transactions = transactions.checkouts;
        } else if (Array.isArray(transactions.data)) {
          transactions = transactions.data;
        } else {
          transactions = [];
        }
      }
      document.getElementById("transactionCount").textContent =
        transactions.length || "--";
    } catch (txErr) {
      console.warn("Failed to fetch transactions:", txErr);
      document.getElementById("transactionCount").textContent = "--";
    }

    // Save for search
    window.allOrders = orders;
    window.allPrescriptions = prescriptions;
  } catch (err) {
    console.error("Failed to fetch dashboard stats:", err);
    alert(
      "Failed to load dashboard data. Please check the console for details or try again later."
    );
  }
}
fetchDashboardStats();

// Show search overlay
document.getElementById("searchBtn").onclick = function () {
  document.getElementById("searchOverlay").style.display = "flex";
  document.getElementById("searchInput").focus();
};
document.getElementById("closeSearch").onclick = function () {
  document.getElementById("searchOverlay").style.display = "none";
  document.getElementById("searchInput").value = "";
};

// Search logic
document.getElementById("searchForm").onsubmit = function (e) {
  e.preventDefault();
  const query = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  if (!query) return;

  // Filter orders
  const filteredOrders = allOrders.filter(
    (order) =>
      (order.orderId || order._id || "").toLowerCase().includes(query) ||
      (order.user?.fullname || order.user || "").toLowerCase().includes(query)
  );
  const ordersTableBody = document.getElementById("ordersTableBody");
  ordersTableBody.innerHTML = "";
  filteredOrders.slice(0, 5).forEach((order) => {
    ordersTableBody.innerHTML += `
                    <tr>
                        <td>${order.orderId || order._id}</td>
                        <td>${order.user?.fullname || order.user || "N/A"}</td>
                        <td>${order.status || "N/A"}</td>
                        <td>${order.total || "N/A"}</td>
                        <td>${new Date(
                          order.createdAt
                        ).toLocaleDateString()}</td>
                    </tr>
                `;
  });

  // Filter prescriptions
  const filteredPrescriptions = allPrescriptions.filter(
    (rx) =>
      (rx.prescriptionId || rx._id || "").toLowerCase().includes(query) ||
      (rx.user?.fullname || rx.user || "").toLowerCase().includes(query)
  );
  const prescriptionsTableBody = document.getElementById(
    "prescriptionsTableBody"
  );
  prescriptionsTableBody.innerHTML = "";
  filteredPrescriptions.slice(0, 5).forEach((rx) => {
    prescriptionsTableBody.innerHTML += `
                    <tr>
                        <td>${rx.prescriptionId || rx._id}</td>
                        <td>${rx.user?.fullname || rx.user || "N/A"}</td>
                        <td><a href="${
                          rx.fileUrl
                        }" target="_blank">View</a></td>
                        <td>${new Date(rx.createdAt).toLocaleDateString()}</td>
                    </tr>
                `;
  });

  document.getElementById("searchOverlay").style.display = "none";
  document.getElementById("searchInput").value = "";
};
