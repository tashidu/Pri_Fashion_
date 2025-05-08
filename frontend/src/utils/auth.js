// Authentication utility functions

/**
 * Get the current user's role from localStorage
 * @returns {string} The user's role ('Owner', 'Inventory Manager', etc.) or null if not logged in
 */
export const getUserRole = () => {
  const role = localStorage.getItem('role');
  console.log('Retrieved role from localStorage:', role);
  return role;
};

/**
 * Set the user's role in localStorage
 * @param {string} role The role to set
 */
export const setUserRole = (role) => {
  console.log('Setting role in localStorage:', role);
  localStorage.setItem('role', role);
};

/**
 * Check if the current user has a specific role
 * @param {string} role The role to check for
 * @returns {boolean} True if the user has the specified role, false otherwise
 */
export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

/**
 * Check if the user is logged in
 * @returns {boolean} True if the user is logged in, false otherwise
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

/**
 * Log the user out
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = '/';
};

/**
 * Decode the JWT token to get user information
 * @returns {Object|null} The decoded token payload or null if no token exists
 */
export const decodeToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // JWT tokens are in format: header.payload.signature
    // We only need the payload part which is the second part
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get the current user ID from the JWT token
 * @returns {number|null} The user ID or null if not available
 */
export const getUserId = () => {
  const decodedToken = decodeToken();
  return decodedToken ? decodedToken.user_id : null;
};

/**
 * Get the valid roles for the application
 * @returns {Array} Array of valid roles
 */
export const getValidRoles = () => {
  return ['Owner', 'Inventory Manager', 'Order Coordinator', 'Sales Team'];
};
