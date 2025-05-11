// src/pages/ApproveFinishedProduct.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col, Spinner, Image, Modal, ProgressBar, Badge, Tabs, Tab, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  FaCheck, FaUpload, FaImage, FaTags, FaInfoCircle, FaMoneyBillWave,
  FaArrowRight, FaPercentage, FaBoxOpen, FaTshirt, FaClipboardList,
  FaTrash, FaUndo, FaExclamationTriangle, FaChartBar, FaCut,
  FaShoppingBag, FaBox, FaExclamation
} from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import './ApproveFinishedProduct.css';
// No need to import uploadMultipleImages as we're using FormData directly

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
  const [productImages, setProductImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Product details state
  const [productDetails, setProductDetails] = useState(null);
  const [fabricDetails, setFabricDetails] = useState([]);
  const [sizeQuantities, setSizeQuantities] = useState({
    xs: 0, s: 0, m: 0, l: 0, xl: 0
  });

  // Stock level state
  const [stockLevels, setStockLevels] = useState({
    totalCut: 0,
    totalSewn: 0,
    notSewnYet: 0,
    totalPacked: 0,
    notPackedYet: 0,
    totalSold: 0,
    soldValue: 0
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

  // Function to fetch stock levels for the product
  const fetchStockLevels = useCallback(async () => {
    try {
      // We'll calculate stock levels based on the cutting record data and other API calls

      // 1. Get total cut quantities from cutting record
      const totalCut =
        sizeQuantities.xs +
        sizeQuantities.s +
        sizeQuantities.m +
        sizeQuantities.l +
        sizeQuantities.xl;

      // 2. Get sewing data - we'll use the finished product API if it exists
      let totalSewn = 0;
      let sewingData = null;

      try {
        // Try to get data from finished product if it exists
        if (isApproved) {
          const finishedProductRes = await axios.get(`http://localhost:8000/api/finished_product/report/?cutting_record=${id}`);
          if (finishedProductRes.data && finishedProductRes.data.length > 0) {
            const product = finishedProductRes.data[0];
            totalSewn =
              (product.total_sewn_xs || 0) +
              (product.total_sewn_s || 0) +
              (product.total_sewn_m || 0) +
              (product.total_sewn_l || 0) +
              (product.total_sewn_xl || 0);
            sewingData = product;
          }
        }
      } catch (error) {
        console.error("Error fetching sewing data:", error);
      }

      // 3. Get packing data if the product is approved
      let totalPacked = 0;
      if (isApproved && sewingData) {
        try {
          const packingRes = await axios.get(`http://localhost:8000/api/packing/product/${sewingData.id}/sessions/`);
          if (packingRes.data && packingRes.data.length > 0) {
            // Sum up all packing sessions
            totalPacked = packingRes.data.reduce((sum, session) =>
              sum + (session.total_packed_quantity || 0), 0);
          }
        } catch (error) {
          console.error("Error fetching packing data:", error);
        }
      }

      // 4. Calculate derived values
      const notSewnYet = totalCut - totalSewn;
      const notPackedYet = totalSewn - totalPacked;

      // 5. Get sales data (this is a simplified approach)
      let totalSold = 0;
      let soldValue = 0;

      if (isApproved && sewingData) {
        try {
          // This is a simplified approach - in a real system, you'd query orders
          // that include this product and sum up the quantities
          // For now, we'll assume sold = packed for demonstration
          totalSold = totalPacked;
          soldValue = totalSold * (sewingData.selling_price || 0);
        } catch (error) {
          console.error("Error calculating sales data:", error);
        }
      }

      // Update stock levels state
      setStockLevels({
        totalCut,
        totalSewn,
        notSewnYet,
        totalPacked,
        notPackedYet,
        totalSold,
        soldValue
      });

    } catch (error) {
      console.error("Error fetching stock levels:", error);
    }
  }, [id, sizeQuantities, isApproved]);

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

        // Set existing image URLs if available
        if (approvalRes.data.product_images && Array.isArray(approvalRes.data.product_images)) {
          setExistingImageUrls(approvalRes.data.product_images);
        } else if (approvalRes.data.product_image) {
          // For backward compatibility with single image
          setExistingImageUrls([approvalRes.data.product_image]);
        }

        if (approvalRes.data.notes) {
          setProductNotes(approvalRes.data.notes);
        }
      }

      if (cuttingRes.data) {
        setProductDetails(cuttingRes.data);

        // Extract fabric details
        if (cuttingRes.data.details && cuttingRes.data.details.length > 0) {
          // Log the fabric details to see the structure
          console.log("Fabric details:", cuttingRes.data.details);

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

  // Fetch stock levels after product data is loaded
  useEffect(() => {
    if (!loading && sizeQuantities.xs !== undefined) {
      fetchStockLevels();
    }
  }, [loading, sizeQuantities, fetchStockLevels]);

  // Handle image selection from file input
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processImageFiles(files);
    }
  };

  // Process the selected image files
  const processImageFiles = useCallback((files) => {
    // Check if adding these files would exceed the limit
    if (productImages.length + files.length > 10) {
      setError(`You can only upload up to 10 images. You already have ${productImages.length} images.`);
      return;
    }

    const newImages = [];
    const newPreviewUrls = [...imagePreviewUrls];

    files.forEach(file => {
      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select image files only (JPEG, PNG, etc.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image size should be less than 5MB');
        return;
      }

      newImages.push(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewUrls.push(reader.result);
        setImagePreviewUrls([...newPreviewUrls]);
      };
      reader.readAsDataURL(file);
    });

    setProductImages([...productImages, ...newImages]);
  }, [productImages, imagePreviewUrls]);

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle drag and drop functionality
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      processImageFiles(acceptedFiles);
    }
  }, [processImageFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 10
  });

  // Remove an uploaded image
  const removeImage = (index) => {
    const newImages = [...productImages];
    const newPreviewUrls = [...imagePreviewUrls];

    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);

    setProductImages(newImages);
    setImagePreviewUrls(newPreviewUrls);

    // Adjust active index if needed
    if (index === activeImageIndex) {
      setActiveImageIndex(Math.max(0, index - 1));
    } else if (index < activeImageIndex) {
      setActiveImageIndex(activeImageIndex - 1);
    }
  };

  // Set active image
  const setActiveImage = (index) => {
    setActiveImageIndex(index);
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

    try {
      // Show loading state
      setLoading(true);
      setIsUploading(true);

      // Create FormData object for API request
      const formData = new FormData();
      formData.append('cutting_record', id);
      formData.append('manufacture_price', parseFloat(manufacturePrice));
      formData.append('selling_price', parseFloat(sellingPrice));

      if (productNotes) {
        formData.append('notes', productNotes);
      }

      // Add images directly to the FormData if there are any
      if (productImages && productImages.length > 0) {
        setUploadProgress(0);

        // Append each image to the FormData
        productImages.forEach(image => {
          formData.append('product_images', image);
        });
      }

      // Make the API request with progress tracking
      const response = await axios.post(
        'http://localhost:8000/api/finished_product/approve/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      setSuccessMsg(response.data.message || 'Product approved successfully!');
      setIsUploading(false);

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
      setIsUploading(false);
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
    // Comprehensive color mapping
    const colorMap = {
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'black': '#000000',
      'white': '#FFFFFF',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'orange': '#FFA500',
      'brown': '#A52A2A',
      'grey': '#808080',
      'gray': '#808080',
      'navy': '#000080',
      'teal': '#008080',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00FF00',
      'aqua': '#00FFFF',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'beige': '#F5F5DC',
      'cream': '#FFFDD0',
      'tan': '#D2B48C',
      'khaki': '#F0E68C',
      'lavender': '#E6E6FA',
      'magenta': '#FF00FF',
      'cyan': '#00FFFF',
      'turquoise': '#40E0D0',
      'indigo': '#4B0082',
      'violet': '#EE82EE',
      'crimson': '#DC143C',
      'coral': '#FF7F50',
      'salmon': '#FA8072',
    };

    // If color is undefined or null, return a default gray
    if (!color) return '#CCCCCC';

    // Check if the color is already a hex code (starts with #)
    if (color.startsWith('#')) {
      return (
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip className="custom-tooltip">{color}</Tooltip>}
        >
          <div
            className="color-swatch"
            style={{ backgroundColor: color }}
          />
        </OverlayTrigger>
      );
    }

    // Try to match the color name (case insensitive)
    const lowerCaseName = color.toLowerCase();

    // Check for exact match
    let bgColor = colorMap[lowerCaseName];

    // If no exact match, check for partial match
    if (!bgColor) {
      for (const [key, value] of Object.entries(colorMap)) {
        if (lowerCaseName.includes(key)) {
          bgColor = value;
          break;
        }
      }
    }

    // If still no match, use the color as is or default to gray
    bgColor = bgColor || color || '#CCCCCC';

    // Get a display name for the tooltip
    const displayName = color.startsWith('#') ?
      (Object.entries(colorMap).find(([_, value]) => value.toLowerCase() === color.toLowerCase())?.[0] || color) :
      color;

    return (
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip className="custom-tooltip">{displayName}</Tooltip>}
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

  // Render stock level information
  const StockLevelInfo = () => {
    return (
      <div className="stock-level-info p-3 bg-white rounded mb-4">
        <h5 className="mb-3">
          <FaChartBar className="me-2" />
          Real-Time Stock Levels
        </h5>

        <Row>
          <Col md={6}>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <FaCut className="me-2 text-primary" />
                  <strong>Total Cut:</strong>
                </div>
                <Badge bg="primary" className="fs-6">{stockLevels.totalCut} pcs</Badge>
              </div>
              <ProgressBar
                now={100}
                variant="primary"
                className="mb-2"
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <FaTshirt className="me-2 text-success" />
                  <strong>Total Sewn:</strong>
                </div>
                <Badge bg="success" className="fs-6">{stockLevels.totalSewn} pcs</Badge>
              </div>
              <ProgressBar
                now={stockLevels.totalCut ? (stockLevels.totalSewn / stockLevels.totalCut) * 100 : 0}
                variant="success"
                className="mb-2"
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <FaExclamation className="me-2 text-warning" />
                  <strong>Not Sewn Yet:</strong>
                </div>
                <Badge bg="warning" className="fs-6">{stockLevels.notSewnYet} pcs</Badge>
              </div>
              <ProgressBar
                now={stockLevels.totalCut ? (stockLevels.notSewnYet / stockLevels.totalCut) * 100 : 0}
                variant="warning"
                className="mb-2"
              />
            </div>
          </Col>

          <Col md={6}>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <FaBoxOpen className="me-2 text-info" />
                  <strong>Total Packed:</strong>
                </div>
                <Badge bg="info" className="fs-6">{stockLevels.totalPacked} pcs</Badge>
              </div>
              <ProgressBar
                now={stockLevels.totalSewn ? (stockLevels.totalPacked / stockLevels.totalSewn) * 100 : 0}
                variant="info"
                className="mb-2"
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <FaBox className="me-2 text-secondary" />
                  <strong>Not Packed Yet:</strong>
                </div>
                <Badge bg="secondary" className="fs-6">{stockLevels.notPackedYet} pcs</Badge>
              </div>
              <ProgressBar
                now={stockLevels.totalSewn ? (stockLevels.notPackedYet / stockLevels.totalSewn) * 100 : 0}
                variant="secondary"
                className="mb-2"
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <FaShoppingBag className="me-2 text-danger" />
                  <strong>Total Sold:</strong>
                </div>
                <Badge bg="danger" className="fs-6">
                  {stockLevels.totalSold} pcs
                  {stockLevels.soldValue > 0 && ` (LKR ${stockLevels.soldValue.toFixed(2)})`}
                </Badge>
              </div>
              <ProgressBar
                now={stockLevels.totalPacked ? (stockLevels.totalSold / stockLevels.totalPacked) * 100 : 0}
                variant="danger"
                className="mb-2"
              />
            </div>
          </Col>
        </Row>
      </div>
    );
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
        {imagePreviewUrls.length > 0 && (
          <div className="text-center mt-3">
            <p><strong>Product Image:</strong></p>
            <Image
              src={imagePreviewUrls[0]}
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
                            <h5 className="mb-3"><FaImage className="me-2" />Product Images</h5>
                            {existingImageUrls && existingImageUrls.length > 0 ? (
                              <div className="product-images-container">
                                <div className="product-images-grid">
                                  {existingImageUrls.map((imageUrl, index) => (
                                    <div
                                      key={index}
                                      className={`product-image-item ${index === activeImageIndex ? 'active' : ''}`}
                                      onClick={() => setActiveImageIndex(index)}
                                    >
                                      <Image
                                        src={imageUrl}
                                        alt={`Product ${index + 1}`}
                                        thumbnail
                                        className="image-preview"
                                      />
                                      <span className="image-number">{index + 1}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="main-image-container mt-3">
                                  <Image
                                    src={existingImageUrls[activeImageIndex]}
                                    alt="Product"
                                    thumbnail
                                    className="main-image-preview"
                                    style={{ maxHeight: "250px" }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="p-5 bg-light rounded">
                                <FaImage size={60} className="text-secondary" />
                                <p className="mt-3 text-muted">No images available</p>
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
                                    {renderColorSwatch(detail.fabric_variant_data?.color || detail.color || 'gray')}
                                    <span className="ms-2">{detail.fabric_variant_data?.color_name || detail.fabric_variant_data?.color || detail.color || 'Unknown'}</span>
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

                      <Tab eventKey="stock" title={<span><FaChartBar className="me-2" />Stock Levels</span>}>
                        <div className="mt-3">
                          <StockLevelInfo />
                        </div>
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
                                    {renderColorSwatch(detail.fabric_variant_data?.color || detail.color || 'gray')}
                                    <span className="ms-2">{detail.fabric_variant_data?.color_name || detail.fabric_variant_data?.color || detail.color || 'Unknown'}</span>
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
                            <div className="mb-3">
                              <h5 className="mb-3"><FaImage className="me-2" />Product Images</h5>
                              <p className="text-muted mb-3">Upload up to 10 images of the product (Current: {productImages.length}/10)</p>

                              {/* Image preview grid */}
                              {imagePreviewUrls.length > 0 && (
                                <div className="product-images-container mb-4">
                                  <div className="product-images-grid">
                                    {imagePreviewUrls.map((previewUrl, index) => (
                                      <div
                                        key={index}
                                        className={`product-image-item ${index === activeImageIndex ? 'active' : ''}`}
                                        onClick={() => setActiveImageIndex(index)}
                                      >
                                        <div className="image-actions">
                                          <Button
                                            variant="danger"
                                            size="sm"
                                            className="btn-remove-image"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeImage(index);
                                            }}
                                          >
                                            <FaTrash />
                                          </Button>
                                        </div>
                                        <Image
                                          src={previewUrl}
                                          alt={`Preview ${index + 1}`}
                                          thumbnail
                                          className="image-preview"
                                        />
                                        <span className="image-number">{index + 1}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {imagePreviewUrls.length > 0 && (
                                    <div className="main-image-container mt-3">
                                      <Image
                                        src={imagePreviewUrls[activeImageIndex]}
                                        alt="Product Preview"
                                        thumbnail
                                        className="main-image-preview"
                                        style={{ maxHeight: "250px" }}
                                      />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Upload area */}
                              {isUploading ? (
                                <div className="p-4 bg-light rounded text-center">
                                  <h5 className="mb-3">Uploading Images</h5>
                                  <ProgressBar
                                    now={uploadProgress}
                                    label={`${Math.round(uploadProgress)}%`}
                                    variant="info"
                                    animated
                                    className="mb-3"
                                  />
                                  <p className="text-muted">
                                    <FaUpload className="me-2 text-primary" />
                                    Uploading {productImages.length} images...
                                  </p>
                                </div>
                              ) : (
                                productImages.length < 10 && (
                                  <div {...getRootProps()} className={`image-upload-container ${isDragActive ? 'active' : ''}`}>
                                    <input {...getInputProps()} multiple />
                                    <div className="text-center">
                                      <FaUpload size={40} className="mb-3 text-primary" />
                                      <p>Drag & drop product images here, or click to select</p>
                                      <p className="text-muted small">Supported formats: JPEG, PNG, GIF (Max: 5MB each)</p>
                                      <p className="text-muted small">You can select multiple images at once (Max: 10)</p>
                                    </div>
                                  </div>
                                )
                              )}

                              <Form.Control
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                multiple
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

                      <Tab eventKey="stock" title={<span><FaChartBar className="me-2" />Stock Levels</span>}>
                        <div className="mt-3">
                          <StockLevelInfo />
                        </div>
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
