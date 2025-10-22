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


// Users fetched from backend
let users = [];
let filteredUsers = [];
const pageSize = 4;
let currentPage = 1;
let editIdx = null;

function renderStats() {
  document.getElementById("activeCount").textContent = users.filter(
    (u) => u.status === "Active"
  ).length;
  document.getElementById("suspendedCount").textContent = users.filter(
    (u) => u.status === "Suspended"
  ).length;
  document.getElementById("totalCount").textContent = users.length;
}

function renderTable() {
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageUsers = filteredUsers.slice(start, end);

  pageUsers.forEach((user, idx) => {
    const statusBadge =
      user.status === "Active"
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-error">Suspended</span>';
    const roleBadge =
      user.role === "Admin"
        ? '<span class="badge badge-info">Admin</span>'
        : user.role === "Pharmacist"
        ? '<span class="badge badge-warning">Pharmacist</span>'
        : '<span class="badge badge-success">Client</span>';
    const tr = document.createElement("tr");
    tr.innerHTML = `
           <td>${user.id}</td>
           <td>${user.name}</td>
           <td>${user.email}</td>
           <td>${roleBadge}</td>
           <td>${statusBadge}</td>
           <td>
             <button class="btn btn-xs btn-outline btn-info view-btn" data-idx="${idx}"><i class="fa-solid fa-eye"></i></button>
             <button class="btn btn-xs btn-outline btn-success edit-btn" data-idx="${idx}"><i class="fa-solid fa-pen"></i></button>
             <button class="btn btn-xs btn-outline btn-error delete-btn" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button>
             <button class="btn btn-xs btn-outline btn-warning suspend-btn" data-idx="${idx}"><i class="fa-solid fa-ban"></i></button>
           </td>
         `;
    tbody.appendChild(tr);
  });

  // Edit button logic
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.onclick = function () {
      editIdx =
        parseInt(this.getAttribute("data-idx")) + (currentPage - 1) * pageSize;
      openEditUserModal(editIdx);
    };
  });
  // Delete button logic
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.onclick = function () {
      editIdx =
        parseInt(this.getAttribute("data-idx")) + (currentPage - 1) * pageSize;
      openConfirmModal(
        "Delete User",
        "Are you sure you want to delete this user?",
        "❌",
        () => {
          users.splice(editIdx, 1);
          filterUsers();
          closeConfirmModal();
        }
      );
    };
  });
  // Suspend button logic
  document.querySelectorAll(".suspend-btn").forEach((btn) => {
    btn.onclick = function () {
      editIdx =
        parseInt(this.getAttribute("data-idx")) + (currentPage - 1) * pageSize;
      openConfirmModal(
        "Suspend User",
        "Suspend this user account?",
        "🚫",
        () => {
          users[editIdx].status = "Suspended";
          filterUsers();
          closeConfirmModal();
        }
      );
    };
  });
  // View button logic (for demo, just open edit modal)
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.onclick = function () {
      editIdx =
        parseInt(this.getAttribute("data-idx")) + (currentPage - 1) * pageSize;
      openEditUserModal(editIdx);
    };
  });
}

function openEditUserModal(idx) {
  const user = filteredUsers[idx];
  document.getElementById("editFullName").value = user.name;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editRole").value = user.role;
  document.getElementById("editStatus").value = user.status;
  document.getElementById("editUserModal").showModal();
}
document.getElementById("saveEditUserBtn").onclick = function () {
  const user = filteredUsers[editIdx];
  user.name = document.getElementById("editFullName").value;
  user.email = document.getElementById("editEmail").value;
  user.role = document.getElementById("editRole").value;
  user.status = document.getElementById("editStatus").value;
  document.getElementById("editUserModal").close();
  filterUsers();
};
document.getElementById("cancelEditUserBtn").onclick = function () {
  document.getElementById("editUserModal").close();
};

