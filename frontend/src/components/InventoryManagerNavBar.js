import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function InventoryManagerNavBar() {
  // Set sidebar to open if window width >= 768px; otherwise, minimized.
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className={`text-dark p-3 ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        style={{
          height: "100vh",
          width: isSidebarOpen ? "200px" : "60px",
          position: "fixed",
          top: "0",
          left: "0",
          paddingTop: "20px",
          backgroundColor: "#D9EDFB",
          transition: "width 0.3s ease",
          boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
          overflowX: "hidden",
          zIndex: 1000,
        }}
      >
        {/* Brand logo and name */}
        <div className="d-flex align-items-center mb-4">
          <img
            src="/logo.jpg"
            alt="Pri Fashion Logo"
            className="me-2"
            style={{ width: "40px", height: "40px" }}
          />
          {isSidebarOpen && <span className="fw-bold">Pri Fashion</span>}
        </div>

        {/* Navigation items */}
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/inventory-dashboard">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-speedometer2"></i>
              </div>
              {isSidebarOpen && <span>Dashboard</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/addsupplier">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-building"></i>
              </div>
              {isSidebarOpen && <span>Suppliers</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/addfabric">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-card-text"></i>
              </div>
              {isSidebarOpen && <span>Fabric</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/addcutting">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-scissors"></i>
              </div>
              {isSidebarOpen && <span>Cutting</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/adddailysewing">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-calendar-check"></i>
              </div>
              {isSidebarOpen && <span>Daily Sewing</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/add-packing-session">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-box-seam"></i>
              </div>
              {isSidebarOpen && <span>Packing</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/damaged-clothes">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              {isSidebarOpen && <span>Damaged Clothes</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/inventory-reports">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-graph-up"></i>
              </div>
              {isSidebarOpen && <span>Reports</span>}
            </Link>
          </li>
        </ul>
      </div>

      {/* Main content area to render nested routes */}
      <div className={`main-content ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`} style={{ marginLeft: isSidebarOpen ? "200px" : "60px", width: "100%" }}>
        <Outlet />
      </div>
    </div>
  );
}

export default InventoryManagerNavBar;
