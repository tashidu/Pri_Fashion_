// src/pages/ApproveFinishedProduct.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import RoleBasedNavBar from '../components/RoleBasedNavBar';

const ApproveFinishedProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [manufacturePrice, setManufacturePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/finished_product/status/${id}/`);
        if (res.data && res.data.is_approved) {
          setIsApproved(true);
          setManufacturePrice(res.data.manufacture_price);
          setSellingPrice(res.data.selling_price);
        }
      } catch (err) {
        console.error("Failed to fetch product approval status:", err);
        setError("Unable to fetch product approval status.");
      } finally {
        setLoading(false);
      }
    };
    fetchApprovalStatus();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const payload = {
      cutting_record: id,
      manufacture_price: parseFloat(manufacturePrice),
      selling_price: parseFloat(sellingPrice)
    };

    try {
      const response = await axios.post(
        'http://localhost:8000/api/finished_product/approve/',
        payload
      );
      setSuccessMsg(response.data.message || 'Product approved successfully!');
      setTimeout(() => {
        navigate('/approveproduct-list');
      }, 2000);
    } catch (err) {
      console.error("Error approving finished product:", err);
      const errMsg = err.response && err.response.data
        ? JSON.stringify(err.response.data)
        : "Failed to approve finished product.";
      setError(errMsg);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <RoleBasedNavBar />
      <div className="main-content">
        <h2>Approve Finished Product - Batch ID: {id}</h2>
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        {successMsg && <div style={{ color: "green", marginBottom: "10px" }}>{successMsg}</div>}

        {isApproved ? (
          <div>
            <p><strong>Already Approved</strong></p>
            <p>Manufacture Price: ${manufacturePrice}</p>
            <p>Selling Price: ${sellingPrice}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label>Manufacture Price:</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={manufacturePrice}
                onChange={(e) => setManufacturePrice(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label>Selling Price:</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">
              Approve Product
            </button>
          </form>
        )}
      </div>
    </>
  );
};

export default ApproveFinishedProduct;
