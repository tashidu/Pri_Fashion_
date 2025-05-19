import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaBars,
  FaCashRegister,
  FaList,
  FaImages,
  FaPlus,
  FaEye,
  FaClipboardList,
  FaFileInvoiceDollar,
  FaChartLine
} from "react-icons/fa";
import { logout } from "../utils/auth";

function SalesTeamNavBar() {
  // Set sidebar to open if window width >= 768px; otherwise, minimized.
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

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

  // Define navigation items
  const navItems = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/sales-dashboard"
    },
    {
      title: "Product List",
      icon: <FaList />,
      path: "/sales-products"
    },
    {
      title: "Product Gallery",
      icon: <FaImages />,
      path: "/sales-product-gallery"
    },
    {
      title: "Sell Products",
      icon: <FaCashRegister />,
      path: "/sell-product"
    },
    {
      title: "View Shops",
      icon: <FaEye />,
      path: "/viewshops"
    },
    {
      title: "Add Shop",
      icon: <FaPlus />,
      path: "/addshop"
    },
    {
      title: "View Orders",
      icon: <FaClipboardList />,
      path: "/sales-team-orders"
    },
    {
      title: "Create Order",
      icon: <FaFileInvoiceDollar />,
      path: "/addorder"
    }
  ];

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="d-flex">
      {/* Toggle button for mobile */}
      <div
        className="sidebar-toggle d-md-none"
        onClick={toggleSidebar}
        style={{
          position: "fixed",
          top: "10px",
          left: isSidebarOpen ? "210px" : "10px",
          zIndex: 1050,
          backgroundColor: "#0d6efd",
          color: "white",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          transition: "left 0.3s ease"
        }}
      >
        <FaBars />
      </div>

      {/* Sidebar */}
      <div
        className={`sidebar ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        style={{
          height: "100vh",
          width: isSidebarOpen ? "240px" : "70px",
          position: "fixed",
          top: "0",
          left: "0",
          paddingTop: "20px",
          backgroundColor: "#D9EDFB",
          transition: "all 0.3s ease",
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
          overflowX: "hidden",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000,
          borderRight: "1px solid rgba(0,0,0,0.05)"
        }}
      >
        {/* Brand logo and name */}
        <div className="d-flex align-items-center justify-content-center mb-4 px-3">
          <img
            src="/logo.png"
            alt="Pri Fashion Logo"
            className={isSidebarOpen ? "me-2" : ""}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
            }}
          />
          {isSidebarOpen && (
            <span className="fw-bold fs-5 text-primary">Pri Fashion</span>
          )}
        </div>

        {/* Navigation items */}
        <div className="nav-container flex-grow-1" style={{ overflowY: "hidden" }}>
          <ul className="nav flex-column px-2">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item mb-2">
                <Link
                  to={item.path}
                  className="nav-link d-flex align-items-center"
                  style={{
                    padding: isSidebarOpen ? "10px 15px" : "10px 0",
                    borderRadius: "8px",
                    backgroundColor: isActive(item.path) ? "rgba(13, 110, 253, 0.1)" : "transparent",
                    color: isActive(item.path) ? "#0d6efd" : "#212529",
                    fontWeight: isActive(item.path) ? "600" : "normal",
                    marginLeft: isSidebarOpen ? "0" : "auto",
                    marginRight: isSidebarOpen ? "0" : "auto",
                    width: isSidebarOpen ? "auto" : "50px",
                    textAlign: isSidebarOpen ? "left" : "center",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div className="icon-container" style={{
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isActive(item.path) ? "#0d6efd" : "#6c757d",
                    fontSize: "16px"
                  }}>
                    {item.icon}
                  </div>
                  {isSidebarOpen && <span className="ms-2">{item.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Logout button at bottom */}
        <div style={{ padding: "20px" }}>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
            style={{
              padding: "10px",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}
          >
            <FaSignOutAlt />
            {isSidebarOpen && <span className="ms-2">Logout</span>}
          </button>
        </div>
      </div>

      {/* Top navbar for mobile */}
      <div
        className="top-navbar d-md-none"
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          height: "60px",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 15px"
        }}
      >
        <h5 className="mb-0 text-primary">Pri Fashion</h5>
      </div>

      {/* Main content area to render nested routes */}
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: "100%",
          transition: "margin-left 0.3s ease",
          paddingTop: window.innerWidth < 768 ? "60px" : "0"
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default SalesTeamNavBar;
