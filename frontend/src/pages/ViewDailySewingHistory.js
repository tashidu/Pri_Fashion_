import React, { useState, useEffect } from "react";
import axios from "axios";

const ViewDailySewingHistory = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch daily sewing history on mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/sewing/daily-records/history/")
      .then((res) => {
        console.log("Fetched daily sewing records:", res.data);
        setRecords(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching daily sewing history:", err);
        setError("Failed to fetch daily sewing history.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading daily sewing history...</p>;
  }
  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <h2>Daily Sewing History</h2>
      {records.length === 0 ? (
        <p>No daily sewing records found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Date</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fabric Name</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fabric Variant</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>XS</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>S</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>M</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>L</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>XL</th>
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Damage</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.fabric_name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {record.fabric_variant_data ? (
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          backgroundColor: record.fabric_variant_data.color,
                          border: "1px solid #ccc",
                          marginRight: "5px"
                        }}
                      />
                      <span>
                        {record.fabric_variant_data.color_name || record.fabric_variant_data.color}
                      </span>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.xs}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.s}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.m}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.l}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.xl}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{record.damage_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewDailySewingHistory;
