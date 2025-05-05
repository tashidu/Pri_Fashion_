import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaMapMarkerAlt, FaPhone, FaSave, FaUndo } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddSupplier = () => {
    // State variables
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [telNo, setTelNo] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // Form validation states
    const [nameError, setNameError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [telNoError, setTelNoError] = useState('');

    // Effect to handle sidebar state based on window size
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Validate telephone number format
    const validateTelNo = (telNo) => {
        // Sri Lankan phone number formats:
        // - Mobile: 07XXXXXXXX or +947XXXXXXXX
        // - Landline: 0XXXXXXXXX or +94XXXXXXXXX
        const phoneRegex = /^(?:(?:\+94)|(?:0))[1-9][0-9]{8}$/;
        if (!phoneRegex.test(telNo)) {
            setTelNoError('Please enter a valid Sri Lankan phone number');
            return false;
        }
        setTelNoError('');
        return true;
    };

    // Validate name
    const validateName = (name) => {
        if (name.trim().length < 2) {
            setNameError('Name must be at least 2 characters');
            return false;
        }
        setNameError('');
        return true;
    };

    // Validate address
    const validateAddress = (address) => {
        if (address.trim().length < 5) {
            setAddressError('Address must be at least 5 characters');
            return false;
        }
        setAddressError('');
        return true;
    };

    // Reset form
    const resetForm = () => {
        setName('');
        setAddress('');
        setTelNo('');
        setNameError('');
        setAddressError('');
        setTelNoError('');
        setValidated(false);
        setMessage('');
        setError('');
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset messages
        setMessage('');
        setError('');

        // Validate form
        const form = e.currentTarget;
        const isNameValid = validateName(name);
        const isAddressValid = validateAddress(address);
        const isTelNoValid = validateTelNo(telNo);

        if (!isNameValid || !isAddressValid || !isTelNoValid || !form.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setIsSubmitting(true);
        const supplierData = { name, address, tel_no: telNo };

        try {
            const response = await axios.post('http://localhost:8000/api/addsuppliers/', supplierData);
            if (response.status === 201) {
                setMessage('✅ Supplier added successfully!');
                resetForm();
            }
        } catch (error) {
            console.error('Error adding supplier:', error);
            if (error.response && error.response.data) {
                // Display more specific error message if available
                const errorMessage = typeof error.response.data === 'string'
                    ? error.response.data
                    : 'Failed to add supplier. Please check your inputs.';
                setError(errorMessage);
            } else {
                setError('Error adding supplier. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <RoleBasedNavBar />
            <div className="main-content" style={{
                marginLeft: isSidebarOpen ? '250px' : '0',
                transition: 'margin-left 0.3s ease-in-out'
            }}>
                <div className="container py-4">
                    <Row className="justify-content-center">
                        <Col md={8} lg={6}>
                            <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
                                <Card.Body>
                                    <h3 className="text-center mb-4">Add Supplier</h3>

                                    {message && (
                                        <Alert variant="success" className="d-flex align-items-center">
                                            {message}
                                        </Alert>
                                    )}

                                    {error && (
                                        <Alert variant="danger" className="d-flex align-items-center">
                                            {error}
                                        </Alert>
                                    )}

                                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>Supplier Name</strong></Form.Label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <FaUser />
                                                </span>
                                                <Form.Control
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => {
                                                        setName(e.target.value);
                                                        validateName(e.target.value);
                                                    }}
                                                    placeholder="Enter supplier name"
                                                    required
                                                    isInvalid={!!nameError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {nameError || 'Supplier name is required'}
                                                </Form.Control.Feedback>
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>Address</strong></Form.Label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <FaMapMarkerAlt />
                                                </span>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    value={address}
                                                    onChange={(e) => {
                                                        setAddress(e.target.value);
                                                        validateAddress(e.target.value);
                                                    }}
                                                    placeholder="Enter supplier address"
                                                    required
                                                    isInvalid={!!addressError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {addressError || 'Address is required'}
                                                </Form.Control.Feedback>
                                            </div>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label><strong>Telephone Number</strong></Form.Label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <FaPhone />
                                                </span>
                                                <Form.Control
                                                    type="text"
                                                    value={telNo}
                                                    onChange={(e) => {
                                                        setTelNo(e.target.value);
                                                        validateTelNo(e.target.value);
                                                    }}
                                                    placeholder="Enter telephone number (e.g., 0771234567)"
                                                    required
                                                    isInvalid={!!telNoError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {telNoError || 'Telephone number is required'}
                                                </Form.Control.Feedback>
                                            </div>
                                            <Form.Text className="text-muted">
                                                Format: 0771234567 or +94771234567
                                            </Form.Text>
                                        </Form.Group>

                                        <Row className="mt-4">
                                            <Col xs={6}>
                                                <Button
                                                    variant="secondary"
                                                    onClick={resetForm}
                                                    className="w-100 d-flex align-items-center justify-content-center"
                                                >
                                                    <FaUndo className="me-2" /> Reset
                                                </Button>
                                            </Col>
                                            <Col xs={6}>
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    className="w-100 d-flex align-items-center justify-content-center"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaSave className="me-2" /> Save
                                                        </>
                                                    )}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </>
    );
};

export default AddSupplier;
