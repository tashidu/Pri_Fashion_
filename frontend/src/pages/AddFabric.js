import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'; // Import react-select

const AddFabric = () => {
    // State for form inputs
    const [fabricName, setFabricName] = useState('');
    const [color, setColor] = useState('');
    const [totalYard, setTotalYard] = useState('');
    const [pricePerYard, setPricePerYard] = useState(''); // Added price per yard state
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [message, setMessage] = useState('');

    // Fetch suppliers from API when component mounts
    useEffect(() => {
        axios.get('http://localhost:8000/api/viewsuppliers/')
            .then(response => {
                const supplierOptions = response.data.map(supplier => ({
                    value: supplier.supplier_id, // Supplier ID
                    label: supplier.name // Supplier Name
                }));
                setSuppliers(supplierOptions);
                console.log("Supplier Options:", supplierOptions); 
            })
            .catch(error => {
                console.error('Error fetching suppliers:', error);
            });
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSupplier) {
            setMessage('Please select a supplier.');
            return;
        }

        const fabricData = {
            name: fabricName, 
            color: color, 
            total_yard: parseFloat(totalYard),  // Ensure it's sent as a number
            supplier: selectedSupplier.value, // Send supplier ID
            price_per_yard: parseFloat(pricePerYard), // Send price per yard
        };

        try {
            const response = await axios.post('http://localhost:8000/api/addfabrics/', fabricData);

            if (response.status === 201) {
                setMessage('Fabric added successfully!');
                setFabricName('');
                setColor('');
                setTotalYard('');
                setPricePerYard(''); // Reset price per yard
                setSelectedSupplier(null);
            }
        } catch (error) {
            setMessage('Error adding fabric.');
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Add Fabric</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Fabric Name:</label>
                    <input 
                        type="text" 
                        value={fabricName} 
                        onChange={(e) => setFabricName(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Color:</label>
                    <input 
                        type="text" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Total Yard:</label>
                    <input 
                        type="number" 
                        value={totalYard} 
                        onChange={(e) => setTotalYard(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Price per Yard:</label>
                    <input 
                        type="number" 
                        value={pricePerYard} 
                        onChange={(e) => setPricePerYard(e.target.value)} 
                        required 
                    />
                </div>
                <div>
                    <label>Supplier:</label>
                    <Select 
                        options={suppliers} 
                        value={selectedSupplier} 
                        onChange={setSelectedSupplier} 
                        placeholder="Select a supplier..."
                        isSearchable
                    />
                </div>
                <button type="submit">Add Fabric</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default AddFabric;
