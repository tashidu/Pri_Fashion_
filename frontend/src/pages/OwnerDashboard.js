import React from "react";
import OwnerNavBar from "../components/OwnerNavBar";

function OwnerDashboard() {
  return (
    <>
      <OwnerNavBar />
      <div className="main-content">
        <h1 className="text-3xl font-bold">Owner Dashboard</h1>
        <p className="text-gray-700">
          Welcome, Owner! You can manage users, inventory, and orders here.
        </p>
      </div>
    </>
  );
}

export default OwnerDashboard;
