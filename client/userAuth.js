// LOGIN HANDLER
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
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

    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    alert(`Welcome back, ${data.user.fullname}!`);

    // 🧠 Role-based redirection
    switch (data.user.role) {
      case 'admin':
        window.location.href = '/client/admin/pages/adminDashboard.html';
        break;
      case 'pharmacist':
        window.location.href = '/client/pharmacist/dashboard.html';
        break;
      default:
        window.location.href = '/client/patient/home.html';
    }

  } catch (err) {
    alert(err.message);
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

  try {
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password, confirmPassword, gender })
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = '/client/patient/home.html'; // Redirect on success
    } else {
      alert(data.error || 'Signup failed');
    }
  } catch (err) {
    alert('Something went wrong. Try again!');
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
      window.location.href = '/client/auth/loginUser.html'; // Redirect to login
    } else {
      alert(data.error || 'Logout failed');
    }
  } catch (err) {
    alert('Network error');
  }
});