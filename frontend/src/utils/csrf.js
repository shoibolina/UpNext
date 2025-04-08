export function getCsrfToken() {
    const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
    return csrfMatch ? csrfMatch[1] : null;
  }
  
  export async function fetchCsrfToken() {
    await fetch('http://localhost:8000/api/init-csrf/', {
      credentials: 'include', // Make sure the cookie is set
    });
  }
  