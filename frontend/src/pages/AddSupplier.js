import React, { useState } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddSupplier = () => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [telNo, setTelNo] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const supplierData = { name, address, tel_no: telNo };

        try {
            const response = await axios.post('http://localhost:8000/api/addsuppliers/', supplierData);
            if (response.status === 201) {
                setMessage('Supplier added successfully!');
                setName('');
                setAddress('');
                setTelNo('');
            }
        } catch (error) {
            setError('Error adding supplier. Please try again.');
            console.error(error);
        }
    };

    return (
        <>
            <RoleBasedNavBar />
            <div className="main-content">
                <div className='row justify-content-center'>
                    <div className='col-md-6'>
                        <div className='card shadow-sm'>
                            <div className='card-header bg-primary text-white text-center'>
                                <h4>Add Supplier</h4>
                            </div>
                            <div className='card-body'>
                                {message && <div className='alert alert-success'>{message}</div>}
                                {error && <div className='alert alert-danger'>{error}</div>}
                                <form onSubmit={handleSubmit}>
                                    <div className='mb-3'>
                                        <label className='form-label'>Name</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className='mb-3'>
                                        <label className='form-label'>Address</label>
                                        <textarea
                                            className='form-control'
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className='mb-3'>
                                        <label className='form-label'>Telephone Number</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            value={telNo}
                                            onChange={(e) => setTelNo(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type='submit' className='btn btn-primary w-100'>Add Supplier</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddSupplier;
