import React, { useState, useEffect } from "react";
import axios from "axios";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

const ViewCutting = () => {
  const [cuttingRecords, setCuttingRecords] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // e.g., { recordId: true/false }
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch cutting records on mount
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/cutting/cutting-records/")
      .then((res) => {
        console.log("Fetched cutting records:", res.data);
        setCuttingRecords(res.data);
      })
      .catch((err) => {
        console.error("Error fetching cutting records:", err);
        setError("Failed to fetch cutting records.");
      });
  }, []);

  // Helper to calculate aggregates for each record
  const getAggregates = (record) => {
    let totalYard = 0;
    let totalQuantity = 0;
    const variantSet = new Set();

    if (record.details) {
      record.details.forEach((detail) => {
        totalYard += parseFloat(detail.yard_usage || 0);
        const sizesSum =
          (detail.xs || 0) +
          (detail.s || 0) +
          (detail.m || 0) +
          (detail.l || 0) +
          (detail.xl || 0);
        totalQuantity += sizesSum;
        // Use nested data if available, otherwise fallback to raw ID
        const variantId = detail.fabric_variant_data
          ? detail.fabric_variant_data.id
          : detail.fabric_variant;
        variantSet.add(variantId);
      });
    }

    return { totalYard, totalQuantity, totalVariants: variantSet.size };
  };

  // Toggle expanded rows
  const toggleRow = (recordId) => {
    setExpandedRows((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
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
        <h2>Cutting Records</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Product Name
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Fabric Name
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Cutting Date
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Total Quantity
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Yard Usage
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Variants Used
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {cuttingRecords.map((record) => {
              const { totalYard, totalQuantity, totalVariants } = getAggregates(record);
              // Get product name; fallback to fabric name if product_name is empty
              const productName = record.product_name || "N/A";
              const fabricName = record.fabric_definition_data?.fabric_name || "N/A";

              return (
                <React.Fragment key={record.id}>
                  <tr>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      {productName}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      {fabricName}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      {record.cutting_date}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      {totalQuantity}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      {totalYard}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      {totalVariants}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                      <button onClick={() => toggleRow(record.id)}>
                        {expandedRows[record.id] ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expandedRows[record.id] && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          background: "#fafafa",
                          border: "1px solid #ccc",
                          padding: "10px",
                        }}
                      >
                        <h4>Color Usage Details</h4>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                Variant
                              </th>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                Yard Usage
                              </th>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                XS
                              </th>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                S
                              </th>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                M
                              </th>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                L
                              </th>
                              <th style={{ padding: "6px", border: "1px solid #ccc" }}>
                                XL
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {record.details?.map((detail, idx) => (
                              <tr key={idx}>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <div
                                      style={{
                                        width: "16px",
                                        height: "16px",
                                        backgroundColor:
                                          detail.fabric_variant_data?.color || "#fff",
                                        border: "1px solid #ccc",
                                        marginRight: "5px",
                                      }}
                                    />
                                    <span>
                                      {detail.fabric_variant_data?.color_name ||
                                        detail.fabric_variant_data?.color ||
                                        detail.fabric_variant ||
                                        "N/A"}
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  {detail.yard_usage}
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  {detail.xs}
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  {detail.s}
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  {detail.m}
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  {detail.l}
                                </td>
                                <td style={{ padding: "6px", border: "1px solid #ccc" }}>
                                  {detail.xl}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ViewCutting;
