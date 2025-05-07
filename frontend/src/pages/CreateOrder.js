import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";

const AddOrderForm = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [orderData, setOrderData] = useState({
    shop: "",
    placed_by: "", // will be filled with current user ID
    items: [],
  });

  const [shops, setShops] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId, setUserId] = useState(null);

  // Effect to handle sidebar state based on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get user information and fetch data
  useEffect(() => {
    // Get user ID from token
    const token = localStorage.getItem('token');
    if (token) {
      // Decode the token to get user ID (simplified approach)
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setUserId(tokenData.user_id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    // Fetch shops and products
    axios.get("http://localhost:8000/api/orders/shops/")
      .then((res) => setShops(res.data))
      .catch((err) => console.error("Error fetching shops", err));

    axios.get("http://localhost:8000/api/finished_product/report")
      .then((res) => setFinishedProducts(res.data))
      .catch((err) => console.error("Error fetching finished products", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...orderData.items];
    updatedItems[index][name] = value;
    setOrderData({ ...orderData, items: updatedItems });
  };

  const addItem = () => {
    setOrderData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          finished_product: "",
          quantity_6_packs: 0,
          quantity_12_packs: 0,
          quantity_extra_items: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const updated = [...orderData.items];
    updated.splice(index, 1);
    setOrderData({ ...orderData, items: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!orderData.shop || orderData.items.length === 0) {
      setError("Please select a shop and add at least one item.");
      return;
    }

    try {
      // Step 1: Create the order
      const orderRes = await axios.post("http://localhost:8000/api/orders/orders/create/", {
        shop: orderData.shop,
        placed_by: userId || 1, // use actual user ID or fallback to 1
      });

      const orderId = orderRes.data.id;

      // Step 2: Create each order item
      const itemRequests = orderData.items.map((item) =>
        axios.post("http://localhost:8000/api/orders/orders/items/", {
          order: orderId,
          finished_product: item.finished_product,
          quantity_6_packs: item.quantity_6_packs,
          quantity_12_packs: item.quantity_12_packs,
          quantity_extra_items: item.quantity_extra_items,
        })
      );

      await Promise.all(itemRequests);

      setSuccess("Order created successfully!");
      setOrderData({ shop: "", placed_by: "", items: [] });
    } catch (err) {
      console.error("Error submitting order", err);
      setError("An error occurred while submitting the order.");
    }
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          transition: "margin-left 0.3s ease",
          padding: "1.5rem",
        }}
      >
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-center fw-bold text-primary">Create New Order</h2>
              <p className="text-center text-muted">Add a new order for a shop</p>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && (
            <div className="alert alert-success">
              {success}
              <div className="mt-2">
                <button
                  className="btn btn-primary me-2"
                  onClick={() => navigate('/order-list')}
                >
                  View All Orders
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSuccess(null);
                    setOrderData({ shop: "", placed_by: "", items: [] });
                  }}
                >
                  Create Another Order
                </button>
              </div>
            </div>
          )}

      <form onSubmit={handleSubmit} className="card shadow-sm">
        <div className="card-body">
          <div className="mb-4">
            <label className="form-label">Select Shop</label>
            <select
              name="shop"
              value={orderData.shop}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">-- Select Shop --</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <h5 className="card-title mb-3">Order Items</h5>
            {orderData.items.length === 0 && (
              <div className="alert alert-info">
                No items added yet. Click "Add Item" to start adding products to this order.
              </div>
            )}
            {orderData.items.map((item, index) => (
              <div key={index} className="card mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Finished Product</label>
                    <select
                      name="finished_product"
                      value={item.finished_product}
                      onChange={(e) => handleItemChange(index, e)}
                      className="form-select"
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
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Quantity 6-packs</label>
                      <input
                        type="number"
                        name="quantity_6_packs"
                        min="0"
                        value={item.quantity_6_packs}
                        onChange={(e) => handleItemChange(index, e)}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Quantity 12-packs</label>
                      <input
                        type="number"
                        name="quantity_12_packs"
                        min="0"
                        value={item.quantity_12_packs}
                        onChange={(e) => handleItemChange(index, e)}
                        className="form-control"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Extra items</label>
                      <input
                        type="number"
                        name="quantity_extra_items"
                        min="0"
                        value={item.quantity_extra_items}
                        onChange={(e) => handleItemChange(index, e)}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn btn-outline-danger btn-sm"
                  >
                    <i className="bi bi-trash"></i> Remove Item
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="btn btn-success mb-3"
            >
              <i className="bi bi-plus-circle"></i> Add Item
            </button>
          </div>
        </div>
        <div className="card-footer bg-white d-grid">
          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
          >
            Submit Order
          </button>
        </div>
      </form>
        </div>
      </div>
    </>
  );
};

export default AddOrderForm;
