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
      
      if (data.access) {
        localStorage.setItem('token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
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
      
      if (data.access) {
        localStorage.setItem('token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
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
      // Cache the user data for synchronous access
      localStorage.setItem('cachedUser', JSON.stringify(userData));
      
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
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cachedUser');
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${API_URL}/api/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (!response.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      if (data.access) {
        localStorage.setItem('token', data.access);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },
  
  refreshTokenIfNeeded: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        return await authService.refreshToken();
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token:', error);
      return await authService.refreshToken();
    }
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      await authService.refreshTokenIfNeeded();
      
      const freshToken = localStorage.getItem('token');
      
      if (!freshToken) {
        return null;
      }
      
      const response = await fetch(`${API_URL}/api/v1/users/me/`, {
        headers: {
          'Authorization': `Bearer ${freshToken}`
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('cachedUser');
        return null;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      // Update cached user data
      localStorage.setItem('cachedUser', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  },
  
  // Synchronous version for quick access
  getCurrentUserSync: () => {
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  updateProfile: async (userData) => {
    try {
      await authService.refreshTokenIfNeeded();
      
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
      
      const updatedUser = await response.json();
      
      // Update cached user data
      localStorage.setItem('cachedUser', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  uploadProfileImage: async (imageFile) => {
    try {
      await authService.refreshTokenIfNeeded();
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('profile_image', imageFile);
      
      const response = await fetch(`${API_URL}/api/v1/users/upload_profile_image/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload profile image');
      }
      
      const updatedUser = await response.json();
      
      // Update cached user data
      localStorage.setItem('cachedUser', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },
  
  uploadCoverImage: async (imageFile) => {
    try {
      await authService.refreshTokenIfNeeded();
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('cover_photo', imageFile);
      
      const response = await fetch(`${API_URL}/api/v1/users/upload_cover_photo/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload cover photo');
      }
      
      const updatedUser = await response.json();
      
      // Update cached user data
      localStorage.setItem('cachedUser', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      throw error;
    }
  }
};

export default authService;