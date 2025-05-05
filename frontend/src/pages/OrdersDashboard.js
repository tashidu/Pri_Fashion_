import React, { useState, useEffect } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

function OrdersDashboard() {
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
            <RoleBasedNavBar />
            <div
                style={{
                    marginLeft: isSidebarOpen ? "240px" : "70px",
                    width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
                    transition: "all 0.3s ease",
                    padding: "20px"
                }}
            >
                <h1>Orders Dashboard</h1>
                <p>Track incoming orders, manage order fulfillment, and oversee production workflow.</p>
            </div>
        </>
    );
}

export default OrdersDashboard;