// Add user modal logic
document.getElementById("addUserBtn").onclick = function () {
  document.getElementById("addFullName").value = "";
  document.getElementById("addEmail").value = "";
  document.getElementById("addRole").value = "Client";
  document.getElementById("addStatus").value = "Active";
  document.getElementById("addUserModal").showModal();
};
document.getElementById("saveAddUserBtn").onclick = async function () {
  const name = document.getElementById("addFullName").value.trim();
  const email = document.getElementById("addEmail").value.trim();
  const role = document.getElementById("addRole").value;
  if (!name || !email) {
    alert("Name and email are required");
    return;
  }
  // Create a temporary password for the new user. Encourage reset via email in production.
  const tempPassword = "TempPass123!";
  try {
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullname: name,
        email,
        password: tempPassword,
        role,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to create user");
    }
    // On success, refresh users list
    document.getElementById("addUserModal").close();
    await fetchUsers();
  } catch (e) {
    console.error("Add user failed", e);
    alert("Failed to add user: " + (e.message || e));
  }
};
document.getElementById("cancelAddUserBtn").onclick = function () {
  document.getElementById("addUserModal").close();
};

// Confirm modal logic
function openConfirmModal(title, msg, icon, onConfirm) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMsg").textContent = msg;
  document.getElementById("confirmIcon").textContent = icon;
  document.getElementById("confirmModal").showModal();
  document.getElementById("confirmYesBtn").onclick = onConfirm;
  document.getElementById("confirmNoBtn").onclick = closeConfirmModal;
}
function closeConfirmModal() {
  document.getElementById("confirmModal").close();
}

// Search/filter logic
document.getElementById("searchUser").addEventListener("input", filterUsers);
document.getElementById("roleFilter").addEventListener("change", filterUsers);
function filterUsers() {
  const search = document
    .getElementById("searchUser")
    .value.trim()
    .toLowerCase();
  const role = document.getElementById("roleFilter").value;
  filteredUsers = users.filter(
    (u) =>
      (!search ||
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)) &&
      (!role || u.role === role)
  );
  currentPage = 1;
  renderStats();
  renderTable();
  renderPagination();
}

// Pagination
function renderPagination() {
  const pag = document.getElementById("pagination");
  pag.innerHTML = "";
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
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

// Fetch users from backend
async function fetchUsers() {
  try {
    const res = await fetch("http://localhost:5000/api/auth/allusers", {
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to fetch users");
    }
    const data = await res.json();
    // map to local model (handle different backend shapes)
    users = Array.isArray(data)
      ? data.map((u) => ({
          id: u.userId || u._id || u.id,
          name:
            u.fullname ||
            u.name ||
            `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          email: u.email,
          role: u.role || "Client",
          status: u.status || "Active",
        }))
      : [];
    filterUsers();
  } catch (e) {
    console.error("Failed to load users", e);
    alert("Failed to load users. Check console for details.");
  }
}

// Initial fetch
fetchUsers();

 // show/hide license input based on role selection
    (function() {
      const roleEl = document.getElementById('addRole');
      const licenseEl = document.getElementById('addLicense');
      roleEl?.addEventListener('change', () => {
        if (roleEl.value === 'pharmacist') {
          licenseEl.classList.remove('hidden');
          licenseEl.required = true;
        } else {
          licenseEl.classList.add('hidden');
          licenseEl.required = false;
        }
      });

      // Attach handler for Add button — ensures gender and (if pharmacist) license are sent.
      document.getElementById('saveAddUserBtn').onclick = async function () {
        const name = document.getElementById('addFullName').value.trim();
        const email = document.getElementById('addEmail').value.trim();
        const gender = document.getElementById('addGender').value;
        const role = document.getElementById('addRole').value;
        const licenseNumber = document.getElementById('addLicense').value.trim();

        if (!name || !email || !gender) {
          alert('Name, email and gender are required.');
          return;
        }
        if (role === 'pharmacist' && !licenseNumber) {
          alert('License number is required for pharmacists.');
          return;
        }

        // temporary password for new user (force reset in production)
        const tempPassword = 'TempPass123!';
        const payload = {
          fullname: name,
          email,
          password: tempPassword,
          role,
          gender
        };
        if (role === 'pharmacist') payload.licenseNumber = licenseNumber;

        try {
          // Use admin-only creation endpoint and include credentials (send cookie)
          const res = await fetch('http://localhost:5000/api/auth/create', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             credentials: 'include',
             body: JSON.stringify(payload)
           });
           const data = await res.json().catch(() => ({}));
           if (!res.ok) {
             throw new Error(data?.message || 'Failed to create user');
           }
           // success: close modal and refresh users list if available
           document.getElementById('addUserModal').close();
           if (typeof fetchUsers === 'function') {
             await fetchUsers();
           } else {
             window.location.reload();
           }
         } catch (err) {
           console.error('Add user failed', err);
           alert('Failed to add user: ' + (err.message || err));
         }
       };
     })();
