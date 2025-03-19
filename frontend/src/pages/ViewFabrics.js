import React, { useState, useEffect } from 'react';
import axios from 'axios';
import OwnerNavBar from '../components/OwnerNavBar';

const ViewFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [message, setMessage] = useState('');

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

  return (
    <>
      <OwnerNavBar />
      <div className="container mt-4">
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
              </tr>
            </thead>
            <tbody>
              {fabrics.map((fabric) => (
                <tr key={fabric.id}>
                  <td>{fabric.id}</td>
                  <td>{fabric.fabric_name}</td>
                  <td>{fabric.supplier_name}</td>
                  <td>{fabric.date_added}</td>
                  <td>{fabric.variant_count}</td>
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
