import React, { useState, useEffect } from "react";
import axios from "axios";
import OwnerNavBar from "../components/OwnerNavBar";
import { Link } from "react-router-dom";

const ViewProductList = () => {
  const [products, setProducts] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [error, setError] = useState("");

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
              <th>Product Name</th>
              <th>Last Update Date</th>
              <th>Total Sewing</th>
              <th>Total Cut</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Approve</th>
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <React.Fragment key={prod.id}>
                <tr>
                  <td>{prod.product_name}</td>
                  <td>{prod.last_update_date || "N/A"}</td>
                  <td>{prod.total_sewn}</td>
                  <td>{prod.total_cut}</td>
                  <td>{prod.remaining}</td>
                  <td>{prod.status || "in progress"}</td>
                  <td>
                    <button onClick={() => toggleRow(prod.id)}>
                      {expandedRows[prod.id] ? "Hide" : "View"}
                    </button>
                  </td>
                  <td>
                    <Link to={`/approve-finished-product/${prod.id}`}>
                      <button className="btn btn-success">Approve</button>
                    </Link>
                  </td>
                </tr>

                {expandedRows[prod.id] && (
                  <tr>
                    <td colSpan={8} style={{ background: "#fafafa" }}>
                      <h4>Color Details</h4>
                      <table className="table table-bordered">
                        <thead>
                          <tr>
                            <th>Color</th>
                            <th>XS</th>
                            <th>S</th>
                            <th>M</th>
                            <th>L</th>
                            <th>XL</th>
                            <th>Total Sewing</th>
                            {/* Optional: Action button to open sewing form */}
                          </tr>
                        </thead>
                        <tbody>
                          {prod.color_details.map((color, idx) => (
                            <tr key={idx}>
                              <td>{color.color}</td>
                              <td>{color.xs}</td>
                              <td>{color.s}</td>
                              <td>{color.m}</td>
                              <td>{color.l}</td>
                              <td>{color.xl}</td>
                              <td>{color.total_sewn}</td>
                              {/* ✅ If you later want to allow sewing actions per color:
                                Pass color.id here, which is cutting_cuttingrecordfabric.id */}
                              {/* <td>
                                <button onClick={() => handleSewing(color.id)}>Sew</button>
                              </td> */}
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
