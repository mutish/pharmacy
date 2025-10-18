// Login
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = '/client/pharmacist/dashboard.html'; // Redirect on success
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Network error');
  }
});


// Logout (example: attach to a logout button with id="logoutBtn")
document.getElementById('logoutBtn')?.addEventListener('click', async function(e) {
  e.preventDefault();
  try {
    const res = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = '/client/pharmacist/loginPharmacist.html'; // Redirect to login
    } else {
      alert(data.error || 'Logout failed');
    }
  } catch (err) {
    alert('Network error');
  }
});
