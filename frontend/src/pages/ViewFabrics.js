import React, { useState, useEffect } from "react"; 
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OwnerNavBar from "../components/OwnerNavBar";
import "bootstrap/dist/css/bootstrap.min.css"; // Import Bootstrap

const ViewFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch fabrics from API
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/viewfabric/")
      .then((response) => {
        setFabrics(response.data);
      })
      .catch((error) => {
        console.error("Error fetching fabrics:", error);
        setMessage("Error loading fabrics.");
      });
  }, []);

  // Delete a fabric
  const handleDelete = (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this fabric?");
    if (confirmDelete) {
      axios
        .delete(`http://localhost:8000/api/deletefabric/${id}/`)
        .then(() => {
          setMessage("Fabric deleted successfully!");
          setFabrics(fabrics.filter((fabric) => fabric.id !== id));
        })
        .catch((error) => {
          setMessage("Error deleting fabric.");
          console.error(error);
        });
    }
  };

  // Edit a fabric
  const handleEdit = (id) => {
    navigate(`/edit-fabric/${id}`);
  };

  // View Supplier Details
  const handleViewSupplier = (supplierId) => {
    if (supplierId) {
      navigate(`/supplier/${supplierId}`);
    } else {
      setMessage("Supplier ID is missing.");
    }
  };

  return (
    <>
      {/* Owner NavBar */}
      <OwnerNavBar />
      
      <div className="container-fluid">
        <div className="row">
          {/* Main Content */}
          <div
            className="col-md-10 offset-md-2"
            style={{
              paddingTop: "20px",
              paddingLeft: "100px", // Make sure the content doesn't overlap with the navbar
            }}
          >
            <div className="container mt-4">
              <h2 className="text-center mb-4">Fabric List</h2>
              {message && <div className="alert alert-info text-center">{message}</div>}

              <div className="table-responsive">
                <table className="table table-striped table-hover shadow rounded">
                  <thead className="thead-dark">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Color</th>
                      <th>Total Yard</th>
                      <th>Supplier</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabrics.map((fabric) => (
                      <tr key={fabric.id}>
                        <td>{fabric.id}</td>
                        <td>{fabric.name}</td>
                        <td>{fabric.color}</td>
                        <td>{fabric.total_yard}</td>
                        <td>
                          {/* Clickable Supplier Name */}
                          <span 
                            style={{ color: "blue", cursor: "pointer" }}
                            onClick={() => handleViewSupplier(fabric.supplier?.id)} // Ensure supplier.id is passed
                          >
                            {fabric.supplier_name || fabric.supplier?.name}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(fabric.id)}>
                            ✏️ Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(fabric.id)}>
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewFabrics;
