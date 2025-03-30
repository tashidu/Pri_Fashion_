import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import OwnerNavBar from "../components/OwnerNavBar";

const ViewDailySewingHistory = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date"); // default sort by date
  const [sortOrder, setSortOrder] = useState("desc");   // 'asc' or 'desc'

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

  // Filter records based on search term (product_name search)
  const filteredRecords = records.filter(record =>
    record.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort records based on sortField and sortOrder
  const sortedRecords = filteredRecords.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    // If sorting by date, convert to Date objects
    if (sortField === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else {
      // Otherwise, ensure string comparison
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <>
      <OwnerNavBar />
      <div className="main-content">
        <h2>Daily Sewing History</h2>
        
        {error && <p style={{ color: "red" }}>{error}</p>}
        
        {/* Navigation Button */}
        <div style={{ marginBottom: "20px" }}>
          <Link to="/viewproductlist">
            <button className="btn btn-primary">View Product List</button>
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Sorting Controls */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <div>
            <label>Sort by:</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              style={{ padding: "8px", marginLeft: "5px" }}
            >
              <option value="date">Date</option>
              <option value="product_name">Product Name</option>
              <option value="color">Color</option>
            </select>
          </div>
          <div>
            <label>Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ padding: "8px", marginLeft: "5px" }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <table className="table table-striped table-bordered">
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
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
            {sortedRecords.map((record, idx) => (
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
                        marginRight: "8px"
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
