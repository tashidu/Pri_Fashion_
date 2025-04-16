import React, { useState, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function PriFashionNavBar() {
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
            <Link className="nav-link d-flex align-items-center text-dark" to="/owner-dashboard">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-grid"></i>
              </div>
              {isSidebarOpen && <span>Dashboard</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/viewfabric">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-card-text"></i>
              </div>
              {isSidebarOpen && <span>Fabric</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/viewcutting">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-scissors"></i>
              </div>
              {isSidebarOpen && <span>Cutting</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/daily-sewing-history">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-tools"></i>
              </div>
              {isSidebarOpen && <span>Sewing</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/approveproduct-list">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-box"></i>
              </div>
              {isSidebarOpen && <span>Stock Level</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/order">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-clipboard-check"></i>
              </div>
              {isSidebarOpen && <span>Order</span>}
            </Link>
          </li>
          <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/signup">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-person-plus"></i>
              </div>
              {isSidebarOpen && <span>Sign Up</span>}
            </Link>
            <li className="nav-item mb-2">
            <Link className="nav-link d-flex align-items-center text-dark" to="/">
              <div className="me-2 text-center" style={{ width: "24px" }}>
                <i className="bi bi-person-plus"></i>
              </div>
              {isSidebarOpen && <span>Log Out</span>}
            </Link>
          </li>
          </li>
        </ul>
      </div>

      {/* Main content area to render nested routes */}
      <div className={`main-content ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default PriFashionNavBar;
