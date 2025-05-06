// src/pages/ApproveFinishedProduct.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col, Spinner, Image, Modal, ProgressBar, Badge, Tabs, Tab, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  FaCheck, FaUpload, FaImage, FaTags, FaInfoCircle, FaMoneyBillWave,
  FaArrowRight, FaPercentage, FaBoxOpen, FaTshirt, FaClipboardList,
  FaTrash, FaUndo, FaExclamationTriangle
} from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import './ApproveFinishedProduct.css';

const ApproveFinishedProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Basic form state
  const [manufacturePrice, setManufacturePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [productNotes, setProductNotes] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Image handling state
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Product details state
  const [productDetails, setProductDetails] = useState(null);
  const [fabricDetails, setFabricDetails] = useState([]);
  const [sizeQuantities, setSizeQuantities] = useState({
    xs: 0, s: 0, m: 0, l: 0, xl: 0
  });

  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [profitMargin, setProfitMargin] = useState(0);

  // Calculate profit margin whenever prices change
  useEffect(() => {
    if (manufacturePrice && sellingPrice) {
      const mPrice = parseFloat(manufacturePrice);
      const sPrice = parseFloat(sellingPrice);

      if (mPrice > 0 && sPrice > 0) {
        const margin = ((sPrice - mPrice) / sPrice) * 100;
        setProfitMargin(margin.toFixed(2));
      }
    }
  }, [manufacturePrice, sellingPrice]);

  // State for retry mechanism
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Function to fetch product data with retry mechanism
  const fetchProductData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch approval status
      const approvalRes = await axios.get(`http://localhost:8000/api/finished_product/status/${id}/`);

      // Fetch cutting record details
      const cuttingRes = await axios.get(`http://localhost:8000/api/cutting/records/${id}/`);

      if (approvalRes.data && approvalRes.data.is_approved) {
        setIsApproved(true);
        setManufacturePrice(approvalRes.data.manufacture_price);
        setSellingPrice(approvalRes.data.selling_price);

        // Set existing image URL if available
        if (approvalRes.data.product_image) {
          setExistingImageUrl(approvalRes.data.product_image);
        }

        if (approvalRes.data.notes) {
          setProductNotes(approvalRes.data.notes);
        }
      }

      if (cuttingRes.data) {
        setProductDetails(cuttingRes.data);

        // Extract fabric details
        if (cuttingRes.data.details && cuttingRes.data.details.length > 0) {
          setFabricDetails(cuttingRes.data.details);

          // Calculate size quantities
          const sizes = {xs: 0, s: 0, m: 0, l: 0, xl: 0};
          cuttingRes.data.details.forEach(detail => {
            sizes.xs += detail.xs || 0;
            sizes.s += detail.s || 0;
            sizes.m += detail.m || 0;
            sizes.l += detail.l || 0;
            sizes.xl += detail.xl || 0;
          });
          setSizeQuantities(sizes);
        }
      }

      // Reset retry count on success
      setRetryCount(0);
    } catch (err) {
      console.error("Failed to fetch product data:", err);

      // Provide more detailed error message
      const errorMessage = err.response
        ? `Error: ${err.response.status} - ${err.response.statusText}`
        : err.request
          ? "No response received from server. Check if the backend is running."
          : "Failed to make request. Check your network connection.";

      setError(`Unable to fetch product data. ${errorMessage}`);

      // Implement retry mechanism
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchProductData();
        }, 2000); // Wait 2 seconds before retrying
      }
    } finally {
      setLoading(false);
    }
  }, [id, retryCount]);

  // Fetch product details and approval status
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  // Handle image selection from file input
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Process the selected image file
  const processImageFile = (file) => {
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setProductImage(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle drag and drop functionality
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      processImageFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });

  // Remove the uploaded image
  const removeImage = () => {
    setProductImage(null);
    setImagePreview(null);
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {};

    // Validate manufacture price
    if (!manufacturePrice || manufacturePrice.trim() === '') {
      errors.manufacturePrice = "Manufacture price is required";
    } else if (parseFloat(manufacturePrice) <= 0) {
      errors.manufacturePrice = "Manufacture price must be greater than zero";
    } else if (isNaN(parseFloat(manufacturePrice))) {
      errors.manufacturePrice = "Manufacture price must be a valid number";
    }

    // Validate selling price
    if (!sellingPrice || sellingPrice.trim() === '') {
      errors.sellingPrice = "Selling price is required";
    } else if (parseFloat(sellingPrice) <= 0) {
      errors.sellingPrice = "Selling price must be greater than zero";
    } else if (isNaN(parseFloat(sellingPrice))) {
      errors.sellingPrice = "Selling price must be a valid number";
    } else if (parseFloat(sellingPrice) < parseFloat(manufacturePrice)) {
      errors.sellingPrice = "Selling price should be greater than or equal to manufacture price";
    }

    // Validate product notes (optional)
    if (productNotes && productNotes.length > 500) {
      errors.productNotes = "Notes should be less than 500 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Show confirmation modal
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  // Handle actual submission
  const handleSubmit = async () => {
    setError('');
    setSuccessMsg('');
    setShowConfirmModal(false);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('cutting_record', id);
    formData.append('manufacture_price', parseFloat(manufacturePrice));
    formData.append('selling_price', parseFloat(sellingPrice));

    if (productNotes) {
      formData.append('notes', productNotes);
    }

    if (productImage) {
      formData.append('product_image', productImage);
    }

    try {
      // Show loading state
      setLoading(true);

      const response = await axios.post(
        'http://localhost:8000/api/finished_product/approve/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccessMsg(response.data.message || 'Product approved successfully!');

      // Redirect after a delay
      setTimeout(() => {
        navigate('/approveproduct-list');
      }, 2000);
    } catch (err) {
      console.error("Error approving finished product:", err);
      const errMsg = err.response && err.response.data
        ? typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response.data
        : "Failed to approve finished product. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Cancel confirmation
  const handleCancelConfirmation = () => {
    setShowConfirmModal(false);
  };

  // Loading spinner
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );

  // Render color swatch
  const renderColorSwatch = (color) => {
    const colorMap = {
      'red': '#dc3545',
      'blue': '#0d6efd',
      'green': '#198754',
      'yellow': '#ffc107',
      'black': '#212529',
      'white': '#f8f9fa',
      'purple': '#6f42c1',
      'orange': '#fd7e14',
      'pink': '#d63384',
      'brown': '#8B4513',
      'gray': '#6c757d',
    };

    const bgColor = colorMap[color.toLowerCase()] || color;

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip className="custom-tooltip">{color}</Tooltip>}
      >
        <div
          className="color-swatch"
          style={{ backgroundColor: bgColor }}
        />
      </OverlayTrigger>
    );
  };

  // Render size quantity bars
  const renderSizeQuantityBars = () => {
    const sizes = Object.entries(sizeQuantities);
    const maxQuantity = Math.max(...sizes.map(([_, qty]) => qty));

    return sizes.map(([size, quantity]) => (
      <div key={size} className="mb-2">
        <div className="d-flex justify-content-between mb-1">
          <span><strong>{size.toUpperCase()}</strong></span>
          <span>{quantity} pcs</span>
        </div>
        <ProgressBar
          now={maxQuantity ? (quantity / maxQuantity) * 100 : 0}
          variant={quantity > 0 ? "info" : "light"}
          className="size-quantity-bar"
        />
      </div>
    ));
  };

  // Confirmation Modal
  const ConfirmationModal = () => (
    <Modal
      show={showConfirmModal}
      onHide={handleCancelConfirmation}
      centered
      className="confirmation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Product Approval</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to approve this product with the following details?</p>
        <Table bordered hover size="sm" className="mt-3">
          <tbody>
            <tr>
              <td><strong>Manufacture Price:</strong></td>
              <td>LKR {manufacturePrice}</td>
            </tr>
            <tr>
              <td><strong>Selling Price:</strong></td>
              <td>LKR {sellingPrice}</td>
            </tr>
            <tr>
              <td><strong>Profit Margin:</strong></td>
              <td>{profitMargin}%</td>
            </tr>
            {productNotes && (
              <tr>
                <td><strong>Notes:</strong></td>
                <td>{productNotes}</td>
              </tr>
            )}
          </tbody>
        </Table>
        {imagePreview && (
          <div className="text-center mt-3">
            <p><strong>Product Image:</strong></p>
            <Image
              src={imagePreview}
              alt="Product"
              thumbnail
              style={{ maxHeight: "100px" }}
            />
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancelConfirmation}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          <FaCheck className="me-2" />
          Confirm Approval
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <>
      <RoleBasedNavBar />
      <div className="main-content">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="shadow product-card slide-in" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
              <Card.Body>
                <h2 className="text-center mb-3">Approve Finished Product</h2>
                <p className="text-center text-muted mb-4">Batch ID: {id}</p>

                {error && (
                  <Alert variant="danger" className="mb-4 fade-in">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <FaExclamationTriangle className="me-2" />
                        {error}
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={fetchProductData}
                      >
                        Retry
                      </Button>
                    </div>
                  </Alert>
                )}

                {successMsg && (
                  <Alert variant="success" className="mb-4 fade-in">
                    <FaCheck className="me-2" />
                    {successMsg}
                  </Alert>
                )}

                {isApproved ? (
                  <div className="p-4 bg-white rounded mb-3 slide-in">
                    <h4 className="text-center mb-4 text-success">
                      <FaCheck className="me-2" />
                      Product Already Approved
                    </h4>

                    <Tabs
                      defaultActiveKey="details"
                      className="mb-4"
                    >
                      <Tab eventKey="details" title={<span><FaInfoCircle className="me-2" />Details</span>}>
                        <Row className="mt-3">
                          <Col md={6}>
                            <h5 className="mb-3"><FaMoneyBillWave className="me-2" />Pricing Information</h5>
                            <Table bordered hover>
                              <tbody>
                                <tr>
                                  <td><strong>Manufacture Price:</strong></td>
                                  <td>LKR {manufacturePrice}</td>
                                </tr>
                                <tr>
                                  <td><strong>Selling Price:</strong></td>
                                  <td>LKR {sellingPrice}</td>
                                </tr>
                                <tr>
                                  <td><strong>Profit Margin:</strong></td>
                                  <td>{profitMargin}%</td>
                                </tr>
                              </tbody>
                            </Table>

                            {productNotes && (
                              <div className="mt-4">
                                <h5 className="mb-3"><FaClipboardList className="me-2" />Notes</h5>
                                <div className="p-3 bg-light rounded">
                                  {productNotes}
                                </div>
                              </div>
                            )}
                          </Col>

                          <Col md={6} className="text-center">
                            <h5 className="mb-3"><FaImage className="me-2" />Product Image</h5>
                            {existingImageUrl ? (
                              <Image
                                src={existingImageUrl}
                                alt="Product"
                                thumbnail
                                className="image-preview"
                              />
                            ) : (
                              <div className="p-5 bg-light rounded">
                                <FaImage size={60} className="text-secondary" />
                                <p className="mt-3 text-muted">No image available</p>
                              </div>
                            )}
                          </Col>
                        </Row>
                      </Tab>

                      <Tab eventKey="fabric" title={<span><FaTshirt className="me-2" />Fabric Details</span>}>
                        <Row className="mt-3">
                          <Col md={6}>
                            <h5 className="mb-3"><FaTags className="me-2" />Colors</h5>
                            <div className="mb-4">
                              {fabricDetails.length > 0 ? (
                                fabricDetails.map((detail, index) => (
                                  <div key={index} className="mb-2">
                                    {renderColorSwatch(detail.color || 'gray')}
                                    <span className="ms-2">{detail.color}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted">No color information available</p>
                              )}
                            </div>
                          </Col>

                          <Col md={6}>
                            <h5 className="mb-3"><FaBoxOpen className="me-2" />Size Distribution</h5>
                            {renderSizeQuantityBars()}
                          </Col>
                        </Row>
                      </Tab>
                    </Tabs>
                  </div>
                ) : (
                  <div className="slide-in">
                    <Tabs
                      id="product-approval-tabs"
                      activeKey={activeTab}
                      onSelect={(k) => setActiveTab(k)}
                      className="mb-4"
                    >
                      <Tab eventKey="details" title={<span><FaInfoCircle className="me-2" />Product Details</span>}>
                        <Row className="mt-3">
                          <Col md={6}>
                            <h5 className="mb-3"><FaTags className="me-2" />Colors</h5>
                            <div className="mb-4">
                              {fabricDetails.length > 0 ? (
                                fabricDetails.map((detail, index) => (
                                  <div key={index} className="mb-2">
                                    {renderColorSwatch(detail.color || 'gray')}
                                    <span className="ms-2">{detail.color}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted">No color information available</p>
                              )}
                            </div>

                            <h5 className="mb-3"><FaBoxOpen className="me-2" />Size Distribution</h5>
                            {renderSizeQuantityBars()}
                          </Col>

                          <Col md={6}>
                            <div {...getRootProps()} className={`image-upload-container mb-4 ${isDragActive ? 'active' : ''}`}>
                              <input {...getInputProps()} />

                              {imagePreview ? (
                                <div className="text-center">
                                  <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    className="image-preview mb-3"
                                  />
                                  <div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={removeImage}
                                      className="me-2"
                                    >
                                      <FaTrash className="me-1" /> Remove
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={triggerFileInput}
                                    >
                                      <FaUndo className="me-1" /> Change
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <FaUpload size={40} className="mb-3 text-primary" />
                                  <p>Drag & drop a product image here, or click to select</p>
                                  <p className="text-muted small">Supported formats: JPEG, PNG, GIF (Max: 5MB)</p>
                                </div>
                              )}

                              <Form.Control
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                              />
                            </div>
                          </Col>
                        </Row>
                      </Tab>

                      <Tab eventKey="pricing" title={<span><FaMoneyBillWave className="me-2" />Pricing</span>}>
                        <Form onSubmit={handleFormSubmit} className="mt-3">
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  <strong>Manufacture Price (LKR):</strong>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>The cost to manufacture this product</Tooltip>}
                                  >
                                    <FaInfoCircle className="ms-2 text-muted" />
                                  </OverlayTrigger>
                                </Form.Label>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={manufacturePrice}
                                  onChange={(e) => setManufacturePrice(e.target.value)}
                                  isInvalid={!!validationErrors.manufacturePrice}
                                  required
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.manufacturePrice}
                                </Form.Control.Feedback>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <Form.Label>
                                  <strong>Selling Price (LKR):</strong>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>The price at which this product will be sold</Tooltip>}
                                  >
                                    <FaInfoCircle className="ms-2 text-muted" />
                                  </OverlayTrigger>
                                </Form.Label>
                                <Form.Control
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={sellingPrice}
                                  onChange={(e) => setSellingPrice(e.target.value)}
                                  isInvalid={!!validationErrors.sellingPrice}
                                  required
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.sellingPrice}
                                </Form.Control.Feedback>
                              </Form.Group>

                              {manufacturePrice && sellingPrice && parseFloat(manufacturePrice) > 0 && parseFloat(sellingPrice) > 0 && (
                                <div className="mb-4 p-3 bg-light rounded">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span><strong>Profit Margin:</strong></span>
                                    <Badge bg={
                                      profitMargin < 10 ? "danger" :
                                      profitMargin < 20 ? "warning" :
                                      "success"
                                    }>
                                      <FaPercentage className="me-1" />
                                      {profitMargin}%
                                    </Badge>
                                  </div>
                                  <div className="profit-margin-indicator" />
                                  <div className="d-flex justify-content-between mt-1">
                                    <small>Low</small>
                                    <small>High</small>
                                  </div>
                                </div>
                              )}
                            </Col>

                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  <strong>Product Notes:</strong>
                                  <OverlayTrigger
                                    placement="top"
                                    overlay={<Tooltip>Additional information about this product</Tooltip>}
                                  >
                                    <FaInfoCircle className="ms-2 text-muted" />
                                  </OverlayTrigger>
                                </Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={5}
                                  value={productNotes}
                                  onChange={(e) => setProductNotes(e.target.value)}
                                  isInvalid={!!validationErrors.productNotes}
                                  placeholder="Enter any additional notes about this product..."
                                />
                                <Form.Control.Feedback type="invalid">
                                  {validationErrors.productNotes}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                  {productNotes ? 500 - productNotes.length : 500} characters remaining
                                </Form.Text>
                              </Form.Group>
                            </Col>
                          </Row>

                          <div className="d-grid gap-2 mt-4">
                            <Button type="submit" className="btn-approve" size="lg">
                              <FaCheck className="me-2" />
                              Approve Product
                            </Button>
                          </div>
                        </Form>
                      </Tab>
                    </Tabs>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal />
    </>
  );
};

export default ApproveFinishedProduct;
