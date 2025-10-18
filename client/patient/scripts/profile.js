async function renderProfile() {
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("⚠️ Please log in first!", "error");
    setTimeout(() => (window.location.href = "/client/loginUser.html"), 1500);
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Failed to load profile");

    // Save locally for reuse
    localStorage.setItem("user", JSON.stringify(data));

    document.getElementById("profilePic").src = data.profilePic || "/client/assets/images/user-avatar.jpg";
    document.getElementById("username").value = data.fullname || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("phone").value = data.phone || "";

  } catch (err) {
    console.error(err);
    showToast("Error loading profile 😢", "error");
  }
}

document.getElementById("profileForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const token = localStorage.getItem("token");

  const updatedUser = {
    fullname: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
  };

  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedUser),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update");

    localStorage.setItem("user", JSON.stringify(data));
    renderProfile();
    showToast("✅ Profile updated successfully!");
  } catch (err) {
    console.error(err);
    showToast("Error updating profile 😢", "error");
  }
});

document.getElementById("confirmDeleteBtn").onclick = async function (e) {
  e.preventDefault();
  const token = localStorage.getItem("token");

  try {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to delete account");

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
