import api from './apiConfig';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      console.log(response.data)
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (contactInfo) => {
    try {
      const response = await api.post('/api/auth/contact', contactInfo);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/api/auth/refresh-token', { refreshToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};