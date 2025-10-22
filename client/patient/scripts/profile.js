const safeParseUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getAuthToken = () => localStorage.getItem("token");

const applyUserToUI = (user) => {
  if (!user) return;
  document.getElementById("profilePic").src = user.profilePic || "/client/assets/images/user-avatar.jpg";
  document.getElementById("profileName").textContent = user.fullname || "";
  document.getElementById("profileEmail").textContent = user.email || "";
  document.getElementById("username").value = user.fullname || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.telno || user.phone || "";
};

const showToast = (message, type = "success") => {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toastMsg.className = `alert shadow-lg transition-all duration-300 ${
    type === "error" ? "alert-error" : "alert-success"
  }`;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
};

const initDeleteModal = () => {
  const deleteModal = document.getElementById("deleteModal");
  const deleteBtn = document.getElementById("deleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

  if (!deleteModal || !deleteBtn || !cancelDeleteBtn) return;

  deleteBtn.addEventListener("click", () => deleteModal.showModal());
  cancelDeleteBtn.addEventListener("click", (e) => {
    e.preventDefault();
    deleteModal.close();
  });

  return deleteModal;
};

const deleteModalRef = initDeleteModal();

async function renderProfile() {
  const token = getAuthToken();
  if (!token) {
    showToast("⚠️ Please log in first!", "error");
    setTimeout(() => (window.location.href = "/client/patient/auth/loginUser.html"), 1500);
    return;
  }

  const cachedUser = safeParseUser();
  if (cachedUser) applyUserToUI(cachedUser);

  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      showToast("⚠️ Session expired. Please log in again.", "error");
      setTimeout(() => (window.location.href = "/client/patient/auth/loginUser.html"), 1500);
      return;
    }

    const payload = await res.json();
    const user = payload.user || payload;
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      applyUserToUI(user);
    }
  } catch (err) {
    console.error(err);
    if (!cachedUser) showToast("Error loading profile 😢", "error");
  }
}

document.getElementById("profileForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const updatedUser = {
    fullname: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    telno: document.getElementById("phone").value.trim(),
  };

  const token = getAuthToken();
  if (!token) {
    showToast("⚠️ Session expired. Please log in again.", "error");
    setTimeout(() => (window.location.href = "/client/patient/auth/loginUser.html"), 1500);
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedUser),
    });

    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "Failed to update");

    const user = payload.user || payload;
    localStorage.setItem("user", JSON.stringify(user));
    applyUserToUI(user);
    showToast("✅ Profile updated successfully!");
  } catch (err) {
    console.error(err);
    showToast("Error updating profile 😢", "error");
  }
});

document.getElementById("confirmDeleteBtn").onclick = async function (e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) {
    showToast("⚠️ Session expired. Please log in again.", "error");
    setTimeout(() => (window.location.href = "/client/patient/auth/loginUser.html"), 1500);
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      method: "DELETE",
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete account");

    deleteModalRef?.close();
    showToast("⚠️ Account deleted successfully", "error");
    localStorage.clear();
    setTimeout(() => {
      window.location.href = "/client/index.html";
    }, 1500);
  } catch (err) {
    console.error(err);
    showToast("Error deleting account 😢", "error");
  }
};

window.addEventListener("DOMContentLoaded", () => {
  initDeleteModal();
  renderProfile();
});

