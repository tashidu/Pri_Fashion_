// src/pages/ViewApproveProduct.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Card, Container, Row, Col, Table, Button, Form,
  Modal, Badge, Spinner, Alert, Image, InputGroup,
  Tabs, Tab
} from "react-bootstrap";
import {
  FaSearch, FaSort, FaImage, FaUpload, FaTrash, FaUndo,
  FaInfoCircle, FaMoneyBillWave, FaTshirt, FaCalendarAlt,
  FaCheck, FaExclamationTriangle, FaEye
} from "react-icons/fa";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useDropzone } from "react-dropzone";

const ViewApproveProduct = () => {
  // State for products and UI
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  // State for product detail modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // State for image upload
  const [showImageModal, setShowImageModal] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const fileInputRef = useRef(null);

  // Filter products based on search term
  const filterProducts = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get("http://localhost:8000/api/finished_product/report/");
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching approved product report:", err);
      setError("Failed to load approved product report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Update filtered products when products or search term changes
  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';

    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setFilteredProducts(sortedProducts);
  };

  // Open product detail modal
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  // Open image upload modal
  const handleAddImage = (product) => {
    setSelectedProduct(product);
    setImagePreview(null);
    setProductImage(null);
    setUploadError("");
    setUploadSuccess("");
    setShowImageModal(true);
  };

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
      setUploadError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setProductImage(file);
    setUploadError("");

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
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        processImageFile(acceptedFiles[0]);
      }
    },
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

  // Upload image to server
  const handleUploadImage = async () => {
    if (!productImage) {
      setUploadError("Please select an image to upload");
      return;
    }

    setUploadLoading(true);
    setUploadError("");
    setUploadSuccess("");

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('product_image', productImage);

    try {
      // Use the dedicated endpoint for updating product images
      const response = await axios.patch(
        `http://localhost:8000/api/finished_product/update-image/${selectedProduct.id}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadSuccess("Image uploaded successfully!");

      // Update the selected product with the new image URL
      if (response.data && response.data.product_image) {
        setSelectedProduct({
          ...selectedProduct,
          product_image: response.data.product_image
        });
      }

      // Refresh the products list after a short delay
      setTimeout(() => {
        fetchProducts();
        setShowImageModal(false);
      }, 1500);

    } catch (err) {
      console.error("Error uploading product image:", err);
      const errMsg = err.response && err.response.data
        ? typeof err.response.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response.data
        : "Failed to upload image. Please try again.";
      setUploadError(errMsg);
    } finally {
      setUploadLoading(false);
    }
  };

  // Calculate profit margin
  const calculateProfitMargin = (manufacturePrice, sellingPrice) => {
    if (!manufacturePrice || !sellingPrice) return 0;

    const profit = sellingPrice - manufacturePrice;
    const margin = (profit / manufacturePrice) * 100;

    return margin.toFixed(2);
  };

  // Render size distribution as a table
  const renderSizeDistribution = (product) => {
    const sizes = [
      { label: 'XS', value: product.total_sewn_xs || 0 },
      { label: 'S', value: product.total_sewn_s || 0 },
      { label: 'M', value: product.total_sewn_m || 0 },
      { label: 'L', value: product.total_sewn_l || 0 },
      { label: 'XL', value: product.total_sewn_xl || 0 }
    ];

    const total = sizes.reduce((sum, size) => sum + size.value, 0);

    return (
      <Table bordered hover size="sm" className="mt-2">
        <thead>
          <tr className="bg-light">
            {sizes.map(size => (
              <th key={size.label} className="text-center">{size.label}</th>
            ))}
            <th className="text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {sizes.map(size => (
              <td key={size.label} className="text-center">{size.value}</td>
            ))}
            <td className="text-center fw-bold">{total}</td>
          </tr>
          <tr>
            {sizes.map(size => (
              <td key={`${size.label}-percent`} className="text-center text-muted small">
                {total > 0 ? `${((size.value / total) * 100).toFixed(1)}%` : '0%'}
              </td>
            ))}
            <td className="text-center">100%</td>
          </tr>
        </tbody>
      </Table>
    );
  };

  // Format currency
  const formatCurrency = (value) => {
    return `LKR ${parseFloat(value).toFixed(2)}`;
  };

  return (
    <>
      <RoleBasedNavBar />
      <div className="main-content">
        <Container fluid>
          {/* Header Section */}
          <Card className="shadow-sm mb-4" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <h2 className="mb-0">Approved Products</h2>
                </Col>
                <Col md="auto">
                  <Button
                    variant="primary"
                    onClick={fetchProducts}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                        Loading...
                      </>
                    ) : (
                      <>Refresh</>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <FaExclamationTriangle className="me-2" />
              {error}
            </Alert>
          )}

          {/* Search and Filter Section */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by product name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="outline-secondary"
                        onClick={() => setSearchTerm("")}
                      >
                        Clear
                      </Button>
                    )}
                  </InputGroup>
                </Col>
                <Col md={6} className="d-flex justify-content-end align-items-center">
                  <span className="me-3">
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  </span>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Products Table */}
          <Card className="shadow-sm">
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th onClick={() => requestSort('product_name')} style={{ cursor: 'pointer' }}>
                        Product Name <FaSort className="ms-1" />
                      </th>
                      <th onClick={() => requestSort('manufacture_price')} style={{ cursor: 'pointer' }}>
                        Manufacture Price <FaSort className="ms-1" />
                      </th>
                      <th onClick={() => requestSort('selling_price')} style={{ cursor: 'pointer' }}>
                        Selling Price <FaSort className="ms-1" />
                      </th>
                      <th>Size Distribution</th>
                      <th onClick={() => requestSort('approval_date')} style={{ cursor: 'pointer' }}>
                        Approval Date <FaSort className="ms-1" />
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          No products found
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const total =
                          (product.total_sewn_xs || 0) +
                          (product.total_sewn_s || 0) +
                          (product.total_sewn_m || 0) +
                          (product.total_sewn_l || 0) +
                          (product.total_sewn_xl || 0);

                        return (
                          <tr key={product.id}>
                            <td>{product.product_name}</td>
                            <td>{formatCurrency(product.manufacture_price)}</td>
                            <td>{formatCurrency(product.selling_price)}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Badge bg="secondary" className="me-1">XS: {product.total_sewn_xs || 0}</Badge>
                                <Badge bg="secondary" className="me-1">S: {product.total_sewn_s || 0}</Badge>
                                <Badge bg="secondary" className="me-1">M: {product.total_sewn_m || 0}</Badge>
                                <Badge bg="secondary" className="me-1">L: {product.total_sewn_l || 0}</Badge>
                                <Badge bg="secondary">XL: {product.total_sewn_xl || 0}</Badge>
                              </div>
                              <div className="mt-1">
                                <small>Total: {total}</small>
                              </div>
                            </td>
                            <td>{new Date(product.approval_date).toLocaleDateString()}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleViewDetails(product)}
                              >
                                <FaEye className="me-1" /> View
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleAddImage(product)}
                              >
                                <FaImage className="me-1" /> Add Image
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Product Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Product Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <Tabs defaultActiveKey="details" className="mb-3">
              <Tab eventKey="details" title={<span><FaInfoCircle className="me-2" />Details</span>}>
                <Row>
                  <Col md={6}>
                    <h5 className="mb-3"><FaMoneyBillWave className="me-2" />Pricing Information</h5>
                    <Table bordered hover>
                      <tbody>
                        <tr>
                          <td><strong>Manufacture Price:</strong></td>
                          <td>{formatCurrency(selectedProduct.manufacture_price)}</td>
                        </tr>
                        <tr>
                          <td><strong>Selling Price:</strong></td>
                          <td>{formatCurrency(selectedProduct.selling_price)}</td>
                        </tr>
                        <tr>
                          <td><strong>Profit Margin:</strong></td>
                          <td>
                            {calculateProfitMargin(
                              selectedProduct.manufacture_price,
                              selectedProduct.selling_price
                            )}%
                          </td>
                        </tr>
                      </tbody>
                    </Table>

                    <h5 className="mb-3 mt-4"><FaCalendarAlt className="me-2" />Approval Information</h5>
                    <p>
                      <strong>Approval Date:</strong> {new Date(selectedProduct.approval_date).toLocaleDateString()}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h5 className="mb-3"><FaTshirt className="me-2" />Size Distribution</h5>
                    {renderSizeDistribution(selectedProduct)}
                  </Col>
                </Row>
              </Tab>
              <Tab eventKey="image" title={<span><FaImage className="me-2" />Product Image</span>}>
                <div className="text-center p-4">
                  {selectedProduct.product_image ? (
                    <div>
                      <Image
                        src={selectedProduct.product_image}
                        alt={selectedProduct.product_name}
                        fluid
                        className="mb-3"
                        style={{ maxHeight: '300px' }}
                      />
                      <p className="text-muted">Product image for {selectedProduct.product_name}</p>
                    </div>
                  ) : (
                    <div className="p-5 bg-light rounded">
                      <FaImage size={60} className="mb-3 text-secondary" />
                      <p>No image available for this product</p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setShowDetailModal(false);
                          handleAddImage(selectedProduct);
                        }}
                      >
                        <FaUpload className="me-2" />
                        Add Product Image
                      </Button>
                    </div>
                  )}
                </div>
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaImage className="me-2" />
            Add Product Image
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <p className="mb-3">
                Add an image for <strong>{selectedProduct.product_name}</strong>
              </p>

              {uploadError && (
                <Alert variant="danger" className="mb-3">
                  <FaExclamationTriangle className="me-2" />
                  {uploadError}
                </Alert>
              )}

              {uploadSuccess && (
                <Alert variant="success" className="mb-3">
                  <FaCheck className="me-2" />
                  {uploadSuccess}
                </Alert>
              )}

              <div
                {...getRootProps()}
                className={`border rounded p-4 text-center mb-3 ${isDragActive ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <input {...getInputProps()} />

                {imagePreview ? (
                  <div className="text-center">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      className="mb-3"
                      style={{ maxHeight: '200px' }}
                    />
                    <div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                        className="me-2"
                      >
                        <FaTrash className="me-1" /> Remove
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerFileInput();
                        }}
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
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUploadImage}
            disabled={!productImage || uploadLoading}
          >
            {uploadLoading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Upload Image
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewApproveProduct;
