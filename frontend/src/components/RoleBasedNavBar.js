import React, { useState, useEffect } from 'react';
import { getUserRole, setUserRole, getValidRoles } from '../utils/auth';
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
  const validRoles = getValidRoles();

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

  // Handle role change
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setUserRole(newRole);
    setCurrentRole(newRole);
  };

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

  // Add a role switcher for development/testing purposes
  const roleSwitcher = (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: '#f8f9fa',
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
        Current Role: {currentRole || 'None'}
      </div>
      <select
        value={currentRole || ''}
        onChange={handleRoleChange}
        style={{
          padding: '5px',
          borderRadius: '3px',
          border: '1px solid #ced4da',
          fontSize: '12px'
        }}
      >
        <option value="">Select Role</option>
        {validRoles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      {renderNavBar()}
      {roleSwitcher}
    </>
  );
};

export default RoleBasedNavBar;
