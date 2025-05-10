import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, Spinner, Image, Modal, Carousel } from 'react-bootstrap';
import { FaImage, FaInfoCircle, FaBoxes, FaMoneyBillWave, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import SalesTeamNavBar from '../components/SalesTeamNavBar';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SalesProductImageViewer.css';

const SalesProductImageViewer = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Effect to handle sidebar state based on window size
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch products data
    useEffect(() => {
        setLoading(true);
        axios
            .get("http://localhost:8000/api/finished_product/sales-products/")
            .then((res) => {
                console.log("API Response:", res.data);
                // Filter out products with no stock
                const productsWithStock = res.data.filter(product => {
                    const stockLevel = product.packing_inventory?.total_quantity || product.available_quantity;
                    return stockLevel > 0;
                });
                setProducts(productsWithStock);
                setLoading(false);

                if (productsWithStock.length === 0) {
                    setError("No products with stock found.");
                }
            })
            .catch((err) => {
                console.error("Error fetching product list:", err);
                setError("Failed to fetch product list. Please try again later.");
                setLoading(false);
            });
    }, []);

    // Format currency with LKR symbol
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "N/A";
        return `Rs. ${parseFloat(amount).toFixed(2)}`;
    };

    // Open product detail modal
    const openProductModal = (product, index) => {
        setSelectedProduct(product);
        setCurrentIndex(index);
        setShowModal(true);
    };

    // Navigate to next product in modal
    const nextProduct = () => {
        const newIndex = (currentIndex + 1) % products.length;
        setSelectedProduct(products[newIndex]);
        setCurrentIndex(newIndex);
    };

    // Navigate to previous product in modal
    const prevProduct = () => {
        const newIndex = (currentIndex - 1 + products.length) % products.length;
        setSelectedProduct(products[newIndex]);
        setCurrentIndex(newIndex);
    };

    // Render product cards in a grid
    const renderProductGrid = () => (
        <Row className="g-4">
            {loading ? (
                <Col xs={12} className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading products...</p>
                </Col>
            ) : products.length === 0 ? (
                <Col xs={12} className="text-center py-5">
                    <div className="empty-state">
                        <FaImage size={50} className="text-secondary mb-3" />
                        <h4>No Products Found</h4>
                        <p className="text-muted">There are no products with stock available.</p>
                    </div>
                </Col>
            ) : (
                products.map((product, index) => (
                    <Col key={product.id} xs={6} sm={4} md={3} lg={2} className="mb-4">
                        <Card
                            className="product-image-card h-100 border-0 shadow-sm"
                            onClick={() => openProductModal(product, index)}
                        >
                            <div className="image-container">
                                {product.product_images && product.product_images.length > 0 ? (
                                    <Image
                                        src={product.product_images[0]}
                                        alt={product.product_name}
                                        className="card-img-top"
                                    />
                                ) : product.product_image ? (
                                    <Image
                                        src={product.product_image}
                                        alt={product.product_name}
                                        className="card-img-top"
                                    />
                                ) : (
                                    <div className="no-image-placeholder">
                                        <FaImage size={30} />
                                        <p>No Image</p>
                                    </div>
                                )}
                                <Badge
                                    bg="success"
                                    className="stock-badge"
                                >
                                    {product.packing_inventory?.total_quantity || product.available_quantity} in stock
                                </Badge>
                            </div>
                            <Card.Body className="text-center p-2">
                                <Card.Title className="product-title">{product.product_name}</Card.Title>
                                <Card.Text className="price-tag">{formatCurrency(product.selling_price)}</Card.Text>
                                <Button variant="outline-primary" size="sm" className="view-more-btn">
                                    View More
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))
            )}
        </Row>
    );

    // Product detail modal
    const renderProductModal = () => {
        if (!selectedProduct) return null;

        const stockLevel = selectedProduct.packing_inventory?.total_quantity || selectedProduct.available_quantity;

        return (
            <Modal
                show={showModal}
                onHide={() => setShowModal(false)}
                size="lg"
                centered
                className="product-detail-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>{selectedProduct.product_name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md={6} className="image-section">
                            {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                                <div className="modal-image-container">
                                    <Carousel
                                        activeIndex={activeImageIndex}
                                        onSelect={(index) => setActiveImageIndex(index)}
                                        interval={null}
                                    >
                                        {selectedProduct.product_images.map((imageUrl, idx) => (
                                            <Carousel.Item key={idx}>
                                                <div className="carousel-image-container">
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`${selectedProduct.product_name} - Image ${idx + 1}`}
                                                        fluid
                                                        className="product-detail-image"
                                                    />
                                                </div>
                                                <Carousel.Caption>
                                                    <p className="image-counter">Image {idx + 1} of {selectedProduct.product_images.length}</p>
                                                </Carousel.Caption>
                                            </Carousel.Item>
                                        ))}
                                    </Carousel>
                                </div>
                            ) : selectedProduct.product_image ? (
                                <div className="modal-image-container">
                                    <Image
                                        src={selectedProduct.product_image}
                                        alt={selectedProduct.product_name}
                                        fluid
                                        className="product-detail-image"
                                    />
                                </div>
                            ) : (
                                <div className="no-image-placeholder large">
                                    <FaImage size={60} />
                                    <p>No Image Available</p>
                                </div>
                            )}
                        </Col>
                        <Col md={6} className="details-section">
                            <div className="product-info">
                                <h4><FaInfoCircle className="me-2" />Product Details</h4>
                                <p className="product-description">
                                    {selectedProduct.product_name} - High quality garment available for order.
                                </p>

                                <div className="price-section">
                                    <h5><FaMoneyBillWave className="me-2" />Pricing</h5>
                                    <div className="price-tag-large">
                                        {formatCurrency(selectedProduct.selling_price)}
                                    </div>
                                </div>

                                <div className="inventory-section">
                                    <h5><FaBoxes className="me-2" />Inventory</h5>
                                    <div className="stock-info">
                                        <div className="stock-item">
                                            <span className="label">6-Packs:</span>
                                            <span className="value">{selectedProduct.packing_inventory?.number_of_6_packs || 0}</span>
                                        </div>
                                        <div className="stock-item">
                                            <span className="label">12-Packs:</span>
                                            <span className="value">{selectedProduct.packing_inventory?.number_of_12_packs || 0}</span>
                                        </div>
                                        <div className="stock-item">
                                            <span className="label">Extra Items:</span>
                                            <span className="value">{selectedProduct.packing_inventory?.extra_items || 0}</span>
                                        </div>
                                        <div className="stock-item total">
                                            <span className="label">Total Available:</span>
                                            <span className="value">{stockLevel}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <div className="navigation-buttons">
                        <Button variant="outline-secondary" onClick={prevProduct}>
                            <FaArrowLeft className="me-2" />Previous
                        </Button>
                        <Button variant="outline-secondary" onClick={nextProduct}>
                            Next<FaArrowRight className="ms-2" />
                        </Button>
                    </div>
                    <Button variant="primary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    };

    return (
        <>
            <SalesTeamNavBar />
            <div
                style={{
                    marginLeft: isSidebarOpen ? "240px" : "70px",
                    width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
                    transition: "all 0.3s ease",
                    padding: "20px"
                }}
            >
                <Container fluid>
                    <div className="page-header">
                        <h2>Product Gallery</h2>
                        <p className="text-muted">Browse product images and check stock availability</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="product-gallery">
                        {renderProductGrid()}
                    </div>

                    {renderProductModal()}
                </Container>
            </div>
        </>
    );
};

export default SalesProductImageViewer;
