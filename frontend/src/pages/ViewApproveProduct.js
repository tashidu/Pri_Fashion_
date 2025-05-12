// src/pages/ViewApproveProduct.js
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Card, Container, Row, Col, Table, Button, Form,
  Modal, Badge, Spinner, Alert, Image, InputGroup,
  Tabs, Tab, ProgressBar
} from "react-bootstrap";
import {
  FaSearch, FaSort, FaImage, FaUpload, FaTrash, FaUndo,
  FaInfoCircle, FaMoneyBillWave, FaTshirt, FaCalendarAlt,
  FaCheck, FaExclamationTriangle, FaEye, FaArrowLeft, FaArrowRight,
  FaShoppingCart, FaBoxOpen, FaWarehouse
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // State for product detail modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // State for image upload
  const [showImageModal, setShowImageModal] = useState(false);
  const [productImage, setProductImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // State for product order history
  const [productSales, setProductSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState("");

  // State for product packing sessions
  const [packingSessions, setPackingSessions] = useState([]);
  const [packingSessionsLoading, setPackingSessionsLoading] = useState(false);
  const [packingSessionsError, setPackingSessionsError] = useState("");

  // State for product packing inventory
  const [packingInventory, setPackingInventory] = useState(null);
  const [packingInventoryLoading, setPackingInventoryLoading] = useState(false);
  const [packingInventoryError, setPackingInventoryError] = useState("");

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
      // Fetch products
      const productsResponse = await axios.get("http://localhost:8000/api/finished_product/report/");

      // Fetch inventory data
      const inventoryResponse = await axios.get("http://localhost:8000/api/packing/inventory/");

      // Map inventory data to products
      const productsWithInventory = productsResponse.data.map(product => {
        const inventoryItem = inventoryResponse.data.find(item => item.product_id === product.id);
        return {
          ...product,
          inventory_status: inventoryItem || null
        };
      });

      setProducts(productsWithInventory);
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
    setActiveImageIndex(0); // Reset to first image
    setShowDetailModal(true);

    // Fetch additional data for the product
    fetchProductSales(product.id);
    fetchProductPackingSessions(product.id);
    fetchProductPackingInventory(product.id);
  };

  // Fetch product sales data
  const fetchProductSales = async (productId) => {
    setSalesLoading(true);
    setSalesError("");

    try {
      // Using the correct endpoint from the order app
      const response = await axios.get(`http://localhost:8000/api/orders/product/${productId}/sales/`);
      setProductSales(response.data);
    } catch (err) {
      console.error("Error fetching product sales data:", err);
      setSalesError("Failed to load sales data. Please try again.");
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch product packing sessions
  const fetchProductPackingSessions = async (productId) => {
    setPackingSessionsLoading(true);
    setPackingSessionsError("");

    try {
      // Using the correct endpoint from the packing app
      const response = await axios.get(`http://localhost:8000/api/packing/product/${productId}/sessions/`);
      setPackingSessions(response.data);
    } catch (err) {
      console.error("Error fetching product packing sessions:", err);
      setPackingSessionsError("Failed to load packing sessions. Please try again.");
    } finally {
      setPackingSessionsLoading(false);
    }
  };

  // Fetch product packing inventory
  const fetchProductPackingInventory = async (productId) => {
    setPackingInventoryLoading(true);
    setPackingInventoryError("");

    try {
      // Get all inventory items and filter for the current product
      const response = await axios.get(`http://localhost:8000/api/packing/inventory/`);
      const inventoryItem = response.data.find(item => item.product_id === productId);
      setPackingInventory(inventoryItem || null);
    } catch (err) {
      console.error("Error fetching product packing inventory:", err);
      setPackingInventoryError("Failed to load packing inventory. Please try again.");
    } finally {
      setPackingInventoryLoading(false);
    }
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
    formData.append('image', productImage);

    try {
      // Use the dedicated endpoint for adding a new product image
      const response = await axios.post(
        `http://localhost:8000/api/finished_product/upload-image/${selectedProduct.id}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadSuccess("Image uploaded successfully!");

      // Update the selected product with the new image URL
      if (response.data && response.data.image_url) {
        // If product already has images, add to the array
        if (selectedProduct.product_images && selectedProduct.product_images.length > 0) {
          setSelectedProduct({
            ...selectedProduct,
            product_images: [...selectedProduct.product_images, response.data.image_url]
          });
        }
        // If product has no images yet, create a new array
        else {
          setSelectedProduct({
            ...selectedProduct,
            product_images: [response.data.image_url],
            // Also update the primary image for backward compatibility
            product_image: response.data.image_url
          });
        }
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Render order status badge
  const renderOrderStatusBadge = (status) => {
    let variant = "secondary";

    switch (status) {
      case "draft":
        variant = "secondary";
        break;
      case "submitted":
        variant = "info";
        break;
      case "approved":
        variant = "primary";
        break;
      case "invoiced":
        variant = "warning";
        break;
      case "delivered":
        variant = "success";
        break;
      case "paid":
        variant = "success";
        break;
      case "partially_paid":
        variant = "warning";
        break;
      case "payment_due":
        variant = "danger";
        break;
      default:
        variant = "secondary";
    }

    return (
      <Badge bg={variant}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  // Render product sales history
  const renderSalesHistory = () => {
    if (salesLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" className="me-2">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <span>Loading sales data...</span>
        </div>
      );
    }

    if (salesError) {
      return (
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          {salesError}
        </Alert>
      );
    }

    if (!productSales || productSales.length === 0) {
      return (
        <div className="text-center py-4 bg-light rounded">
          <FaShoppingCart size={40} className="mb-3 text-secondary" />
          <p>No sales records found for this product</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table hover bordered>
          <thead>
            <tr className="bg-light">
              <th>Order ID</th>
              <th>Shop</th>
              <th>Date</th>
              <th>Status</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {productSales.map((sale, index) => (
              <tr key={index}>
                <td>#{sale.order_id}</td>
                <td>{sale.shop_name}</td>
                <td>{formatDate(sale.order_date)}</td>
                <td>{renderOrderStatusBadge(sale.order_status)}</td>
                <td>
                  {sale.total_units} units
                  <div className="small text-muted">
                    {sale.quantity_6_packs > 0 && `${sale.quantity_6_packs} × 6-packs, `}
                    {sale.quantity_12_packs > 0 && `${sale.quantity_12_packs} × 12-packs, `}
                    {sale.quantity_extra_items > 0 && `${sale.quantity_extra_items} extra items`}
                  </div>
                </td>
                <td>{formatCurrency(sale.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-light">
            <tr>
              <td colSpan="4" className="text-end"><strong>Total Sales:</strong></td>
              <td>
                <strong>
                  {productSales.reduce((sum, sale) => sum + sale.total_units, 0)} units
                </strong>
              </td>
              <td>
                <strong>
                  {formatCurrency(productSales.reduce((sum, sale) => sum + sale.subtotal, 0))}
                </strong>
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>
    );
  };

  // Render packing sessions
  const renderPackingSessions = () => {
    if (packingSessionsLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" className="me-2">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <span>Loading packing sessions...</span>
        </div>
      );
    }

    if (packingSessionsError) {
      return (
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          {packingSessionsError}
        </Alert>
      );
    }

    if (!packingSessions || packingSessions.length === 0) {
      return (
        <div className="text-center py-4 bg-light rounded">
          <FaBoxOpen size={40} className="mb-3 text-secondary" />
          <p>No packing sessions found for this product</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table hover bordered>
          <thead>
            <tr className="bg-light">
              <th>Date</th>
              <th>6-Packs</th>
              <th>12-Packs</th>
              <th>Extra Items</th>
              <th>Total Packed</th>
            </tr>
          </thead>
          <tbody>
            {packingSessions.map((session) => (
              <tr key={session.id}>
                <td>{formatDate(session.date)}</td>
                <td>{session.number_of_6_packs}</td>
                <td>{session.number_of_12_packs}</td>
                <td>{session.extra_items}</td>
                <td>{session.total_packed_quantity}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-light">
            <tr>
              <td className="text-end"><strong>Total:</strong></td>
              <td>
                <strong>
                  {packingSessions.reduce((sum, session) => sum + session.number_of_6_packs, 0)}
                </strong>
              </td>
              <td>
                <strong>
                  {packingSessions.reduce((sum, session) => sum + session.number_of_12_packs, 0)}
                </strong>
              </td>
              <td>
                <strong>
                  {packingSessions.reduce((sum, session) => sum + session.extra_items, 0)}
                </strong>
              </td>
              <td>
                <strong>
                  {packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0)}
                </strong>
              </td>
            </tr>
          </tfoot>
        </Table>
      </div>
    );
  };

  // Render packing inventory
  const renderPackingInventory = () => {
    if (packingInventoryLoading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" className="me-2">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <span>Loading inventory data...</span>
        </div>
      );
    }

    if (packingInventoryError) {
      return (
        <Alert variant="danger">
          <FaExclamationTriangle className="me-2" />
          {packingInventoryError}
        </Alert>
      );
    }

    if (!packingInventory || packingInventory.total_quantity === 0) {
      return (
        <div className="text-center py-4 bg-light rounded">
          <FaWarehouse size={40} className="mb-3 text-secondary" />
          <p>No inventory data found for this product</p>
        </div>
      );
    }

    return (
      <div>
        <Row>
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">Current Inventory</h6>
              </Card.Header>
              <Card.Body>
                <Table bordered hover>
                  <tbody>
                    <tr>
                      <td><strong>6-Packs:</strong></td>
                      <td>{packingInventory.number_of_6_packs} packs ({packingInventory.number_of_6_packs * 6} units)</td>
                    </tr>
                    <tr>
                      <td><strong>12-Packs:</strong></td>
                      <td>{packingInventory.number_of_12_packs} packs ({packingInventory.number_of_12_packs * 12} units)</td>
                    </tr>
                    <tr>
                      <td><strong>Extra Items:</strong></td>
                      <td>{packingInventory.extra_items} units</td>
                    </tr>
                    <tr className="bg-light">
                      <td><strong>Total Quantity:</strong></td>
                      <td><strong>{packingInventory.total_quantity} units</strong></td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header className="bg-light">
                <h6 className="mb-0">Inventory Distribution</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>6-Packs ({packingInventory.number_of_6_packs * 6} units)</span>
                    <span>{Math.round((packingInventory.number_of_6_packs * 6 / packingInventory.total_quantity) * 100)}%</span>
                  </div>
                  <ProgressBar
                    now={(packingInventory.number_of_6_packs * 6 / packingInventory.total_quantity) * 100}
                    variant="info"
                  />
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>12-Packs ({packingInventory.number_of_12_packs * 12} units)</span>
                    <span>{Math.round((packingInventory.number_of_12_packs * 12 / packingInventory.total_quantity) * 100)}%</span>
                  </div>
                  <ProgressBar
                    now={(packingInventory.number_of_12_packs * 12 / packingInventory.total_quantity) * 100}
                    variant="primary"
                  />
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <span>Extra Items ({packingInventory.extra_items} units)</span>
                    <span>{Math.round((packingInventory.extra_items / packingInventory.total_quantity) * 100)}%</span>
                  </div>
                  <ProgressBar
                    now={(packingInventory.extra_items / packingInventory.total_quantity) * 100}
                    variant="success"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Add this useEffect for handling responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <RoleBasedNavBar />
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
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

          {/* Summary Statistics */}
          {!loading && products.length > 0 && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted mb-2">Total Products</h6>
                    <h3>{products.length}</h3>
                    <div className="small text-muted">Approved Products</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted mb-2">Total Inventory</h6>
                    <h3>
                      {products.reduce((sum, product) => {
                        return sum + (product.inventory_status ? product.inventory_status.total_quantity : 0);
                      }, 0)}
                    </h3>
                    <div className="small text-muted">Units in Stock</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted mb-2">Products with Images</h6>
                    <h3>
                      {products.filter(product =>
                        (product.product_images && product.product_images.length > 0) || product.product_image
                      ).length}
                    </h3>
                    <div className="small text-muted">
                      {Math.round((products.filter(product =>
                        (product.product_images && product.product_images.length > 0) || product.product_image
                      ).length / products.length) * 100)}% of Products
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm h-100">
                  <Card.Body className="text-center">
                    <h6 className="text-muted mb-2">Average Profit Margin</h6>
                    <h3>
                      {Math.round(products.reduce((sum, product) => {
                        return sum + parseFloat(calculateProfitMargin(
                          product.manufacture_price,
                          product.selling_price
                        ));
                      }, 0) / products.length)}%
                    </h3>
                    <div className="small text-muted">Across All Products</div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

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
                      <th style={{ width: '80px' }}>Image</th>
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
                      <th>Inventory Status</th>
                      <th onClick={() => requestSort('approval_date')} style={{ cursor: 'pointer' }}>
                        Approval Date <FaSort className="ms-1" />
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <Spinner animation="border" role="status" className="me-2">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                          <span>Loading products...</span>
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <FaExclamationTriangle className="text-warning mb-3" size={30} />
                          <p className="mb-0">No products found matching your search criteria</p>
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
                            <td className="text-center">
                              {product.product_images && product.product_images.length > 0 ? (
                                <div className="position-relative">
                                  <Image
                                    src={product.product_images[0]}
                                    alt={product.product_name}
                                    style={{
                                      width: '60px',
                                      height: '60px',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => handleViewDetails(product)}
                                  />
                                  {product.product_images.length > 1 && (
                                    <Badge
                                      bg="primary"
                                      pill
                                      className="position-absolute top-0 end-0 translate-middle"
                                      style={{ fontSize: '0.6rem' }}
                                    >
                                      +{product.product_images.length - 1}
                                    </Badge>
                                  )}
                                </div>
                              ) : product.product_image ? (
                                <Image
                                  src={product.product_image}
                                  alt={product.product_name}
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleViewDetails(product)}
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light"
                                  style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleAddImage(product)}
                                >
                                  <FaImage size={20} className="text-secondary" />
                                </div>
                              )}
                            </td>
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
                            <td>
                              {product.inventory_status ? (
                                <div>
                                  <Badge bg={product.inventory_status.total_quantity > 0 ? "success" : "danger"}>
                                    {product.inventory_status.total_quantity} units in stock
                                  </Badge>
                                  {product.inventory_status.total_quantity > 0 && (
                                    <div className="mt-1 small text-muted">
                                      <div>{product.inventory_status.number_of_6_packs} × 6-packs</div>
                                      <div>{product.inventory_status.number_of_12_packs} × 12-packs</div>
                                      <div>{product.inventory_status.extra_items} extra items</div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Badge bg="warning">No inventory data</Badge>
                              )}
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
                                <FaImage className="me-1" />
                                {product.product_images && product.product_images.length > 0
                                  ? `Add More Images (${product.product_images.length})`
                                  : product.product_image
                                    ? 'Change Image'
                                    : 'Add Image'
                                }
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
          <Modal.Title>
            {selectedProduct ? `${selectedProduct.product_name} - Details` : 'Product Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              {/* Product Name Display */}
              <div className="mb-4 text-center">
                <h4 className="fw-bold">{selectedProduct.product_name}</h4>
              </div>

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
                <Tab eventKey="orders" title={<span><FaShoppingCart className="me-2" />Order History</span>}>
                  <div className="p-2">
                    <h5 className="mb-3">Order History</h5>
                    {renderSalesHistory()}
                  </div>
                </Tab>
                <Tab eventKey="packing" title={<span><FaBoxOpen className="me-2" />Packing Sessions</span>}>
                  <div className="p-2">
                    <h5 className="mb-3">Packing Sessions History</h5>
                    {renderPackingSessions()}
                  </div>
                </Tab>
                <Tab eventKey="inventory" title={<span><FaWarehouse className="me-2" />Inventory</span>}>
                  <div className="p-2">
                    <h5 className="mb-3">Current Packing Inventory</h5>
                    {renderPackingInventory()}
                  </div>
                </Tab>
                <Tab eventKey="image" title={<span><FaImage className="me-2" />Product Images</span>}>
                  <div className="text-center p-4">
                    {selectedProduct.product_images && selectedProduct.product_images.length > 0 ? (
                      <div>
                        <div className="position-relative mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                          {/* Main Image Display */}
                          <Image
                            src={selectedProduct.product_images[activeImageIndex]}
                            alt={`${selectedProduct.product_name} - Image ${activeImageIndex + 1}`}
                            fluid
                            className="shadow-sm"
                            style={{
                              maxHeight: '400px',
                              borderRadius: '8px',
                              objectFit: 'contain',
                              backgroundColor: '#f8f9fa'
                            }}
                          />

                          {/* Image Navigation Controls */}
                          {selectedProduct.product_images.length > 1 && (
                            <>
                              <Button
                                variant="light"
                                size="sm"
                                className="position-absolute top-50 start-0 translate-middle-y"
                                style={{ opacity: 0.8 }}
                                onClick={() => setActiveImageIndex(prev => (prev === 0 ? selectedProduct.product_images.length - 1 : prev - 1))}
                              >
                                <FaArrowLeft />
                              </Button>
                              <Button
                                variant="light"
                                size="sm"
                                className="position-absolute top-50 end-0 translate-middle-y"
                                style={{ opacity: 0.8 }}
                                onClick={() => setActiveImageIndex(prev => (prev === selectedProduct.product_images.length - 1 ? 0 : prev + 1))}
                              >
                                <FaArrowRight />
                              </Button>
                            </>
                          )}

                          {/* Add/Change Image Button */}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="position-absolute top-0 end-0 m-2"
                            onClick={() => {
                              setShowDetailModal(false);
                              handleAddImage(selectedProduct);
                            }}
                          >
                            <FaUpload className="me-1" /> Add More
                          </Button>
                        </div>

                        {/* Thumbnail Navigation */}
                        {selectedProduct.product_images.length > 1 && (
                          <div className="d-flex justify-content-center flex-wrap mt-3 mb-3">
                            {selectedProduct.product_images.map((img, index) => (
                              <div
                                key={index}
                                onClick={() => setActiveImageIndex(index)}
                                className={`m-1 border ${activeImageIndex === index ? 'border-primary' : 'border-light'}`}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  borderWidth: activeImageIndex === index ? '2px' : '1px'
                                }}
                              >
                                <Image
                                  src={img}
                                  alt={`Thumbnail ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: '3px'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-muted">
                          {selectedProduct.product_images.length > 1
                            ? `Image ${activeImageIndex + 1} of ${selectedProduct.product_images.length} for ${selectedProduct.product_name}`
                            : `Product image for ${selectedProduct.product_name}`
                          }
                        </p>
                      </div>
                    ) : selectedProduct.product_image ? (
                      <div>
                        <div className="position-relative mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                          <Image
                            src={selectedProduct.product_image}
                            alt={selectedProduct.product_name}
                            fluid
                            className="shadow-sm"
                            style={{
                              maxHeight: '400px',
                              borderRadius: '8px',
                              objectFit: 'contain',
                              backgroundColor: '#f8f9fa'
                            }}
                          />
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="position-absolute top-0 end-0 m-2"
                            onClick={() => {
                              setShowDetailModal(false);
                              handleAddImage(selectedProduct);
                            }}
                          >
                            <FaUpload className="me-1" /> Change
                          </Button>
                        </div>
                        <p className="text-muted">Product image for {selectedProduct.product_name}</p>
                      </div>
                    ) : (
                      <div className="p-5 bg-light rounded shadow-sm" style={{ maxWidth: '500px', margin: '0 auto' }}>
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
            </>
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
            {selectedProduct && selectedProduct.product_images && selectedProduct.product_images.length > 0
              ? `Add More Images for ${selectedProduct.product_name}`
              : selectedProduct && selectedProduct.product_image
                ? `Change Product Image for ${selectedProduct.product_name}`
                : `Add Product Image`
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <p className="mb-3">
                {selectedProduct.product_images && selectedProduct.product_images.length > 0
                  ? `Add another image for ${selectedProduct.product_name}. Current images: ${selectedProduct.product_images.length}`
                  : selectedProduct.product_image
                    ? `Replace the current image for ${selectedProduct.product_name}`
                    : `Add an image for ${selectedProduct.product_name}`
                }
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
                className={`border rounded p-4 text-center mb-3 ${isDragActive ? 'bg-light border-primary' : ''}`}
                style={{
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  transition: 'all 0.3s ease'
                }}
              >
                <input {...getInputProps()} />

                {imagePreview ? (
                  <div className="text-center">
                    <div className="position-relative mb-3" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        className="shadow-sm"
                        style={{
                          maxHeight: '250px',
                          borderRadius: '8px',
                          objectFit: 'contain'
                        }}
                      />
                      <div className="position-absolute top-0 end-0 m-2">
                        <Button
                          variant="light"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          className="me-2 shadow-sm"
                        >
                          <FaTrash className="text-danger" />
                        </Button>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerFileInput();
                          }}
                          className="shadow-sm"
                        >
                          <FaUndo className="text-primary" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted">Image selected for {selectedProduct.product_name}</p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FaUpload size={40} className="mb-3 text-primary" />
                    <h5>Drag & drop a product image here</h5>
                    <p>or click to select from your device</p>
                    <p className="text-muted small mt-3">Supported formats: JPEG, PNG, GIF (Max: 5MB)</p>
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
