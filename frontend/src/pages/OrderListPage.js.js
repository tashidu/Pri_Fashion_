import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderListPage = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/orders/orders/create/');
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    const viewOrderItems = async (orderId) => {
        try {
            const response = await axios.get(`http://localhost:8000/api/orders/orders/${orderId}/`);
            setSelectedOrderItems(response.data.items);
            setSelectedOrderId(orderId);
        } catch (error) {
            console.error('Failed to fetch order items:', error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Orders</h2>
            <table className="w-full border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-4 py-2">Order ID</th>
                        <th className="border px-4 py-2">Shop</th>
                        <th className="border px-4 py-2">Status</th>
                        <th className="border px-4 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td className="border px-4 py-2">{order.id}</td>
                            <td className="border px-4 py-2">{order.shop_name || order.shop}</td>
                            <td className="border px-4 py-2">{order.status}</td>
                            <td className="border px-4 py-2">
                                <button
                                    onClick={() => viewOrderItems(order.id)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded"
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedOrderId && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">
                        Order Items for Order #{selectedOrderId}
                    </h3>
                    {selectedOrderItems.length > 0 ? (
                        <table className="w-full border border-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="border px-4 py-2">Product</th>
                                    <th className="border px-4 py-2">6 Packs</th>
                                    <th className="border px-4 py-2">12 Packs</th>
                                    <th className="border px-4 py-2">Extra Items</th>
                                    <th className="border px-4 py-2">Total Units</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrderItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="border px-4 py-2">{item.finished_product_name || item.finished_product}</td>
                                        <td className="border px-4 py-2">{item.quantity_6_packs}</td>
                                        <td className="border px-4 py-2">{item.quantity_12_packs}</td>
                                        <td className="border px-4 py-2">{item.quantity_extra_items}</td>
                                        <td className="border px-4 py-2">{item.total_units}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No items in this order.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderListPage;