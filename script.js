const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, role })
    });
    const data = await response.json();

    if (response.ok) {
      // Store the JWT token in local storage
      localStorage.setItem('token', data.token);
      alert(data.message);
      // Redirect to the appropriate page based on the role
      switch (role) {
        case 'admin':
          window.location.href = 'create_trip.html';
          break;
        case 'editor':
          window.location.href = 'budget_management.html';
          break;
        case 'viewer':
          window.location.href = 'itinerary.html';
          break;
        default:
          break;
      }
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred during the login process.');
  }
});

function logout() {
  // Clear user session data
  localStorage.removeItem('token');

  // Redirect to login page
  window.location.href = 'index.html';
}
// Function to fetch data from a protected route
async function fetchProtectedData() {
  const token = localStorage.getItem('token');

  // Include the token in the request headers
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
  
  // Make the request with the token
  axios.get('/protected', config)
    .then(response => {
      // Handle the response
    })
    .catch(error => {
      // Handle the error
    });  
}

// Call the fetchProtectedData function when needed
// For example, when the user navigates to a specific page
window.addEventListener('load', fetchProtectedData);