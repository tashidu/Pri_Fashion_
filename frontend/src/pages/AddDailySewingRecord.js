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

    const newDailyTotal =
      parseInt(xs || 0) +
      parseInt(s || 0) +
      parseInt(m || 0) +
      parseInt(l || 0) +
      parseInt(xl || 0);

    if (newDailyTotal > selectedOption.totalCut) {
      return window.alert(
        "The total sewing count exceeds the available cutting quantity for the selected color."
      );
    }

    const payload = {
      cutting_record_fabric: selectedColor,
      xs: parseInt(xs || 0),
      s: parseInt(s || 0),
      m: parseInt(m || 0),
      l: parseInt(l || 0),
      xl: parseInt(xl || 0),
      damage_count: parseInt(damageCount || 0),
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
                  value={sizeMap[size]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value || 0);
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
