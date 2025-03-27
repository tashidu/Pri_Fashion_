import React from "react";
import InventoryManagerNavBar from "../components/InventoryManagerNavBar";

function InventoryDashboard() {
    return (
        <>
        <InventoryManagerNavBar/>
        <div className="main-content">
            

            <h1>Inventory Dashboard</h1>
            <p>Manage fabric stock, track inventory levels, and handle suppliers.</p>
        </div>
        </>
    );
}

export default InventoryDashboard;
