import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import OwnerNavBar from "../components/OwnerNavBar";

const ViewDailySewingHistory = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/sewing/history/daily/")
      .then((res) => {
        setRecords(res.data);
      })
      .catch((err) => {
        console.error("Error fetching daily sewing history:", err);
        setError("Failed to load daily sewing history.");
      });
  }, []);

  return (
    <>
      <OwnerNavBar />
      <div className="main-content">
      <div style={{ marginBottom: "20px" }}>
          <Link to="/viewproductlist">
            <button className="btn btn-primary">View Product List</button>
          </Link>
        </div>
        <h2>Daily Sewing History</h2>
        
        {error && <p style={{ color: "red" }}>{error}</p>}
        {/* Navigation Button */}
        <div style={{ marginBottom: "20px" }}>
          <Link to="/viewproductlist">
            <button className="btn btn-primary">View Product List</button>
          </Link>
        </div>
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product Name</th>
              <th>Color</th>
              <th>XS</th>
              <th>S</th>
              <th>M</th>
              <th>L</th>
              <th>XL</th>
              <th>Damage Count</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={idx}>
                <td>{record.date}</td>
                <td>{record.product_name}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: record.color,
                        border: "1px solid #ccc",
                        marginRight: "8px",
                      }}
                    />
                    <span>{record.color}</span>
                  </div>
                </td>
                <td>{record.xs}</td>
                <td>{record.s}</td>
                <td>{record.m}</td>
                <td>{record.l}</td>
                <td>{record.xl}</td>
                <td>{record.damage_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ViewDailySewingHistory;
