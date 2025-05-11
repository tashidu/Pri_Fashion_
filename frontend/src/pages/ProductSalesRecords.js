import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
  Pagination,
  Modal
} from "react-bootstrap";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaChartLine,
  FaDownload,
  FaEye,
  FaShoppingCart
} from "react-icons/fa";
import SalesTeamNavBar from "../components/SalesTeamNavBar";

function ProductSalesRecords() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("product_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesSummary, setSalesSummary] = useState({
    totalOrders: 0,
    totalUnits: 0,
    totalAmount: 0,
    averageOrderSize: 0
  });

  // Format currency in LKR
  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Fetch products data
  useEffect(() => {
    setProductLoading(true);
    axios
      .get("http://localhost:8000/api/finished_product/sales-products/")
      .then((res) => {
        setProducts(res.data);
        setProductLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching product list:", err);
        setError("Failed to fetch product list. Please try again later.");
        setProductLoading(false);
      });
  }, []);

  // Fetch sales data for a specific product
  const fetchSalesData = (productId) => {
    setLoading(true);
    setSalesData([]);
    setError(null);

    axios
      .get(`http://localhost:8000/api/orders/product/${productId}/sales/`)
      .then((res) => {
        setSalesData(res.data);
        calculateSalesSummary(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching sales data:", err);
        setError("Failed to fetch sales data. Please try again later.");
        setLoading(false);
      });
  };

  // Calculate sales summary statistics
  const calculateSalesSummary = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      setSalesSummary({
        totalOrders: 0,
        totalUnits: 0,
        totalAmount: 0,
        averageOrderSize: 0
      });
      return;
    }

    const totalOrders = data.length;
    const totalUnits = data.reduce((sum, item) => sum + (item.total_units || 0), 0);
    const totalAmount = data.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const averageOrderSize = totalOrders > 0 ? totalUnits / totalOrders : 0;

    setSalesSummary({
      totalOrders,
      totalUnits,
      totalAmount,
      averageOrderSize: parseFloat(averageOrderSize.toFixed(2))
    });
  };

  // Handle product selection
  const handleProductSelect = (e) => {
    const productId = e.target.value;
    if (productId) {
      const product = products.find((p) => p.id === parseInt(productId));
      setSelectedProduct(product);
      fetchSalesData(productId);
    } else {
      setSelectedProduct(null);
      setSalesData([]);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Render pagination
  const renderPagination = () => {
    const pageItems = [];
    for (let i = 1; i <= totalPages; i++) {
      pageItems.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
        {pageItems}
        <Pagination.Next
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Get badge class for order status
  const getBadgeClass = (status) => {
    switch (status) {
      case "delivered":
        return "bg-success";
      case "approved":
        return "bg-primary";
      case "pending":
        return "bg-warning";
      case "draft":
        return "bg-secondary";
      default:
        return "bg-info";
    }
  };

  // Show sales summary modal
  const showSalesSummaryModal = () => {
    setShowSalesModal(true);
  };

  return (
    <>
      <SalesTeamNavBar />
      <div
        style={{
          marginLeft: window.innerWidth >= 768 ? "240px" : "70px",
          width: `calc(100% - ${window.innerWidth >= 768 ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <Container fluid>
          <Row className="mb-4">
            <Col>
              <h2 className="mb-0">
                <FaShoppingCart className="me-2 text-primary" />
                Product Sales Records
              </h2>
              <p className="text-muted">
                View and analyze sales data for each product
              </p>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={12}>
              <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB" }}>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Select Product</Form.Label>
                        <Form.Select
                          onChange={handleProductSelect}
                          disabled={productLoading}
                        >
                          <option value="">-- Select a product --</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.product_name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Search Products</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <FaSearch />
                          </span>
                          <Form.Control
                            type="text"
                            placeholder="Search by product name..."
                            value={searchTerm}
                            onChange={handleSearch}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {selectedProduct && (
            <Row className="mb-4">
              <Col md={12}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Sales Data for {selectedProduct.product_name}</h5>
                      <Button
                        variant="light"
                        size="sm"
                        onClick={showSalesSummaryModal}
                      >
                        <FaChartLine className="me-1" /> View Summary
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Loading sales data...</p>
                      </div>
                    ) : error ? (
                      <Alert variant="danger">{error}</Alert>
                    ) : salesData.length === 0 || (typeof salesData === 'object' && salesData.message) ? (
                      <Alert variant="info">
                        {typeof salesData === 'object' && salesData.message
                          ? salesData.message
                          : "No sales data found for this product."}
                      </Alert>
                    ) : (
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead className="table-light">
                            <tr>
                              <th>Order ID</th>
                              <th>Shop</th>
                              <th>Order Date</th>
                              <th>6-Packs</th>
                              <th>12-Packs</th>
                              <th>Extra Items</th>
                              <th>Total Units</th>
                              <th>Amount (LKR)</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(salesData) && salesData.map((sale) => (
                              <tr key={sale.order_id + '-' + (sale.id || Math.random())}>
                                <td>#{sale.order_id}</td>
                                <td>{sale.shop_name}</td>
                                <td>{new Date(sale.order_date).toLocaleDateString()}</td>
                                <td>{sale.quantity_6_packs}</td>
                                <td>{sale.quantity_12_packs}</td>
                                <td>{sale.quantity_extra_items}</td>
                                <td>{sale.total_units}</td>
                                <td>{formatCurrency(sale.subtotal)}</td>
                                <td>
                                  <Badge bg={getBadgeClass(sale.order_status)}>
                                    {sale.order_status.charAt(0).toUpperCase() + sale.order_status.slice(1)}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Sales Summary Modal */}
          <Modal show={showSalesModal} onHide={() => setShowSalesModal(false)}>
            <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>Sales Summary</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedProduct && (
                <div>
                  <h5 className="mb-3">{selectedProduct.product_name}</h5>
                  <Table bordered>
                    <tbody>
                      <tr>
                        <td className="fw-bold">Total Orders</td>
                        <td>{salesSummary.totalOrders}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Total Units Sold</td>
                        <td>{salesSummary.totalUnits}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Total Sales Amount</td>
                        <td>{formatCurrency(salesSummary.totalAmount)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Average Order Size</td>
                        <td>{salesSummary.averageOrderSize} units</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSalesModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </>
  );
}

export default ProductSalesRecords;
