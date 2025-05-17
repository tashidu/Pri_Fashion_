import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn, getUserRole } from '../utils/auth';

/**
 * A component that protects routes by checking if the user is logged in
 * and optionally if they have the required role.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The child components to render if authenticated
 * @param {string[]} [props.allowedRoles] - Optional array of roles allowed to access this route
 * @returns {React.ReactNode} The protected route or a redirect to login
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const userRole = getUserRole();

  // If user is not logged in, redirect to login page
  if (!loggedIn) {
    // Save the attempted URL for redirecting after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/" replace />;
  }

  // If allowedRoles is specified, check if user has one of the allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      let redirectPath = '/';
      
      switch (userRole) {
        case 'Owner':
          redirectPath = '/owner-dashboard';
          break;
        case 'Inventory Manager':
          redirectPath = '/inventory-dashboard';
          break;
        case 'Order Coordinator':
          redirectPath = '/orders-dashboard';
          break;
        case 'Sales Team':
          redirectPath = '/sales-dashboard';
          break;
        default:
          redirectPath = '/';
      }
      
      return <Navigate to={redirectPath} replace />;
    }
  }

  // User is authenticated and has the required role (if specified)
  return children;
};

export default ProtectedRoute;
