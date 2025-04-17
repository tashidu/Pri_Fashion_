import React, { useState, useEffect } from "react";
import axios from "axios";

const AddOrderForm = () => {
  const [orderData, setOrderData] = useState({
    shop: "",
    placed_by: "", // will be filled with current user ID
    items: [],
  });

  const [shops, setShops] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const currentUserId = 1; // ⚠️ Replace with actual authenticated user ID from context or token

  useEffect(() => {
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
        placed_by: currentUserId, // use ID, not name
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
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Add New Order</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1">Select Shop</label>
          <select
            name="shop"
            value={orderData.shop}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">-- Select --</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Order Items</h3>
          {orderData.items.map((item, index) => (
            <div key={index} className="border p-3 rounded space-y-2">
              <div>
                <label>Finished Product</label>
                <select
                  name="finished_product"
                  value={item.finished_product}
                  onChange={(e) => handleItemChange(index, e)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">-- Choose --</option>
                  {finishedProducts.map((fp) => (
                    <option key={fp.id} value={fp.id}>
                      {fp.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                name="quantity_6_packs"
                placeholder="Quantity 6-packs"
                value={item.quantity_6_packs}
                onChange={(e) => handleItemChange(index, e)}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                name="quantity_12_packs"
                placeholder="Quantity 12-packs"
                value={item.quantity_12_packs}
                onChange={(e) => handleItemChange(index, e)}
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                name="quantity_extra_items"
                placeholder="Extra items"
                value={item.quantity_extra_items}
                onChange={(e) => handleItemChange(index, e)}
                className="w-full p-2 border rounded"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-red-500 underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Add Item
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Submit Order
        </button>
      </form>
    </div>
  );
};

export default AddOrderForm;
