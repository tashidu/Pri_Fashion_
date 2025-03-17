import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { FaPlus, FaTrash } from "react-icons/fa"; // optional icons for plus/trash

const AddFabric = () => {
  // Shared fields (FabricDefinition)
  const [fabricName, setFabricName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dateAdded, setDateAdded] = useState("");

  // Variants (FabricVariant) array
  const [variants, setVariants] = useState([
    { color: "#000000", totalYard: "", pricePerYard: "" },
  ]);

  // Suppliers list for dropdown
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch suppliers on component mount
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/suppliers/")
      .then((response) => {
        console.log("API suppliers response:", response.data); // Debug log
        const supplierOptions = response.data.map((sup) => ({
          value: sup.supplier_id, // Make sure this matches your API response field
          label: sup.name,        // Ensure this is the correct field for the supplier name
        }));
        setSuppliers(supplierOptions);
      })
      .catch((error) => {
        console.error("Error fetching suppliers:", error);
      });
  }, []);
  

  // Add a new variant row
  const handleAddVariant = () => {
    setVariants([
      ...variants,
      { color: "#000000", totalYard: "", pricePerYard: "" },
    ]);
  };

  // Remove a variant row by index
  const handleRemoveVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  // Update a field within a variant
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedSupplier) {
      setMessage("Please select a supplier.");
      return;
    }
    if (!fabricName || !dateAdded) {
      setMessage("Please fill out Fabric Name and Date.");
      return;
    }

    try {
      // 1) Create the FabricDefinition
      const defResponse = await axios.post("http://localhost:8000/api/fabric-definitions/", {
        fabric_name: fabricName,
        supplier: selectedSupplier.value, // send supplier ID
        date_added: dateAdded,
      });

      if (defResponse.status === 201) {
        const definitionId = defResponse.data.id;

        // 2) Create each FabricVariant
        for (let variant of variants) {
          await axios.post("http://localhost:8000/api/fabric-variants/", {
            fabric_definition: definitionId,
            color: variant.color,
            total_yard: parseFloat(variant.totalYard) || 0,
            price_per_yard: parseFloat(variant.pricePerYard) || 0,
          });
        }

        setMessage("Fabric and variants created successfully!");
        // Reset the form
        setFabricName("");
        setSelectedSupplier(null);
        setDateAdded("");
        setVariants([{ color: "#000000", totalYard: "", pricePerYard: "" }]);
      }
    } catch (error) {
      console.error("Error creating fabric or variants:", error);
      setMessage("Error creating fabric or variants.");
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Add Fabric</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        {/* Fabric Name */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Fabric Name</label>
          <input
            type="text"
            value={fabricName}
            onChange={(e) => setFabricName(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        {/* Supplier Dropdown */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Supplier</label>
          <Select
            options={suppliers}
            value={selectedSupplier}
            onChange={setSelectedSupplier}
            placeholder="Select a supplier..."
            isSearchable
          />
        </div>

        {/* Date Added */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Date Added</label>
          <input
            type="date"
            value={dateAdded}
            onChange={(e) => setDateAdded(e.target.value)}
            required
            style={{ width: "100%" }}
          />
        </div>

        {/* Variants Section */}
        <div>
          <h4>Variants</h4>
          {variants.map((variant, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #ccc",
                padding: "1rem",
                marginBottom: "1rem",
                position: "relative",
              }}
            >
              {/* Color */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label>Color</label>
                <input
                  type="color"
                  value={variant.color}
                  onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                  style={{ marginLeft: "1rem" }}
                />
              </div>

              {/* Total Yard */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label>Total Yard</label>
                <input
                  type="number"
                  value={variant.totalYard}
                  onChange={(e) => handleVariantChange(index, "totalYard", e.target.value)}
                  style={{ marginLeft: "1rem" }}
                />
              </div>

              {/* Price per Yard */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label>Price per Yard</label>
                <input
                  type="number"
                  value={variant.pricePerYard}
                  onChange={(e) => handleVariantChange(index, "pricePerYard", e.target.value)}
                  style={{ marginLeft: "1rem" }}
                />
              </div>

              {/* Remove Button */}
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    padding: "0.3rem 0.6rem",
                    cursor: "pointer",
                  }}
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}

          {/* Add Variant Button */}
          <button
            type="button"
            onClick={handleAddVariant}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              backgroundColor: "#0d6efd",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            <FaPlus />
            Add Variant
          </button>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: "1rem" }}>
          <button
            type="submit"
            style={{
              backgroundColor: "#198754",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFabric;
