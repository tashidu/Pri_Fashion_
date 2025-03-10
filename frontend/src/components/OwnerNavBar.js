import React, { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';import { Link } from 'react-router-dom';

function PriFashionNavBar() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div
                className={`text-dark p-3 ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
                style={{
                    height: '100vh',
                    width: isSidebarOpen ? '200px' : '60px',
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    paddingTop: '20px',
                    backgroundColor: '#D9EDFB',
                    transition: 'width 0.3s ease',
                    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Brand logo and name */}
                <div className="d-flex align-items-center mb-4">
                    <img 
                        src="/api/placeholder/40/40" 
                        alt="Pri Fashion Logo" 
                        className="me-2" 
                        style={{ width: '40px', height: '40px' }}
                    />
                    {isSidebarOpen && <span className="fw-bold">Pri Fashion</span>}
                </div>
                
                {/* Toggle Button */}
                <button 
                    className="btn btn-light mb-4 d-block d-lg-none" 
                    onClick={toggleSidebar}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '-40px',
                        zIndex: 1000,
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <i className={`bi ${isSidebarOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
                </button>

                {/* Navigation items */}
                <ul className="nav flex-column">
                    <li className="nav-item mb-2">
                        <a className="nav-link d-flex align-items-center" href="/dashboard" style={{color: '#0D6EFD'}}>
                            <div className="me-2 text-center" style={{width: '24px'}}>
                                <i className="bi bi-grid"></i>
                            </div>
                            {isSidebarOpen && <span>Dashboard</span>}
                        </a>
                    </li>
                    <li className="nav-item mb-2">
                        <a className="nav-link d-flex align-items-center text-dark" href="/fabric">
                            <div className="me-2 text-center" style={{width: '24px'}}>
                                <i className="bi bi-card-text"></i>
                            </div>
                            {isSidebarOpen && <span>Fabric</span>}
                        </a>
                    </li>
                    <li className="nav-item mb-2">
                        <a className="nav-link d-flex align-items-center text-dark" href="/cutting">
                            <div className="me-2 text-center" style={{width: '24px'}}>
                                <i className="bi bi-scissors"></i>
                            </div>
                            {isSidebarOpen && <span>Cutting</span>}
                        </a>
                    </li>
                    <li className="nav-item mb-2">
                        <a className="nav-link d-flex align-items-center text-dark" href="/sewing">
                            <div className="me-2 text-center" style={{width: '24px'}}>
                                <i className="bi bi-tools"></i>
                            </div>
                            {isSidebarOpen && <span>Sewing</span>}
                        </a>
                    </li>
                    <li className="nav-item mb-2">
                        <a className="nav-link d-flex align-items-center text-dark" href="/stock-level">
                            <div className="me-2 text-center" style={{width: '24px'}}>
                                <i className="bi bi-box"></i>
                            </div>
                            {isSidebarOpen && <span>Stock Level</span>}
                        </a>
                    </li>
                    <li className="nav-item mb-2">
                        <a className="nav-link d-flex align-items-center text-dark" href="/order">
                            <div className="me-2 text-center" style={{width: '24px'}}>
                                <i className="bi bi-clipboard-check"></i>
                            </div>
                            {isSidebarOpen && <span>Order</span>}
                        </a>
                    </li>
                    
<li className="nav-item mb-2">
    <Link className="nav-link d-flex align-items-center text-dark" to="/signup">
        <div className="me-2 text-center" style={{ width: '24px' }}>
            <i className="bi bi-person-plus"></i>
        </div>
        {isSidebarOpen && <span>Sign Up</span>}
    </Link>
</li>
                </ul>
            </div>

            {/* Main content */}
            <div
                style={{
                    marginLeft: isSidebarOpen ? '200px' : '60px',
                    padding: '20px',
                    flexGrow: 1,
                    transition: 'margin-left 0.3s ease',
                }}
            >
                {/* Main content goes here */}
                <h1>Welcome to Pri Fashion</h1>
                <p>This is the main content area.</p>
            </div>
        </div>
    );
}

export default PriFashionNavBar;