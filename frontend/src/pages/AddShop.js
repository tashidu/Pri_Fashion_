import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FaStore, FaMapMarkerAlt, FaPhone, FaSave, FaUndo } from 'react-icons/fa';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddShop = () => {
    const [shopData, setShopData] = useState({
        name: '',
        address: '',
        contact_number: ''
    });

    const [nameError, setNameError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [contactNumberError, setContactNumberError] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validated, setValidated] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // Effect to handle sidebar state based on window size
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Validate shop name
    const validateName = (name) => {
        if (name.trim().length < 2) {
            setNameError('Shop name must be at least 2 characters');
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

    // Validate contact number (Sri Lankan phone number format)
    const validateContactNumber = (contactNumber) => {
        // Sri Lankan phone number formats:
        // - Mobile: 07XXXXXXXX or +947XXXXXXXX
        // - Landline: 0XXXXXXXXX or +94XXXXXXXXX
        const phoneRegex = /^(?:(?:\+94)|(?:0))[1-9][0-9]{8}$/;
        if (!phoneRegex.test(contactNumber)) {
            setContactNumberError('Please enter a valid Sri Lankan phone number');
            return false;
        }
        setContactNumberError('');
        return true;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setShopData(prevState => ({
            ...prevState,
            [name]: value
        }));

        // Validate on change
        if (name === 'name') {
            validateName(value);
        } else if (name === 'address') {
            validateAddress(value);
        } else if (name === 'contact_number') {
            validateContactNumber(value);
        }
    };

    // Reset form
    const resetForm = () => {
        setShopData({ name: '', address: '', contact_number: '' });
        setNameError('');
        setAddressError('');
        setContactNumberError('');
        setValidated(false);
        // Don't clear message or error when resetting form fields
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Reset messages
        setError(null);
        setSuccess(null);

        // Validate form
        const form = e.currentTarget;
        const isNameValid = validateName(shopData.name);
        const isAddressValid = validateAddress(shopData.address);
        const isContactNumberValid = validateContactNumber(shopData.contact_number);

        if (!isNameValid || !isAddressValid || !isContactNumberValid || !form.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setIsSubmitting(true);

        // Send POST request to the Django backend to create a shop
        axios.post('http://localhost:8000/api/orders/shops/create/', shopData)
            .then(() => {
                setSuccess("Shop created successfully!");
                resetForm();  // Clear form
                setIsSubmitting(false);
            })
            .catch(error => {
                setError("An error occurred while creating the shop.");
                console.error("Error:", error);
                setIsSubmitting(false);
            });
    };

    return (
        <>
            <RoleBasedNavBar />
            <div
                style={{
                    marginLeft: isSidebarOpen ? "240px" : "70px",
                    width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
                    transition: "all 0.3s ease",
                    padding: "20px"
                }}
            >
                <Container fluid>
                    <Row className="justify-content-center">
                        <Col xs={12} md={8} lg={6}>
                            <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body className="p-4">
                                    <h2 className="text-center mb-4">Add Shop</h2>

                                    {error && (
                                        <Alert variant="danger" className="mb-4">
                                            {error}
                                        </Alert>
                                    )}
                                    {success && (
                                        <Alert variant="success" className="mb-4">
                                            {success}
                                        </Alert>
                                    )}

                                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>Shop Name</strong></Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <FaStore className="text-primary" />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    name="name"
                                                    value={shopData.name}
                                                    onChange={handleChange}
                                                    placeholder="Enter shop name"
                                                    required
                                                    isInvalid={!!nameError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {nameError || 'Shop name is required'}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>Address</strong></Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <FaMapMarkerAlt className="text-primary" />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={3}
                                                    name="address"
                                                    value={shopData.address}
                                                    onChange={handleChange}
                                                    placeholder="Enter shop address"
                                                    required
                                                    isInvalid={!!addressError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {addressError || 'Address is required'}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label><strong>Contact Number</strong></Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <FaPhone className="text-primary" />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    name="contact_number"
                                                    value={shopData.contact_number}
                                                    onChange={handleChange}
                                                    placeholder="Enter contact number (e.g., 0771234567)"
                                                    required
                                                    isInvalid={!!contactNumberError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    {contactNumberError || 'Contact number is required'}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                Format: 0771234567 or +94771234567
                                            </Form.Text>
                                        </Form.Group>

                                        <div className="d-flex gap-2 mt-4">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                className="w-100 py-2"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave className="me-2" /> Save Shop
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline-secondary"
                                                className="w-100 py-2"
                                                onClick={resetForm}
                                                disabled={isSubmitting}
                                            >
                                                <FaUndo className="me-2" /> Reset
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default AddShop;
