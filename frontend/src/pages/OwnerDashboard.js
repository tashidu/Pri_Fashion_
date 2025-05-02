import React from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useNavigate } from 'react-router-dom';

import PackingReportChart from "../pages/PackingReportChart"; // Import the existing chart component

function OwnerDashboard() {
  const navigate = useNavigate(); // Hook to navigate to a new page

  const handleGraphClick = () => {
    // Navigate to the full packing report page
    navigate("/packing-report");
  };

  return (
    <>
      <RoleBasedNavBar />
      <div className="main-content">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="text-gray-700">
          Welcome, Owner! You can manage users, inventory, and orders here.
        </p>

        <div
          className="graph-container"
          onClick={handleGraphClick}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >

          <div style={{ width: '500px', height: '300px' }}> {/* Adjusted size for the chart */}
            {/* Displaying larger version of the chart */}
            <PackingReportChart />
          </div>
        </div>
      </div>
    </>
  );
}

export default OwnerDashboard;
