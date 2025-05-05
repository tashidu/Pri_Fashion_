import React, { useState, useEffect } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

function InventoryDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // Add resize event listener to update sidebar state
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
        <RoleBasedNavBar/>
        <div
            style={{
                marginLeft: isSidebarOpen ? "240px" : "70px",
                width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
                transition: "all 0.3s ease",
                padding: "20px"
            }}
        >
            <h1>Inventory Dashboard</h1>
            <p>Manage fabric stock, track inventory levels, and handle suppliers.</p>
        </div>
        </>
    );
}

export default InventoryDashboard;
