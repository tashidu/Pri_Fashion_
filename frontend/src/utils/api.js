// API utility functions
import axios from 'axios';
import API_BASE_URL from './apiConfig';

/**
 * Create an axios instance with authentication headers
 * @returns {Object} Axios instance with authentication headers
 */
export const createAuthenticatedAxios = () => {
  const token = localStorage.getItem('token');

  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `JWT ${token}` : ''
    }
  });

  // Add response interceptor to handle authentication errors
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Make an authenticated GET request
 * @param {string} url - The URL to request
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
export const authGet = (url, config = {}) => {
  const instance = createAuthenticatedAxios();
  return instance.get(url, config);
};

/**
 * Make an authenticated POST request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
export const authPost = (url, data = {}, config = {}) => {
  const instance = createAuthenticatedAxios();
  return instance.post(url, data, config);
};

/**
 * Make an authenticated PUT request
 * @param {string} url - The URL to request
 * @param {Object} data - The data to send
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
export const authPut = (url, data = {}, config = {}) => {
  const instance = createAuthenticatedAxios();
  return instance.put(url, data, config);
};

/**
 * Make an authenticated DELETE request
 * @param {string} url - The URL to request
 * @param {Object} config - Additional axios config
 * @returns {Promise} Axios promise
 */
export const authDelete = (url, config = {}) => {
  const instance = createAuthenticatedAxios();
  return instance.delete(url, config);
};
