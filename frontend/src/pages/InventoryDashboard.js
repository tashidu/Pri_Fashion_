import React from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

function InventoryDashboard() {
    return (
        <>
        <RoleBasedNavBar/>
        <div className="main-content">


            <h1>Inventory Dashboard</h1>
            <p>Manage fabric stock, track inventory levels, and handle suppliers.</p>
        </div>
        </>
    );
}

export default InventoryDashboard;
