import React, { useState, useEffect } from "react";
import axios from "axios";
import OwnerNavBar from "../components/OwnerNavBar";
import { Link } from "react-router-dom";

const ViewProductList = () => {
  const [products, setProducts] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [error, setError] = useState("");

  // Fetch product list on mount
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/sewing/product-list/")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.error("Error fetching product list:", err);
        setError("Failed to fetch product list.");
      });
  }, []);

  // Toggle the expanded view for a product
  const toggleRow = (productId) => {
    setExpandedRows((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  return (
    <>
      <OwnerNavBar />
      <div className="main-content">
        <h2>Product List</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <table className="table table-striped table-bordered">
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Product Name
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Last Update Date
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Total Sewing
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Total Cut
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Remaining
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Status
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Actions
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Approve
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <React.Fragment key={prod.id}>
                <tr>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.product_name}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.last_update_date || "N/A"}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_sewn}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_cut}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.remaining}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.status || "in progress"}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    <button onClick={() => toggleRow(prod.id)}>
                      {expandedRows[prod.id] ? "Hide" : "View"}
                    </button>
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    <Link to={`/approve-finished-product/${prod.id}`}>
                      <button className="btn btn-success">Approve</button>
                    </Link>
                  </td>
                </tr>
                {expandedRows[prod.id] && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        background: "#fafafa",
                        padding: "10px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <h4>Color Details</h4>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              Color
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              XS
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              S
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              M
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              L
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              XL
                            </th>
                            <th
                              style={{
                                padding: "6px",
                                border: "1px solid #ccc",
                              }}
                            >
                              Total Sewing
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {prod.color_details.map((color, idx) => (
                            <tr key={idx}>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.color}
                              </td>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.xs}
                              </td>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.s}
                              </td>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.m}
                              </td>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.l}
                              </td>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.xl}
                              </td>
                              <td
                                style={{
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                }}
                              >
                                {color.total_sewn}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ViewProductList;
