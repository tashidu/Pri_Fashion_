import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InventoryManagerNavBar from "../components/InventoryManagerNavBar";


const AddDailySewingRecord = () => {
  // Dropdown states
  const [fabricDefinitions, setFabricDefinitions] = useState([]);
  const [selectedDefinition, setSelectedDefinition] = useState('');
  const [fabricVariants, setFabricVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState('');

  // Sewing data
  const [xs, setXs] = useState(0);
  const [s, setS] = useState(0);
  const [m, setM] = useState(0);
  const [l, setL] = useState(0);
  const [xl, setXl] = useState(0);
  const [damageCount, setDamageCount] = useState(0);

  // UI feedback
  const [message, setMessage] = useState('');

  // 1. Fetch all FabricDefinitions on mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/fabric-definitions/")
      .then((res) => {
        setFabricDefinitions(res.data);
      })
      .catch((err) => {
        console.error("Error fetching fabric definitions:", err);
      });
  }, []);

  // 2. Whenever selectedDefinition changes, fetch variants for that definition
  useEffect(() => {
    if (selectedDefinition) {
      axios.get(`http://localhost:8000/api/fabric-definitions/${selectedDefinition}/variants/`)
        .then((res) => {
          setFabricVariants(res.data);
        })
        .catch((err) => {
          console.error("Error fetching variants:", err);
        });
    } else {
      // If no definition is selected, clear out the variants list
      setFabricVariants([]);
      setSelectedVariant('');
    }
  }, [selectedDefinition]);

  // 3. Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!selectedDefinition) {
      setMessage("Please select a Fabric Definition.");
      return;
    }
    if (!selectedVariant) {
      setMessage("Please select a Fabric Variant.");
      return;
    }

    // Prepare payload
    const payload = {
      fabric_variant: selectedVariant,
      xs: parseInt(xs),
      s: parseInt(s),
      m: parseInt(m),
      l: parseInt(l),
      xl: parseInt(xl),
      damage_count: parseInt(damageCount)
      // date auto-set on backend
    };

    axios.post("http://localhost:8000/api/sewing/daily-records/", payload)
      .then(() => {
        setMessage("Daily sewing record added successfully!");
        // Reset fields
        setSelectedVariant('');
        setXs(0);
        setS(0);
        setM(0);
        setL(0);
        setXl(0);
        setDamageCount(0);
      })
      .catch((err) => {
        console.error("Error adding daily sewing record:", err);
        setMessage("Error adding daily sewing record.");
      });
  };

  return (
    <>
     <InventoryManagerNavBar/>

    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Add Daily Sewing Record</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        {/* Fabric Definition Dropdown */}
        <div style={{ marginBottom: "15px" }}>
          <label>Fabric Definition:</label>
          <select
            value={selectedDefinition}
            onChange={(e) => setSelectedDefinition(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Select Fabric Definition</option>
            {fabricDefinitions.map((defn) => (
              <option key={defn.id} value={defn.id}>
                {defn.fabric_name}
              </option>
            ))}
          </select>
        </div>

        {/* Fabric Variant Dropdown */}
        <div style={{ marginBottom: "15px" }}>
          <label>Fabric Variant:</label>
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          >
            <option value="">Select Variant</option>
            {fabricVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.color_name || variant.color}
              </option>
            ))}
          </select>
        </div>

        {/* XS */}
        <div style={{ marginBottom: "15px" }}>
          <label>XS:</label>
          <input
            type="number"
            value={xs}
            onChange={(e) => setXs(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* S */}
        <div style={{ marginBottom: "15px" }}>
          <label>S:</label>
          <input
            type="number"
            value={s}
            onChange={(e) => setS(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* M */}
        <div style={{ marginBottom: "15px" }}>
          <label>M:</label>
          <input
            type="number"
            value={m}
            onChange={(e) => setM(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* L */}
        <div style={{ marginBottom: "15px" }}>
          <label>L:</label>
          <input
            type="number"
            value={l}
            onChange={(e) => setL(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* XL */}
        <div style={{ marginBottom: "15px" }}>
          <label>XL:</label>
          <input
            type="number"
            value={xl}
            onChange={(e) => setXl(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        {/* Damage Count */}
        <div style={{ marginBottom: "15px" }}>
          <label>Damage Count:</label>
          <input
            type="number"
            value={damageCount}
            onChange={(e) => setDamageCount(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>
          Submit Daily Sewing Record
        </button>
      </form>
    </div>
    </>
  );
};

export default AddDailySewingRecord;
