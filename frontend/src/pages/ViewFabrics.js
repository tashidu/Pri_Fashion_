import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Change here

const ViewFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // Change here

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
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this fabric?"
    );
    if (confirmDelete) {
      axios
        .delete(`http://localhost:8000/api/deletefabric/${id}/`)
        .then((response) => {
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
    navigate(`/edit-fabric/${id}`); // Change here to use navigate
  };

  return (
    <div>
      <h2>Fabric List</h2>
      {message && <p>{message}</p>}
      <table border="1">
        <thead>
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
              <td>{fabric.supplier_name || fabric.supplier?.name}</td>9
              <td>
                <button onClick={() => handleEdit(fabric.id)}>Edit</button>
                <button onClick={() => handleDelete(fabric.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewFabrics;
