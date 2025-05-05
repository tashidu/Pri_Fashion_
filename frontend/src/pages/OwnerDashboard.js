import React, { useState, useEffect } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useNavigate } from 'react-router-dom';

import PackingReportChart from "../pages/PackingReportChart"; // Import the existing chart component

function OwnerDashboard() {
  const navigate = useNavigate(); // Hook to navigate to a new page
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGraphClick = () => {
    // Navigate to the full packing report page
    navigate("/packing-report");
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
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
