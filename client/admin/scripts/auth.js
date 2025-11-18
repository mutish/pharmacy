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
    if (res.ok && data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/client/admin/pages/adminDashboard.html'; // Redirect on success
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (err) {
    alert('Network error');
  }
});

// Signup
document.getElementById('signupForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const fullname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmpassword').value;
  const gender = document.getElementById('gender').value;
  const telno = document.getElementById('phone').value;
  const address = document.getElementById('address').value;

  try {
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password, confirmPassword, gender, telno, address })
    });
    const data = await res.json();
    if (res.ok && data.token && data.user) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/client/patient/home.html'; // Redirect on success
    } else {
      throw new Error(data.error || 'Signup failed');
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/client/auth/loginUser.html'; // Redirect to login
    } else {
      alert(data.error || 'Logout failed');
    }
  } catch (err) {
    alert('Network error');
  }
});