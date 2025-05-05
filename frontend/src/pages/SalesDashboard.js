import React from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

function SalesDashboard() {
    return (
        <>
            <RoleBasedNavBar />
            <div>
                <h1>Sales Dashboard</h1>
                <p>Monitor sales data, track customer orders, and manage pricing strategies.</p>
            </div>
        </>
    );
}

export default SalesDashboard;
