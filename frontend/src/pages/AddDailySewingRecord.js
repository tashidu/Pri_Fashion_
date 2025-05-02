import React, { useState, useEffect } from "react";
import axios from "axios";
import InventoryManagerNavBar from "../components/InventoryManagerNavBar";
import Select from "react-select";

const AddDailySewingRecord = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productColors, setProductColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState("");

  const [xs, setXs] = useState(0);
  const [s, setS] = useState(0);
  const [m, setM] = useState(0);
  const [l, setL] = useState(0);
  const [xl, setXl] = useState(0);
  const [damageCount, setDamageCount] = useState(0);

  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/cutting/cutting-records/")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id === parseInt(selectedProduct));
      if (product?.details) {
        const options = product.details.map((detail) => {
          const totalCut =
            (detail.xs || 0) +
            (detail.s || 0) +
            (detail.m || 0) +
            (detail.l || 0) +
            (detail.xl || 0);
          return {
            value: detail.id,
            label:
              detail.fabric_variant_data?.color_name ||
              detail.fabric_variant_data?.color ||
              "N/A",
            color: detail.fabric_variant_data?.color || "#ffffff",
            totalCut,
            // Store individual size quantities for validation
            xs_cut: detail.xs || 0,
            s_cut: detail.s || 0,
            m_cut: detail.m || 0,
            l_cut: detail.l || 0,
            xl_cut: detail.xl || 0,
          };
        });
        setProductColors(options);
      } else {
        setProductColors([]);
      }
      setSelectedColor("");
    }
  }, [selectedProduct, products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    if (!selectedProduct) return window.alert("Please select a Product.");
    if (!selectedColor) return window.alert("Please select a Color.");

    const selectedOption = productColors.find(
      (opt) => opt.value === selectedColor
    );
    if (!selectedOption)
      return window.alert("Selected color details not found.");

    // Validate each size individually
    const parsedXs = parseInt(xs || 0);
    const parsedS = parseInt(s || 0);
    const parsedM = parseInt(m || 0);
    const parsedL = parseInt(l || 0);
    const parsedXl = parseInt(xl || 0);
    const parsedDamage = parseInt(damageCount || 0);

    // Check for negative values
    if (parsedXs < 0 || parsedS < 0 || parsedM < 0 || parsedL < 0 || parsedXl < 0 || parsedDamage < 0) {
      return window.alert("All quantities must be non-negative values.");
    }

    // Check individual size limits
    if (parsedXs > selectedOption.xs_cut) {
      return window.alert(`XS quantity (${parsedXs}) exceeds the available cutting quantity (${selectedOption.xs_cut}).`);
    }
    if (parsedS > selectedOption.s_cut) {
      return window.alert(`S quantity (${parsedS}) exceeds the available cutting quantity (${selectedOption.s_cut}).`);
    }
    if (parsedM > selectedOption.m_cut) {
      return window.alert(`M quantity (${parsedM}) exceeds the available cutting quantity (${selectedOption.m_cut}).`);
    }
    if (parsedL > selectedOption.l_cut) {
      return window.alert(`L quantity (${parsedL}) exceeds the available cutting quantity (${selectedOption.l_cut}).`);
    }
    if (parsedXl > selectedOption.xl_cut) {
      return window.alert(`XL quantity (${parsedXl}) exceeds the available cutting quantity (${selectedOption.xl_cut}).`);
    }

    const newDailyTotal = parsedXs + parsedS + parsedM + parsedL + parsedXl;

    if (newDailyTotal > selectedOption.totalCut) {
      return window.alert(
        "The total sewing count exceeds the available cutting quantity for the selected color."
      );
    }

    const payload = {
      cutting_record_fabric: selectedColor,
      xs: parsedXs,
      s: parsedS,
      m: parsedM,
      l: parsedL,
      xl: parsedXl,
      damage_count: parsedDamage,
    };

    axios
      .post("http://localhost:8000/api/sewing/daily-records/", payload)
      .then(() => {
        setMessage("✅ Daily sewing record added successfully!");
        setSelectedProduct("");
        setProductColors([]);
        setSelectedColor("");
        setXs(0);
        setS(0);
        setM(0);
        setL(0);
        setXl(0);
        setDamageCount(0);
      })
      .catch((err) => {
        console.error("Error adding daily sewing record:", err);
        let errorMessage = "Error adding daily sewing record.";
        if (err.response?.data) {
          errorMessage =
            typeof err.response.data === "object"
              ? Object.values(err.response.data).flat().join("\n")
              : err.response.data;
        }
        window.alert(errorMessage);
        setMessage(errorMessage);
      });
  };

  const ColourOption = ({ data, innerRef, innerProps }) => (
    <div
      ref={innerRef}
      {...innerProps}
      style={{ display: "flex", alignItems: "center", padding: "4px" }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: data.color,
          marginRight: 8,
          border: "1px solid #ccc",
        }}
      />
      <span>{data.label}</span>
    </div>
  );

  return (
    <>
      <InventoryManagerNavBar />
      <div className="main-content">
        <h2>Add Daily Sewing Record</h2>
        {message && (
          <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>
            {message}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Product (Cutting Record):</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="">Select Product</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.product_name ||
                    `${prod.fabric_definition_data?.fabric_name} cut on ${prod.cutting_date}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Color:</label>
            <Select
              options={productColors}
              components={{ Option: ColourOption }}
              value={
                productColors.find((opt) => opt.value === selectedColor) || null
              }
              onChange={(opt) => setSelectedColor(opt?.value)}
              placeholder="Select Color"
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: "#ddd",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#aaa" },
                }),
              }}
            />
          </div>

          {/* Sizes */}
          {["XS", "S", "M", "L", "XL"].map((size) => {
            const sizeMap = { XS: xs, S: s, M: m, L: l, XL: xl };
            return (
              <div key={size} style={{ marginBottom: "15px" }}>
                <label>{size}:</label>
                <input
                  type="number"
                  min="0"
                  value={sizeMap[size]}
                  onChange={(e) => {
                    // Ensure value is not negative
                    const val = Math.max(0, parseInt(e.target.value || 0));
                    switch (size) {
                      case "XS":
                        setXs(val);
                        break;
                      case "S":
                        setS(val);
                        break;
                      case "M":
                        setM(val);
                        break;
                      case "L":
                        setL(val);
                        break;
                      case "XL":
                        setXl(val);
                        break;
                      default:
                        break;
                    }
                  }}
                  style={{ width: "100%", padding: "8px", marginTop: "5px" }}
                />
              </div>
            );
          })}

          {/* Damage */}
          <div style={{ marginBottom: "15px" }}>
            <label>Damage Count:</label>
            <input
              type="number"
              min="0"
              value={damageCount}
              onChange={(e) => {
                // Ensure value is not negative
                const val = Math.max(0, parseInt(e.target.value || 0));
                setDamageCount(val);
              }}
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
