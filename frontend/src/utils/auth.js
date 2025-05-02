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
 * Get the valid roles for the application
 * @returns {Array} Array of valid roles
 */
export const getValidRoles = () => {
  return ['Owner', 'Inventory Manager', 'Order Coordinator', 'Sales Team'];
};
