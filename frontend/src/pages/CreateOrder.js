import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddOrderForm = () => {
    const [orderData, setOrderData] = useState({
        shop: '',
        placed_by: '',
        items: []
    });

    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch shops and products on component mount
    useEffect(() => {
        // Fetch available shops from the API
        axios.get('http://localhost:8000/api/orders/shops/')
            .then(response => setShops(response.data))
            .catch(error => console.error('Error fetching shops:', error));

        // Fetch available products from the API
        axios.get('http://localhost:8000/api/finished_product/report')  // Adjust the URL to fetch products
            .then(response => setProducts(response.data))
            .catch(error => console.error('Error fetching products:', error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setOrderData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...orderData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [name]: value
        };
        setOrderData(prevState => ({
            ...prevState,
            items: updatedItems
        }));
    };

    const addItem = () => {
        setOrderData(prevState => ({
            ...prevState,
            items: [...prevState.items, { finished_product: '', quantity_6_packs: 0, quantity_12_packs: 0, quantity_extra_items: 0 }]
        }));
    };

    const removeItem = (index) => {
        const updatedItems = [...orderData.items];
        updatedItems.splice(index, 1);
        setOrderData(prevState => ({
            ...prevState,
            items: updatedItems
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Send POST request to the Django backend to create an order
        axios.post('http://localhost:8000/api/orders/create/', orderData)
            .then(response => {
                setSuccess("Order created successfully!");
                setOrderData({ shop: '', placed_by: '', items: [] });  // Clear form
            })
            .catch(error => {
                setError("An error occurred while creating the order.");
                console.error("Error:", error);
            });
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl mb-4">Add New Order</h2>

            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="shop" className="block text-sm font-medium text-gray-700">Shop</label>
                    <select
                        id="shop"
                        name="shop"
                        value={orderData.shop}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        required
                    >
                        <option value="">Select a shop</option>
                        {shops.map(shop => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="placed_by" className="block text-sm font-medium text-gray-700">Placed By</label>
                    <input
                        type="text"
                        id="placed_by"
                        name="placed_by"
                        value={orderData.placed_by}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                    <h3 className="text-lg">Order Items</h3>
                    {orderData.items.map((item, index) => (
                        <div key={index} className="border p-4 rounded-md space-y-2">
                            <div>
                                <label htmlFor={`finished_product_${index}`} className="block text-sm font-medium text-gray-700">Product</label>
                                <select
                                    id={`finished_product_${index}`}
                                    name="finished_product"
                                    value={item.finished_product}
                                    onChange={(e) => handleItemChange(index, e)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select a product</option>
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>{product.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor={`quantity_6_packs_${index}`} className="block text-sm font-medium text-gray-700">Quantity (6-packs)</label>
                                <input
                                    type="number"
                                    id={`quantity_6_packs_${index}`}
                                    name="quantity_6_packs"
                                    value={item.quantity_6_packs}
                                    onChange={(e) => handleItemChange(index, e)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor={`quantity_12_packs_${index}`} className="block text-sm font-medium text-gray-700">Quantity (12-packs)</label>
                                <input
                                    type="number"
                                    id={`quantity_12_packs_${index}`}
                                    name="quantity_12_packs"
                                    value={item.quantity_12_packs}
                                    onChange={(e) => handleItemChange(index, e)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor={`quantity_extra_items_${index}`} className="block text-sm font-medium text-gray-700">Extra Items</label>
                                <input
                                    type="number"
                                    id={`quantity_extra_items_${index}`}
                                    name="quantity_extra_items"
                                    value={item.quantity_extra_items}
                                    onChange={(e) => handleItemChange(index, e)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>

                            <button type="button" onClick={() => removeItem(index)} className="text-red-500">Remove Item</button>
                        </div>
                    ))}

                    <button type="button" onClick={addItem} className="w-full py-2 bg-green-600 text-white rounded-md">Add Item</button>
                </div>

                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md">Create Order</button>
            </form>
        </div>
    );
};

export default AddOrderForm;
