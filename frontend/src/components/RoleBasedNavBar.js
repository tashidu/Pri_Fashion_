import React, { useState, useEffect } from 'react';
import { getUserRole } from '../utils/auth';
import OwnerNavBar from './OwnerNavBar';
import InventoryManagerNavBar from './InventoryManagerNavBar';
import OrderCoordinatorNavBar from './OrderCoordinatorNavBar';
import SalesTeamNavBar from './SalesTeamNavBar';

/**
 * A component that renders the appropriate navigation bar based on the user's role
 * If no role is found or the role doesn't match any known roles, it defaults to OwnerNavBar
 */
const RoleBasedNavBar = () => {
  const [currentRole, setCurrentRole] = useState(getUserRole());

  // Update the role in state when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newRole = getUserRole();
      if (newRole !== currentRole) {
        setCurrentRole(newRole);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentRole]);

  // Render the appropriate navigation bar based on the user's role
  const renderNavBar = () => {
    switch (currentRole) {
      case 'Owner':
        return <OwnerNavBar />;
      case 'Inventory Manager':
        return <InventoryManagerNavBar />;
      case 'Order Coordinator':
        return <OrderCoordinatorNavBar />;
      case 'Sales Team':
        return <SalesTeamNavBar />;
      default:
        // Default to OwnerNavBar if no role is found or the role doesn't match
        console.log('No matching role found, defaulting to OwnerNavBar. Current role:', currentRole);
        return <OwnerNavBar />;
    }
  };

  // Role switcher removed for security reasons

  return (
    <>
      {renderNavBar()}
    </>
  );
};

export default RoleBasedNavBar;
