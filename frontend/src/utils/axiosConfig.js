import axios from 'axios';
import API_BASE_URL from './apiConfig';

// Set default base URL for all axios requests
axios.defaults.baseURL = API_BASE_URL;

// Add a request interceptor to include the JWT token in all requests
axios.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    console.log('Axios Interceptor - URL:', config.url);
    console.log('Axios Interceptor - Token exists:', !!token);

    // If token exists, add it to the Authorization header
    if (token) {
      // Make sure headers object exists
      config.headers = config.headers || {};

      // Add Authorization header with JWT token (matching backend configuration)
      config.headers.Authorization = `JWT ${token}`;
      console.log('Axios Interceptor - Added Authorization header with JWT token');
    }

    return config;
  },
  (error) => {
    console.error('Axios Interceptor - Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Axios Interceptor - Response Error:', error);

    // Check if the error is due to authentication issues
    if (error.response && error.response.status === 401) {
      console.error('Authentication error - redirecting to login');
      // Clear token and redirect to login page
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/';
    }

    return Promise.reject(error);
  }
);

export default axios;
