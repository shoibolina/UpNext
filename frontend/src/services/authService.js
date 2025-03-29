const API_URL = 'http://127.0.0.1:8000';

const authService = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.detail || Object.values(data).flat().join(', ') || 'Registration failed';
        throw new Error(errorMsg);
      }
      
      // Store token in localStorage
      if (data.access) {
        localStorage.setItem('token', data.access);
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.detail || 'Invalid credentials';
        throw new Error(errorMsg);
      }
      
      // Store token in localStorage
      if (data.access) {
        localStorage.setItem('token', data.access);
      }
      
      // Fetch user data
      const userResponse = await fetch(`${API_URL}/api/v1/users/me/`, {
        headers: {
          'Authorization': `Bearer ${data.access}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      
      return {
        token: data.access,
        refresh: data.refresh,
        user: userData
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  updateProfile: async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/v1/users/update_me/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

export default authService;