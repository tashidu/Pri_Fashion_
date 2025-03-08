import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

function OwnerNavBar() {
    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div
                className="bg-dark text-white p-3"
                style={{
                    height: '100vh',
                    width: '250px',
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    paddingTop: '20px',
                }}
            >
                <a className="navbar-brand text-white" href="/dashboard">Owner Dashboard</a>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link text-white" href="/dashboard">Dashboard</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link text-white" href="/orders">Orders</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link text-white" href="/inventory">Inventory</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link text-white" href="/logout">Logout</a>
                    </li>
                </ul>
            </div>

            {/* Main content */}
            <div
                style={{
                    marginLeft: '250px',
                    padding: '20px',
                    flexGrow: 1
                }}
            >
                {/* Your main content goes here */}
            </div>
        </div>
    );
}

export default OwnerNavBar;
