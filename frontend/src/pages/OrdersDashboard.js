import React from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

function OrdersDashboard() {
    return (
        <>
            <RoleBasedNavBar />
            <div className="main-content">
                <h1>Orders Dashboard</h1>
                <p>Track incoming orders, manage order fulfillment, and oversee production workflow.</p>
            </div>
        </>
    );
}

export default OrdersDashboard;
