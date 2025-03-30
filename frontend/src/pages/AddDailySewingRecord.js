import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InventoryManagerNavBar from "../components/InventoryManagerNavBar";
import Select from 'react-select';

const AddDailySewingRecord = () => {
  // Dropdown states for product (Cutting Record)
  const [products, setProducts] = useState([]); // fetched from cutting app endpoint
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productColors, setProductColors] = useState([]); // options from selected product's details
  const [selectedColor, setSelectedColor] = useState('');

  // Sewing data
  const [xs, setXs] = useState(0);
  const [s, setS] = useState(0);
  const [m, setM] = useState(0);
  const [l, setL] = useState(0);
  const [xl, setXl] = useState(0);
  const [damageCount, setDamageCount] = useState(0);

  // UI feedback
  const [message, setMessage] = useState('');

  // 1. Fetch all Cutting Records (Products) on mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/cutting/cutting-records/")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      });
  }, []);

  // 2. When a product is selected, extract its details (colors) from the CuttingRecord
  useEffect(() => {
    if (selectedProduct) {
      const product = products.find(p => p.id === parseInt(selectedProduct));
      if (product && product.details) {
        // Map product.details to options (each detail should include color info)
        const options = product.details.map(detail => ({
          value: detail.fabric_variant, // ID of the variant
          label: detail.fabric_variant_data 
                   ? (detail.fabric_variant_data.color_name || detail.fabric_variant_data.color)
                   : "N/A",
          color: detail.fabric_variant_data ? detail.fabric_variant_data.color : "#fff"
        }));
        setProductColors(options);
      } else {
        setProductColors([]);
      }
      setSelectedColor('');
    }
  }, [selectedProduct, products]);

  // 3. Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    if (!selectedProduct) {
      setMessage("Please select a Product.");
      return;
    }
    if (!selectedColor) {
      setMessage("Please select a Color from the Product details.");
      return;
    }

    // Prepare payload; we send the selectedColor (fabric_variant ID) and sewing counts.
    const payload = {
      cutting_detail: selectedColor,
      xs: parseInt(xs),
      s: parseInt(s),
      m: parseInt(m),
      l: parseInt(l),
      xl: parseInt(xl),
      damage_count: parseInt(damageCount)
      // The backend auto-sets the date.
    };

    axios.post("http://localhost:8000/api/sewing/daily-records/", payload)
      .then(() => {
        setMessage("Daily sewing record added successfully!");
        // Reset fields
        setSelectedProduct('');
        setProductColors([]);
        setSelectedColor('');
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

  // Custom option component for React Select to display a color swatch
  const ColourOption = ({ data, innerRef, innerProps }) => (
    <div 
      ref={innerRef} 
      {...innerProps} 
      style={{ display: 'flex', alignItems: 'center', padding: '4px' }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: data.color,
          marginRight: 8,
          border: '1px solid #ccc'
        }}
      />
      <span>{data.label}</span>
    </div>
  );

  return (
    <>
      <InventoryManagerNavBar/>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
        <h2>Add Daily Sewing Record</h2>
        {message && <p>{message}</p>}
        <form onSubmit={handleSubmit}>
          {/* Product Dropdown (Cutting Record) */}
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
                  {prod.product_name ? prod.product_name 
                    : `${prod.fabric_definition_data?.fabric_name} cut on ${prod.cutting_date}`}
                </option>
              ))}
            </select>
          </div>

          {/* Color Dropdown from Selected Product Details */}
          <div style={{ marginBottom: "15px" }}>
            <label>Color:</label>
            <Select
              options={productColors}
              components={{ Option: ColourOption }}
              value={productColors.find(opt => opt.value === selectedColor) || null}
              onChange={(selectedOption) => setSelectedColor(selectedOption.value)}
              placeholder="Select Color"
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: '#ddd',
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#aaa' }
                })
              }}
            />
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
