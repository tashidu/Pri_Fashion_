import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import InverntoryManagerNavBar from "../components/InventoryManagerNavBar";

const AddPackingSession = () => {
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [pack6, setPack6] = useState(0);
  const [pack12, setPack12] = useState(0);
  const [extraItems, setExtraItems] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state
  const navigate = useNavigate();

  const totalItems = pack6 * 6 + pack12 * 12 + Number(extraItems);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/finished_product/report/")
      .then((res) => setFinishedProducts(res.data))
      .catch(() => setError("⚠️ Failed to load finished products"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedProduct) {
      setError("Please select a finished product.");
      return;
    }

    const payload = {
      finished_product: selectedProduct,
      number_of_6_packs: Number(pack6),
      number_of_12_packs: Number(pack12),
      extra_items: Number(extraItems)
    };

    try {
      await axios.post("http://localhost:8000/api/packing/sessions/", payload);
      setMessage("✅ Packing session created successfully!");

      setTimeout(() => navigate("/view-packing-sessions"), 1500);
    } catch (err) {
      console.error("Error creating session:", err);

      // ✅ Display detailed backend error if available
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "object"
      ) {
        const firstKey = Object.keys(err.response.data)[0];
        const errorMsg = err.response.data[firstKey];
        setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      } else {
        setError("❌ Failed to create packing session.");
      }
    }
  };

  return (
    <>
      <InverntoryManagerNavBar/>
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <h2 className="mb-3">Add Packing Session</h2>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <label>Select Finished Product:</label>
            <select
              className="form-control"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
            >
              <option value="">-- Choose Product --</option>
              {finishedProducts.map((fp) => (
                <option key={fp.id} value={fp.id}>
                  {fp.product_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-3">
            <label>Number of 12-Packs:</label>
            <input
              type="number"
              value={pack12}
              className="form-control"
              onChange={(e) => setPack12(Math.max(0, Number(e.target.value)))}
              min="0"
              required
            />
          </div>

          <div className="form-group mb-3">
            <label>Number of 6-Packs:</label>
            <input
              type="number"
              value={pack6}
              className="form-control"
              onChange={(e) => setPack6(Math.max(0, Number(e.target.value)))}
              min="0"
              required
            />
          </div>

          <div className="form-group mb-3">
            <label>Extra Items:</label>
            <input
              type="number"
              value={extraItems}
              className="form-control"
              onChange={(e) =>
                setExtraItems(Math.max(0, Number(e.target.value)))
              }
              min="0"
              required
            />
          </div>

          <div className="mt-3 mb-3">
            <strong>Total Packed Quantity: {totalItems}</strong>
          </div>

          <button type="submit" className="btn btn-primary">
            Submit Packing Session
          </button>
        </form>
      </div>
    </>
  );
};

export default AddPackingSession;
