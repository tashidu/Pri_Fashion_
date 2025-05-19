import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { FaTshirt, FaCut, FaBoxes, FaChartLine, FaExclamationTriangle, FaCalendarCheck, FaBuilding, FaTachometerAlt, FaSignOutAlt, FaBars, FaAngleRight } from "react-icons/fa";
import { logout } from "../utils/auth";

function InventoryManagerNavBar() {
  // Set sidebar to open if window width >= 768px; otherwise, minimized.
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const location = useLocation();

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle submenu
  const toggleSubmenu = (menu) => {
    if (activeSubmenu === menu) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(menu);
    }
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
      path: "/inventory-dashboard"
    },
    {
      title: "Suppliers",
      icon: <FaBuilding />,
      path: "/addsupplier",
      subItems: [
        { title: "Add Supplier", path: "/addsupplier" },
        { title: "View Suppliers", path: "/viewsuppliers" }
      ]
    },
    {
      title: "Fabric",
      icon: <FaTshirt />,
      path: "/addfabric",
      subItems: [
        { title: "Add Fabric", path: "/addfabric" },
        { title: "View Fabrics", path: "/viewfabric" }
      ]
    },
    {
      title: "Cutting",
      icon: <FaCut />,
      path: "/addcutting",
      subItems: [
        { title: "Add Cutting", path: "/addcutting" },
        { title: "View Cutting", path: "/viewcutting" }
      ]
    },
    {
      title: "Sewing",
      icon: <FaCalendarCheck />,
      path: "/adddailysewing",
      subItems: [
        { title: "Add Daily Sewing", path: "/adddailysewing" },
        { title: "Sewing History", path: "/daily-sewing-history" }
      ]
    },
    {
      title: "Packing",
      icon: <FaBoxes />,
      path: "/add-packing-session",
      subItems: [
        { title: "Add Packing Session", path: "/add-packing-session" },
        { title: "View Packing History", path: "/view-packing-sessions" }
      ]
    },
  
  ];

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Check if a menu has an active subitem
  const hasActiveSubItem = (item) => {
    if (!item.subItems) return false;
    return item.subItems.some(subItem => location.pathname === subItem.path);
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
                {item.subItems ? (
                  <>
                    <div
                      className={`nav-link d-flex align-items-center justify-content-between ${hasActiveSubItem(item) ? 'active' : ''}`}
                      onClick={() => toggleSubmenu(index)}
                      style={{
                        padding: isSidebarOpen ? "10px 15px" : "10px 0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        backgroundColor: hasActiveSubItem(item) ? "rgba(13, 110, 253, 0.1)" : "transparent",
                        color: hasActiveSubItem(item) ? "#0d6efd" : "#212529",
                        fontWeight: hasActiveSubItem(item) ? "600" : "normal",
                        marginLeft: isSidebarOpen ? "0" : "auto",
                        marginRight: isSidebarOpen ? "0" : "auto",
                        width: isSidebarOpen ? "auto" : "50px",
                        textAlign: isSidebarOpen ? "left" : "center",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div className="icon-container" style={{
                          width: "30px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: hasActiveSubItem(item) ? "#0d6efd" : "#6c757d",
                          fontSize: "16px"
                        }}>
                          {item.icon}
                        </div>
                        {isSidebarOpen && <span className="ms-2">{item.title}</span>}
                      </div>
                      {isSidebarOpen && (
                        <FaAngleRight
                          style={{
                            transform: activeSubmenu === index ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.3s ease'
                          }}
                        />
                      )}
                    </div>
                    {isSidebarOpen && activeSubmenu === index && (
                      <ul className="submenu list-unstyled ms-4 mt-1">
                        {item.subItems.map((subItem, subIndex) => (
                          <li key={subIndex} className="mb-1">
                            <Link
                              to={subItem.path}
                              className="submenu-link d-block py-2 px-3"
                              style={{
                                textDecoration: "none",
                                color: isActive(subItem.path) ? "#0d6efd" : "#6c757d",
                                backgroundColor: isActive(subItem.path) ? "rgba(13, 110, 253, 0.05)" : "transparent",
                                borderRadius: "6px",
                                fontSize: "0.9rem",
                                fontWeight: isActive(subItem.path) ? "600" : "normal",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
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
                )}
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

export default InventoryManagerNavBar;
