import React, { useState } from 'react';
import axios from 'axios';

const AddSupplier = () => {
    // State to hold the form input values
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [telNo, setTelNo] = useState('');

    // State to handle form submission response
    const [message, setMessage] = useState('');

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare the data to send
        const supplierData = {
            name: name,
            address: address,
            tel_no: telNo,
        };

        try {
            // API call to backend to create a new supplier
            const response = await axios.post('http://localhost:8000/api//', supplierData);

            // On success, display a success message
            if (response.status === 201) {
                setMessage('Supplier added successfully!');
            }
        } catch (error) {
            // Handle errors
            setMessage('Error adding supplier.');
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Add Supplier</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name:</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Address:</label>
                    <textarea 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Telephone Number:</label>
                    <input 
                        type="text" 
                        value={telNo} 
                        onChange={(e) => setTelNo(e.target.value)} 
                        required 
                    />
                </div>
                <button type="submit">Add Supplier</button>
            </form>

            {/* Display success or error message */}
            {message && <p>{message}</p>}
        </div>
    );
};

export default AddSupplier;
