import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FaStore, FaMapMarkerAlt, FaPhone, FaSave, FaUndo, FaMapMarked, FaSearchLocation } from 'react-icons/fa';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Add custom CSS for the map
const mapStyles = {
    leafletContainer: {
        height: '100%',
        width: '100%',
        borderRadius: '8px',
    },
    mapContainer: {
        height: '300px',
        width: '100%',
        marginBottom: '10px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #ccc',
    }
};

// Add global CSS for Leaflet
const LeafletCSS = () => {
    useEffect(() => {
        // Add CSS to head
        const style = document.createElement('style');
        style.textContent = `
            .leaflet-container {
                height: 100%;
                width: 100%;
                border-radius: 8px;
            }
        `;
        document.head.appendChild(style);

        // Cleanup
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return null;
};

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const AddShop = () => {
    const [shopData, setShopData] = useState({
        name: '',
        address: '',
        contact_number: '',
        district: '',
        latitude: '',
        longitude: ''
    });

    const [mapCenter, setMapCenter] = useState([7.8731, 80.7718]); // Default center of Sri Lanka
    const [mapZoom, setMapZoom] = useState(8);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const mapRef = useRef(null);

    const [nameError, setNameError] = useState('');
    const [addressError, setAddressError] = useState('');
    const [contactNumberError, setContactNumberError] = useState('');
    const [locationError, setLocationError] = useState('');
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

    // Function to get district from coordinates using OpenStreetMap's Nominatim API
    const getDistrictFromCoordinates = async (lat, lon) => {
        setIsSearchingLocation(true);
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);

            if (response.data && response.data.address) {
                const address = response.data.address;
                // Try to get district information - different countries use different terms
                const district = address.district || address.county || address.state_district || address.region || '';

                setShopData(prevState => ({
                    ...prevState,
                    district: district,
                    latitude: lat,
                    longitude: lon
                }));

                // Update map center
                setMapCenter([lat, lon]);
                setMapZoom(13);

                return district;
            }
        } catch (error) {
            console.error("Error fetching location data:", error);
        } finally {
            setIsSearchingLocation(false);
        }
        return '';
    };

    // Function to get coordinates and district from address
    const getLocationFromAddress = async () => {
        if (!shopData.address || shopData.address.trim().length < 5) {
            setLocationError('Please enter a valid address');
            return;
        }

        setIsSearchingLocation(true);
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shopData.address)}&limit=1&addressdetails=1`);

            if (response.data && response.data.length > 0) {
                const result = response.data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

                // Get district information
                await getDistrictFromCoordinates(lat, lon);

                setLocationError('');
            } else {
                setLocationError('Could not find location. Please try a more specific address.');
            }
        } catch (error) {
            console.error("Error searching for address:", error);
            setLocationError('Error searching for location. Please try again.');
        } finally {
            setIsSearchingLocation(false);
        }
    };

    // Map click handler component
    const LocationMarker = () => {
        useMapEvents({
            click: async (e) => {
                const { lat, lng } = e.latlng;
                await getDistrictFromCoordinates(lat, lng);
            },
        });

        return shopData.latitude && shopData.longitude ? (
            <Marker position={[shopData.latitude, shopData.longitude]}>
                <Popup>Shop location</Popup>
            </Marker>
        ) : null;
    };

    // Validate location
    const validateLocation = () => {
        // If we have both latitude and longitude, location is valid
        if (shopData.latitude && shopData.longitude) {
            setLocationError('');
            return true;
        }

        // If we don't have coordinates but have an address, that's acceptable too
        if (shopData.address && shopData.address.trim().length >= 5) {
            setLocationError('');
            return true;
        }

        // Otherwise, show an error
        setLocationError('Please enter an address or coordinates for the shop location');
        return false;
    };

    // Reset form
    const resetForm = () => {
        setShopData({
            name: '',
            address: '',
            contact_number: '',
            district: '',
            latitude: '',
            longitude: ''
        });
        setNameError('');
        setAddressError('');
        setContactNumberError('');
        setLocationError('');
        setValidated(false);
        // Reset map to default view
        setMapCenter([7.8731, 80.7718]);
        setMapZoom(8);
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
        const isLocationValid = validateLocation();

        if (!isNameValid || !isAddressValid || !isContactNumberValid || !isLocationValid || !form.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        setIsSubmitting(true);

        // Prepare data for submission
        const shopDataToSubmit = {
            ...shopData,
            // Convert empty strings to null for backend
            latitude: shopData.latitude || null,
            longitude: shopData.longitude || null,
            district: shopData.district || null
        };

        // Send POST request to the Django backend to create a shop
        axios.post('http://localhost:8000/api/orders/shops/create/', shopDataToSubmit)
            .then(() => {
                setSuccess("Shop created successfully with district information for better analysis!");
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
            <LeafletCSS />
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
                                            <div className="mt-2">
                                                <a href="/shop-analysis" className="alert-link">
                                                    View Shop District Analysis Dashboard
                                                </a>
                                            </div>
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
                                            <Form.Text className="text-muted">
                                                Please enter a name for the shop
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>Shop Address</strong></Form.Label>
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
                                                    placeholder="Enter complete shop address (e.g., 123 Main St, Colombo 03, Sri Lanka)"
                                                    required
                                                    isInvalid={!!addressError}
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={getLocationFromAddress}
                                                    disabled={isSearchingLocation || !shopData.address}
                                                >
                                                    <FaSearchLocation className="me-1" />
                                                    {isSearchingLocation ? 'Searching...' : 'Find'}
                                                </Button>
                                                <Form.Control.Feedback type="invalid">
                                                    {addressError || 'Address is required'}
                                                </Form.Control.Feedback>
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                Please enter a detailed address for the shop location
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>District</strong></Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-light">
                                                    <FaMapMarked className="text-primary" />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    name="district"
                                                    value={shopData.district}
                                                    onChange={handleChange}
                                                    placeholder="District will be auto-detected from map or address"
                                                    readOnly={false}
                                                />
                                            </InputGroup>
                                            <Form.Text className="text-muted">
                                                District information helps with regional sales analysis
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label><strong>Shop Location Map</strong></Form.Label>
                                            <div style={mapStyles.mapContainer}>
                                                <MapContainer
                                                    center={mapCenter}
                                                    zoom={mapZoom}
                                                    style={mapStyles.leafletContainer}
                                                    ref={mapRef}
                                                >
                                                    <TileLayer
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    <LocationMarker />
                                                </MapContainer>
                                            </div>
                                            <Form.Text className="text-muted">
                                                Click on the map to set shop location and get district information
                                            </Form.Text>
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
