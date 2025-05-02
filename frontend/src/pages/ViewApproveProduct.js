// src/pages/ViewApprovedProductReport.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

const ViewApprovedProductReport = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/finished_product/report/")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.error("Error fetching approved product report:", err);
        setError("Failed to load approved product report.");
      });
  }, []);

  return (
    <>
      <RoleBasedNavBar />
      <div className="main-content">
        <h2>Approved Product Report</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <table className="table table-striped table-bordered">
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Product Name
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Manufacture Price
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Selling Price
              </th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>XS</th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>S</th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>M</th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>L</th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>XL</th>
              <th style={{ padding: "8px", border: "1px solid #ccc" }}>
                Total Clothing
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => {
              const total =
                (prod.total_sewn_xs || 0) +
                (prod.total_sewn_s || 0) +
                (prod.total_sewn_m || 0) +
                (prod.total_sewn_l || 0) +
                (prod.total_sewn_xl || 0);
              return (
                <tr key={prod.id}>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.product_name}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.manufacture_price}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.selling_price}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_sewn_xs}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_sewn_s}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_sewn_m}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_sewn_l}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {prod.total_sewn_xl}
                  </td>
                  <td style={{ padding: "8px", border: "1px solid #ccc" }}>
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ViewApprovedProductReport;
