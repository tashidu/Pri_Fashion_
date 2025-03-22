import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import OwnerNavBar from "../components/OwnerNavBar";

const ViewFabricVariants = () => {
  const { id } = useParams(); // FabricDefinition ID from URL
  const [fabricDetail, setFabricDetail] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`http://localhost:8000/api/fabric-definitions/${id}/`)
      .then((response) => {
        setFabricDetail(response.data);
      })
      .catch((error) => {
        console.error("Error fetching fabric definition:", error);
        setMessage("Error loading fabric details.");
      });
  }, [id]);

  if (!fabricDetail) {
    return (
      <>
        <OwnerNavBar />
        <div className="container main-content mt-4">
          {message ? (
            <div className="alert alert-danger text-center">{message}</div>
          ) : (
            <p>Loading fabric details...</p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <OwnerNavBar />
      <div className="container main-content mt-4">
        <h2 className="text-center mb-4">
          Variants for Fabric: {fabricDetail.fabric_name}
        </h2>
        {message && <div className="alert alert-danger text-center">{message}</div>}
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="thead-dark">
              <tr>
                <th>Color</th>
                <th>Total Yard</th>
                <th>Price per Yard</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {fabricDetail.variants.map((variant) => (
                <tr key={variant.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="color"
                        value={variant.color}
                        readOnly
                        style={{ marginRight: "0.5rem", border: "none" }}
                      />
                      <span>{variant.color}</span>
                    </div>
                  </td>
                  <td>{variant.total_yard}</td>
                  <td>{variant.price_per_yard}</td>
                  <td>{(variant.total_yard * variant.price_per_yard).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-3">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewFabricVariants;
