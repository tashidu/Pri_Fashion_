import React, { useState } from 'react';
import axios from 'axios';

const AddShopForm = () => {
    const [shopData, setShopData] = useState({
        name: '',
        address: '',
        contact_number: ''
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setShopData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Send POST request to the Django backend to create a shop
        axios.post('http://localhost:8000/api/orders/shops/create/', shopData)
            .then(response => {
                setSuccess("Shop created successfully!");
                setShopData({ name: '', address: '', contact_number: '' });  // Clear form
            })
            .catch(error => {
                setError("An error occurred while creating the shop.");
                console.error("Error:", error);
            });
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl mb-4">Add New Shop</h2>

            {error && <p className="text-red-500">{error}</p>}
            {success && <p className="text-green-500">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Shop Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={shopData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        id="address"
                        name="address"
                        value={shopData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                        type="text"
                        id="contact_number"
                        name="contact_number"
                        value={shopData.contact_number}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>

                <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md">Add Shop</button>
            </form>
        </div>
    );
};

export default AddShopForm;
