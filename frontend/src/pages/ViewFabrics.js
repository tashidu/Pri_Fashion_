import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { useNavigate } from 'react-router-dom';

const ViewFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state
  const navigate = useNavigate();

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch fabric definitions from your API
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/fabric-definitions/")
      .then((response) => {
        setFabrics(response.data);
      })
      .catch((error) => {
        console.error("Error fetching fabrics:", error);
        setMessage("Error loading fabrics.");
      });
  }, []);

  // Handler to navigate to the fabric variants page
  const handleViewVariants = (fabricId) => {
    navigate(`/fabric-definitions/${fabricId}`);
  };

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
        <h2 className="text-center mb-4">Fabric List</h2>
        {message && <div className="alert alert-danger text-center">{message}</div>}
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="thead-dark">
              <tr>
                <th>ID</th>
                <th>Fabric Name</th>
                <th>Supplier Name</th>
                <th>Date Added</th>
                <th>Color Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fabrics.map((fabric) => (
                <tr key={fabric.id}>
                  <td>{fabric.id}</td>
                  <td>
                    <span
                      style={{ cursor: 'pointer', color: 'blue' }}
                      onClick={() => handleViewVariants(fabric.id)}
                    >
                      {fabric.fabric_name}
                    </span>
                  </td>
                  <td>{fabric.supplier_name}</td>
                  <td>{fabric.date_added}</td>
                  <td>{fabric.variant_count}</td>
                  <td>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleViewVariants(fabric.id)}
                    >
                      View Variants
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ViewFabrics;
