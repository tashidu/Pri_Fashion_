import React, { useState, useEffect, useCallback } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, Table, Spinner, Form, Modal } from 'react-bootstrap';
import {
  FaTshirt,
  FaClipboardCheck,
  FaFileInvoice,
  FaMoneyBillWave,
  FaChartLine,
  FaBoxes,
  FaBuilding,
  FaSearch,
  FaEye,
  FaHistory,
  FaKeyboard,
  FaExclamationTriangle,
  FaStore,
  FaShoppingBag,
  FaCalendarAlt,
  FaPercentage,
  FaArrowUp,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFilter,
  FaInfoCircle
} from 'react-icons/fa';
import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Import DashboardCard component if available, otherwise define it inline
import DashboardCard from "../components/DashboardCard";

// CSS for hover effect
const hoverStyles = `
  .hover-shadow:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

function OwnerDashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState(6); // Default to 6 months
  // Initialize stats with default values
  const [stats, setStats] = useState({
    pendingApprovalCount: 0,
    pendingInvoiceCount: 0,
    paymentsOverdueCount: 0,
    totalSalesValue: 0,
    fabricStockValue: 0, // This will be calculated from remainingFabrics
    todaySewingCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [remainingFabrics, setRemainingFabrics] = useState([]);
  const [packingData, setPackingData] = useState([]);
  const [salesPerformance, setSalesPerformance] = useState({
    monthly_sales: [],
    top_products: [],
    shop_sales: [],
    payment_status: {
      paid_count: 0,
      partially_paid_count: 0,
      payment_due_count: 0,
      total_paid: 0,
      total_amount: 0,
      payment_rate: 0
    }
  });

  const [productIncomeData, setProductIncomeData] = useState({
    total_sales_amount: 0,
    products: []
  });

  // COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57'];

  // Modal state for unpacked items
  const [showUnpackedModal, setShowUnpackedModal] = useState(false);
  const [unpackedItems, setUnpackedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'available_quantity', direction: 'desc' });
  const [filterText, setFilterText] = useState('');

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch packing report data
        const packingResponse = await axios.get('http://localhost:8000/api/reports/product-packing-report/');
        setPackingData(packingResponse.data);

        // Fetch fabric stock data
        const fabricResponse = await axios.get('http://localhost:8000/api/reports/dashboard/fabric-stock/');
        setRemainingFabrics(fabricResponse.data);

        // Calculate fabric stock value
        const fabricStockValue = fabricResponse.data.reduce((sum, fabric) =>
          sum + (fabric.availableYards * fabric.pricePerYard), 0);

        // Fetch today's sewing count
        const todaySewingResponse = await axios.get('http://localhost:8000/api/sewing/today-count/');
        const todaySewingCount = todaySewingResponse.data.total_sewn_today;

        // Fetch orders data - we'll simulate this for now
        try {
          const ordersResponse = await axios.get('http://localhost:8000/api/orders/orders/create/');

          // Filter orders by status
          const pendingApproval = ordersResponse.data.filter(order => order.status === 'submitted').length;
          const pendingInvoice = ordersResponse.data.filter(order => order.status === 'approved').length;
          const paymentsOverdue = ordersResponse.data.filter(order => order.is_payment_overdue).length;

          // Calculate total sales value
          const totalSales = ordersResponse.data.reduce((sum, order) =>
            sum + (order.total_amount || 0), 0);

          // Set stats with real values from API
          setStats({
            pendingApprovalCount: pendingApproval,
            pendingInvoiceCount: pendingInvoice,
            paymentsOverdueCount: paymentsOverdue,
            totalSalesValue: totalSales,
            fabricStockValue: fabricStockValue,
            todaySewingCount: todaySewingCount
          });

          // Get recent orders
          setRecentOrders(ordersResponse.data.slice(0, 5));

        } catch (error) {
          console.error('Error fetching orders:', error);
          // Set empty recent orders if there's an error
          setRecentOrders([]);

          // Set default stats in case of error
          setStats({
            pendingApprovalCount: 0,
            pendingInvoiceCount: 0,
            paymentsOverdueCount: 0,
            totalSalesValue: 0,
            fabricStockValue: fabricStockValue,
            todaySewingCount: 0
          });
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty fabric stock in case of error
        setRemainingFabrics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch sales performance data
  useEffect(() => {
    const fetchSalesPerformance = async () => {
      try {
        setSalesLoading(true);

        // Fetch sales performance data from the API
        const response = await axios.get(`http://localhost:8000/api/reports/sales/performance/?months=${timeFrame}`);
        setSalesPerformance(response.data);

        // Fetch product income percentage data
        const incomeResponse = await axios.get(`http://localhost:8000/api/reports/sales/product-income-percentage/?months=${timeFrame}`);
        setProductIncomeData(incomeResponse.data);

      } catch (error) {
        console.error('Error fetching sales performance data:', error);

        // Set empty data for sales performance in case of error
        setSalesPerformance({
          monthly_sales: [],
          top_products: [],
          shop_sales: [],
          payment_status: {
            paid_count: 0,
            partially_paid_count: 0,
            payment_due_count: 0,
            total_paid: 0,
            total_amount: 0,
            payment_rate: 0
          }
        });

        // Set empty data for product income percentage in case of error
        setProductIncomeData({
          total_sales_amount: 0,
          products: []
        });
      } finally {
        setSalesLoading(false);
      }
    };

    fetchSalesPerformance();
  }, [timeFrame]);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e) => {
    // Only process if no input elements are focused
    if (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.tagName === 'SELECT') {
      return;
    }

    // View shortcuts
    if (e.ctrlKey) {
      switch (e.key) {
        case 'o':
          e.preventDefault();
          navigate('/owner-orders');
          break;
        case 'p':
          e.preventDefault();
          navigate('/approveproduct-list');
          break;
        case 's':
          e.preventDefault();
          navigate('/viewsuppliers');
          break;
        default:
          break;
      }
    }

    // Help shortcut
    if (e.key === '?') {
      e.preventDefault();
      alert('Keyboard Shortcuts:\n\nCtrl+O: View Orders\nCtrl+P: View Products\nCtrl+S: View Suppliers');
    }
  }, [navigate]);

  // Add keyboard shortcut listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'submitted': return 'warning';
      case 'approved': return 'info';
      case 'invoiced': return 'primary';
      case 'delivered': return 'success';
      case 'paid': return 'success';
      case 'partially_paid': return 'info';
      case 'payment_due': return 'danger';
      default: return 'secondary';
    }
  };

  // Handle opening the unpacked items modal
  const handleShowUnpackedModal = () => {
    // Filter items that have available_quantity > 0 (unpacked items)
    const items = packingData.filter(item => item.available_quantity > 0);
    setUnpackedItems(items);
    setShowUnpackedModal(true);
  };

  // Handle sorting in the modal
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted and filtered items
  const getSortedAndFilteredItems = () => {
    // First filter by search text
    let filteredItems = unpackedItems;
    if (filterText) {
      const lowerCaseFilter = filterText.toLowerCase();
      filteredItems = unpackedItems.filter(item =>
        item.product_name.toLowerCase().includes(lowerCaseFilter)
      );
    }

    // Then sort
    return [...filteredItems].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  return (
    <>
      {/* Add the hover styles */}
      <style>{hoverStyles}</style>

      <RoleBasedNavBar />

      {/* Unpacked Items Modal */}
      <Modal
        show={showUnpackedModal}
        onHide={() => setShowUnpackedModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <FaBoxes className="me-2 text-success" />
            Items Not Yet Packed
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <Form.Group className="mb-0" style={{ width: '60%' }}>
              <Form.Control
                type="text"
                placeholder="Search by product name..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </Form.Group>
            <div>
              <Badge bg="info" className="me-2">
                Total Items: {getSortedAndFilteredItems().reduce((acc, item) => acc + item.available_quantity, 0)}
              </Badge>
              <Badge bg="success">
                Products: {getSortedAndFilteredItems().length}
              </Badge>
            </div>
          </div>

          <Table hover responsive>
            <thead>
              <tr>
                <th onClick={() => handleSort('product_name')} style={{ cursor: 'pointer' }}>
                  Product Name
                  {sortConfig.key === 'product_name' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                  )}
                </th>
                <th onClick={() => handleSort('total_sewn')} style={{ cursor: 'pointer' }}>
                  Total Sewn
                  {sortConfig.key === 'total_sewn' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                  )}
                </th>
                <th onClick={() => handleSort('total_packed')} style={{ cursor: 'pointer' }}>
                  Total Packed
                  {sortConfig.key === 'total_packed' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                  )}
                </th>
                <th onClick={() => handleSort('available_quantity')} style={{ cursor: 'pointer' }}>
                  Available to Pack
                  {sortConfig.key === 'available_quantity' && (
                    sortConfig.direction === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getSortedAndFilteredItems().map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.total_sewn}</td>
                  <td>{item.total_packed}</td>
                  <td>
                    <Badge bg="warning" className="p-2">
                      {item.available_quantity} units
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate('/add-packing-session', { state: { productId: item.id } })}
                    >
                      <FaBoxes className="me-1" /> Pack Now
                    </Button>
                  </td>
                </tr>
              ))}
              {getSortedAndFilteredItems().length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    {filterText ? "No matching products found" : "No unpacked items available"}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="mt-3 p-3 bg-light rounded">
            <h6 className="mb-2"><FaInfoCircle className="me-2 text-info" />Packing Recommendations</h6>
            <ul className="mb-0">
              <li>Focus on products with higher available quantities first</li>
              <li>Consider packing in standard 6-packs or 12-packs for efficient inventory management</li>
              <li>Products that have been sewn recently may need quality inspection before packing</li>
            </ul>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUnpackedModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/add-packing-session')}
          >
            Go to Packing Page
          </Button>
        </Modal.Footer>
      </Modal>
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <Container fluid>
          {/* Dashboard Header */}
          <Row className="mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="mb-1">Owner Dashboard</h1>
                  <p className="text-muted">
                    Welcome! Here's your business overview.
                  </p>
                </div>
                <div>
                  <Button
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => alert('Keyboard Shortcuts:\n\nCtrl+O: View Orders\nCtrl+P: View Products\nCtrl+S: View Suppliers')}
                  >
                    <FaKeyboard />
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/owner-orders')}
                  >
                    <FaSearch className="me-2" />
                    View Orders
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Key Metrics Dashboard */}
          <Row className="mb-4">
            <Col lg={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaChartLine className="text-primary me-2" />
                    Key Metrics Dashboard
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setLoading(true);
                      setSalesLoading(true);
                      Promise.all([
                        axios.get('http://localhost:8000/api/reports/product-packing-report/'),
                        axios.get('http://localhost:8000/api/reports/dashboard/fabric-stock/'),
                        axios.get('http://localhost:8000/api/orders/orders/create/'),
                        axios.get(`http://localhost:8000/api/reports/sales/performance/?months=${timeFrame}`),
                        axios.get(`http://localhost:8000/api/reports/sales/product-income-percentage/?months=${timeFrame}`),
                        axios.get('http://localhost:8000/api/sewing/today-count/')
                      ]).then(([packingResponse, fabricResponse, ordersResponse, salesResponse, incomeResponse, todaySewingResponse]) => {
                        setPackingData(packingResponse.data);
                        setRemainingFabrics(fabricResponse.data);

                        // Process orders data
                        const pendingApproval = ordersResponse.data.filter(order => order.status === 'submitted').length;
                        const pendingInvoice = ordersResponse.data.filter(order => order.status === 'approved').length;
                        const paymentsOverdue = ordersResponse.data.filter(order => order.is_payment_overdue).length;
                        const totalSales = ordersResponse.data.reduce((sum, order) => sum + (order.total_amount || 0), 0);

                        // Calculate fabric stock value
                        const fabricStockValue = fabricResponse.data.reduce((sum, fabric) =>
                          sum + (fabric.availableYards * fabric.pricePerYard), 0);

                        // Set stats with real values
                        setStats({
                          pendingApprovalCount: pendingApproval,
                          pendingInvoiceCount: pendingInvoice,
                          paymentsOverdueCount: paymentsOverdue,
                          totalSalesValue: totalSales,
                          fabricStockValue: fabricStockValue,
                          todaySewingCount: todaySewingResponse.data.total_sewn_today
                        });

                        setRecentOrders(ordersResponse.data.slice(0, 5));
                        setSalesPerformance(salesResponse.data);
                        setProductIncomeData(incomeResponse.data);
                      }).catch(error => {
                        console.error('Error refreshing dashboard data:', error);
                      }).finally(() => {
                        setLoading(false);
                        setSalesLoading(false);
                      });
                    }}
                  >
                    <FaHistory className="me-1" /> Refresh Data
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {/* Total Revenue */}
                    <Col md={4} className="mb-3">
                      <Card style={{ backgroundColor: '#D9EDFB', border: 'none' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Total Revenue</h6>
                              <h3 className="mb-0">
                                {loading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  `Rs. ${stats.totalSalesValue.toLocaleString()}`
                                )}
                              </h3>
                              <small className="text-success">
                                <FaArrowUp className="me-1" />
                                {salesPerformance.monthly_sales.length > 1 ?
                                  `${Math.round((salesPerformance.monthly_sales[salesPerformance.monthly_sales.length - 1].total_sales /
                                  salesPerformance.monthly_sales[salesPerformance.monthly_sales.length - 2].total_sales - 1) * 100)}% from last month` :
                                  'Calculating...'}
                              </small>
                            </div>
                            <div style={{ fontSize: '2.5rem', opacity: 0.7, color: '#0d6efd' }}>
                              <FaMoneyBillWave />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Low Stock Fabrics */}
                    <Col md={4} className="mb-3">
                      <Card style={{ backgroundColor: '#D9EDFB', border: 'none' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Low Stock Fabrics</h6>
                              <h3 className="mb-0">
                                {loading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  remainingFabrics.filter(fabric => fabric.availableYards < fabric.totalYards * 0.2).length
                                )}
                              </h3>
                              <small className="text-warning">
                                <FaExclamationTriangle className="me-1" />
                                Requires attention
                              </small>
                            </div>
                            <div style={{ fontSize: '2.5rem', opacity: 0.7, color: '#ffc107' }}>
                              <FaTshirt />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Daily Sewing */}
                    <Col md={4} className="mb-3">
                      <Card style={{ backgroundColor: '#D9EDFB', border: 'none' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Daily Sewing</h6>
                              <h3 className="mb-0">
                                {loading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  `${stats.todaySewingCount} units`
                                )}
                              </h3>
                              <small className="text-primary">
                                <FaCalendarAlt className="me-1" />
                                Production today
                              </small>
                            </div>
                            <div style={{ fontSize: '2.5rem', opacity: 0.7, color: '#0d6efd' }}>
                              <FaClipboardCheck />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Fabric Stock Value */}
                    <Col md={4} className="mb-3">
                      <Card style={{ backgroundColor: '#D9EDFB', border: 'none' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Fabric Stock Value</h6>
                              <h3 className="mb-0">
                                {loading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  `Rs. ${Math.round(stats.fabricStockValue).toLocaleString()}`
                                )}
                              </h3>
                              <small className="text-info">
                                <FaStore className="me-1" />
                                Total inventory value
                              </small>
                            </div>
                            <div style={{ fontSize: '2.5rem', opacity: 0.7, color: '#17a2b8' }}>
                              <FaBuilding />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Production Efficiency */}
                    <Col md={4} className="mb-3">
                      <Card
                        style={{
                          backgroundColor: '#D9EDFB',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        className="hover-shadow"
                        onClick={handleShowUnpackedModal}
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Production Efficiency</h6>
                              <h3 className="mb-0">
                                {loading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  `${Math.round(
                                    (packingData.reduce((sum, item) => sum + item.total_packed, 0) /
                                    Math.max(1, packingData.reduce((sum, item) => sum + item.total_sewn, 0)) * 100)
                                  )}%`
                                )}
                              </h3>
                              <small className="text-success">
                                <FaPercentage className="me-1" />
                                Packed vs Sewn
                              </small>
                            </div>
                            <div style={{ fontSize: '2.5rem', opacity: 0.7, color: '#28a745' }}>
                              <FaBoxes />
                            </div>
                          </div>
                          <div className="text-center mt-2">
                            <small className="text-primary">
                              <FaInfoCircle className="me-1" />
                              Click for unpacked items details
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Payment Collection Rate */}
                    <Col md={4} className="mb-3">
                      <Card style={{ backgroundColor: '#D9EDFB', border: 'none' }}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="text-muted mb-1">Payment Collection</h6>
                              <h3 className="mb-0">
                                {salesLoading ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  `${salesPerformance.payment_status.payment_rate.toFixed(1)}%`
                                )}
                              </h3>
                              <small className="text-warning">
                                <FaShoppingBag className="me-1" />
                                Collection rate
                              </small>
                            </div>
                            <div style={{ fontSize: '2.5rem', opacity: 0.7, color: '#dc3545' }}>
                              <FaFileInvoice />
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Stats Cards */}
          <Row>
            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Pending Approval"
                value={loading ? "..." : stats.pendingApprovalCount.toString()}
                icon={<FaClipboardCheck />}
                linkTo="/owner-orders"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Pending Invoice"
                value={loading ? "..." : stats.pendingInvoiceCount.toString()}
                icon={<FaFileInvoice />}
                linkTo="/owner-orders"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Payments Due"
                value={loading ? "..." : stats.paymentsOverdueCount.toString()}
                icon={<FaMoneyBillWave />}
                linkTo="/owner-orders"
                color="#FFE0E0"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Total Sales"
                value={loading ? "..." : `Rs. ${stats.totalSalesValue.toLocaleString()}`}
                icon={<FaChartLine />}
                linkTo="/owner-orders"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Fabric Value"
                value={loading ? "..." : `Rs. ${Math.round(stats.fabricStockValue).toLocaleString()}`}
                icon={<FaTshirt />}
                linkTo="/viewfabric"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Today's Sewing"
                value={loading ? "..." : stats.todaySewingCount.toString()}
                icon={<FaBoxes />}
                linkTo="/sewing-history"
              />
            </Col>
          </Row>

          {/* Main Content */}
          <Row>
            {/* Recent Orders */}
            <Col lg={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaClipboardCheck className="text-primary me-2" />
                    Recent Orders
                  </h5>
                  <Button variant="link" size="sm" onClick={() => navigate('/owner-orders')}>
                    View All Orders
                  </Button>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Shop</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.id}</td>
                            <td>{order.shop_name}</td>
                            <td>{formatDate(order.created_at)}</td>
                            <td>
                              <Badge bg={getStatusBadgeColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td>Rs. {order.total_amount?.toLocaleString() || 0}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/owner-orders?id=${order.id}`)}
                              >
                                <FaEye />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {recentOrders.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-3">
                              No recent orders found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Remaining Fabric Stock */}
            <Col lg={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaTshirt className="text-success me-2" />
                    Remaining Fabric Stock
                  </h5>
                  <Button variant="link" size="sm" onClick={() => navigate('/viewfabric')}>
                    View All Fabrics
                  </Button>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="success" />
                    </div>
                  ) : (
                    <Table hover responsive>
                      <thead>
                        <tr>
                          <th>Fabric</th>
                          <th>Color</th>
                          <th>Available Yards</th>
                          <th>Cost</th>
                          <th>Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {remainingFabrics.map((fabric) => (
                          <tr key={fabric.id}>
                            <td>{fabric.name.split(' - ')[0]}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: fabric.colorCode,
                                    border: '1px solid #ddd',
                                    marginRight: '8px',
                                    borderRadius: '4px'
                                  }}
                                ></div>
                                {fabric.name.split(' - ')[1]}
                              </div>
                            </td>
                            <td>{fabric.availableYards.toFixed(2)}</td>
                            <td>Rs. {fabric.pricePerYard.toLocaleString()}</td>
                            <td>Rs. {(fabric.availableYards * fabric.pricePerYard).toLocaleString()}</td>
                          </tr>
                        ))}
                        {remainingFabrics.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center py-3">
                              No fabric stock data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Packing Overview */}
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaBoxes className="text-primary me-2" />
                    Packing Overview
                  </h5>
                  
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <>
                      {/* Quick Analytics */}
                      <div className="d-flex justify-content-between mb-4 flex-wrap">
                        <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                          <h5 className="mb-1">Total Sewn</h5>
                          <p className="mb-0 fs-4">
                            {packingData.reduce((sum, item) => sum + item.total_sewn, 0)} units
                          </p>
                        </div>
                        <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                          <h5 className="mb-1">Total Packed</h5>
                          <p className="mb-0 fs-4">
                            {packingData.reduce((sum, item) => sum + item.total_packed, 0)} units
                          </p>
                        </div>
                        <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                          <h5 className="mb-1">Available Left</h5>
                          <p className="mb-0 fs-4">
                            {packingData.reduce((sum, item) => sum + item.available_quantity, 0)} units
                          </p>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={packingData}>
                          <XAxis dataKey="product_name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total_sewn" fill="#8884d8" name="Total Sewn" />
                          <Bar dataKey="total_packed" fill="#82ca9d" name="Total Packed" />
                          <Bar dataKey="available_quantity" fill="#ffc658" name="Available Left" />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Sales Performance Analysis */}
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FaChartLine className="text-success me-2" />
                    Sales Performance Analysis
                  </h5>
                  <Form.Select
                    style={{ width: 'auto' }}
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(Number(e.target.value))}
                  >
                    <option value={3}>Last 3 Months</option>
                    <option value={6}>Last 6 Months</option>
                    <option value={12}>Last 12 Months</option>
                  </Form.Select>
                </Card.Header>
                <Card.Body>
                  {salesLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="success" />
                    </div>
                  ) : (
                    <>
                      {/* Monthly Sales Trend */}
                      <h6 className="mb-3">Monthly Sales Trend</h6>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={salesPerformance.monthly_sales}>
                          <XAxis dataKey="month" />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            tickFormatter={(value) => `Rs.${(value/1000).toFixed(0)}K`}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 'dataMax + 5']}
                          />
                          <Tooltip formatter={(value, name) => {
                            if (name === "Sales (Rs.)") return `Rs.${value.toLocaleString()}`;
                            return value;
                          }} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="total_sales"
                            name="Sales (Rs.)"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                            yAxisId="left"
                          />
                          <Line
                            type="monotone"
                            dataKey="order_count"
                            name="Orders"
                            stroke="#82ca9d"
                            yAxisId="right"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      <Row className="mt-4">
                        {/* Top Selling Products */}
                        <Col md={6}>
                          <h6 className="mb-3">Top Selling Products</h6>
                          <Table hover responsive size="sm">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Units Sold</th>
                                <th>Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesPerformance.top_products.map((product, index) => (
                                <tr key={index}>
                                  <td>{product.product_name}</td>
                                  <td>{product.total_units}</td>
                                  <td>Rs. {product.total_sales.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Col>

                        {/* Top Shops by Sales */}
                        <Col md={6}>
                          <h6 className="mb-3">Top Shops by Sales</h6>
                          <Table hover responsive size="sm">
                            <thead>
                              <tr>
                                <th>Shop</th>
                                <th>Orders</th>
                                <th>Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {salesPerformance.shop_sales.map((shop, index) => (
                                <tr key={index}>
                                  <td>{shop.shop_name}</td>
                                  <td>{shop.order_count}</td>
                                  <td>Rs. {shop.total_sales.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Col>
                      </Row>

                      {/* Payment Status */}
                      <Row className="mt-4">
                        <Col md={12}>
                          <h6 className="mb-3">Payment Status Overview</h6>
                          <div className="d-flex justify-content-between mb-4 flex-wrap">
                            <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                              <h5 className="mb-1">Payment Rate</h5>
                              <p className="mb-0 fs-4">
                                {salesPerformance.payment_status.payment_rate.toFixed(1)}%
                              </p>
                            </div>
                            <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                              <h5 className="mb-1">Total Paid</h5>
                              <p className="mb-0 fs-4">
                                Rs. {Math.round(salesPerformance.payment_status.total_paid).toLocaleString()}
                              </p>
                            </div>
                            <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                              <h5 className="mb-1">Total Amount</h5>
                              <p className="mb-0 fs-4">
                                Rs. {Math.round(salesPerformance.payment_status.total_amount).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between mb-2">
                            <div>
                              <Badge bg="success" className="p-2 me-2">
                                {salesPerformance.payment_status.paid_count} Paid
                              </Badge>
                              <Badge bg="info" className="p-2 me-2">
                                {salesPerformance.payment_status.partially_paid_count} Partially Paid
                              </Badge>
                              <Badge bg="danger" className="p-2">
                                {salesPerformance.payment_status.payment_due_count} Payment Due
                              </Badge>
                            </div>
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => navigate('/owner-orders')}
                              >
                                View All Orders
                              </Button>
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => navigate('/order-analysis')}
                              >
                                <FaChartLine className="me-1" /> Detailed Analysis
                              </Button>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Product Income Percentage Analysis */}
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <FaPercentage className="text-primary me-2" />
                    Product Income Percentage Analysis
                  </h5>
                </Card.Header>
                <Card.Body>
                  {salesLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <>
                      <Row>
                        {/* Pie Chart */}
                        <Col md={5}>
                          <h6 className="mb-3 text-center">Income Distribution by Product</h6>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={productIncomeData.products.slice(0, 5)}
                                dataKey="income_percentage"
                                nameKey="product_name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {productIncomeData.products.slice(0, 5).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="text-center mt-2">
                            <small className="text-muted">
                              Top 5 products by income percentage
                            </small>
                          </div>
                        </Col>

                        {/* Product Income Table */}
                        <Col md={7}>
                          <h6 className="mb-3">Product Income Breakdown</h6>
                          <Table hover responsive size="sm">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>Income %</th>
                                <th>Revenue</th>
                                <th>Units Sold</th>
                                <th>Profit Margin</th>
                              </tr>
                            </thead>
                            <tbody>
                              {productIncomeData.products.map((product, index) => (
                                <tr key={index}>
                                  <td>{product.product_name}</td>
                                  <td>
                                    <strong>{product.income_percentage}%</strong>
                                  </td>
                                  <td>Rs. {product.total_sales.toLocaleString()}</td>
                                  <td>{product.total_units}</td>
                                  <td>
                                    <Badge bg={product.profit_margin > 40 ? "success" :
                                             product.profit_margin > 25 ? "info" : "warning"}>
                                      {product.profit_margin}%
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>

                          <div className="mt-3">
                            <p className="text-muted mb-0">
                              <small>
                                <strong>Note:</strong> Income percentage represents each product's contribution to total revenue.
                                Products with higher income percentage contribute more to your business revenue.
                              </small>
                            </p>
                          </div>
                        </Col>
                      </Row>

                      {/* Key Insights */}
                      <Row className="mt-4">
                        <Col md={12}>
                          <h6 className="mb-3">Key Insights</h6>
                          <div className="p-3" style={{ backgroundColor: '#D9EDFB', borderRadius: '8px' }}>
                            <ul className="mb-0">
                              {productIncomeData.products.length > 0 && (
                                <li>
                                  <strong>{productIncomeData.products[0].product_name}</strong> generates the highest income percentage
                                  at <strong>{productIncomeData.products[0].income_percentage}%</strong> of total sales.
                                </li>
                              )}
                              {productIncomeData.products.filter(p => p.profit_margin > 40).length > 0 && (
                                <li>
                                  Products with highest profit margins: {' '}
                                  {productIncomeData.products
                                    .filter(p => p.profit_margin > 40)
                                    .map(p => p.product_name)
                                    .join(', ')}
                                </li>
                              )}
                              {productIncomeData.products.length > 0 && (
                                <li>
                                  Total revenue from all products: <strong>Rs. {productIncomeData.total_sales_amount.toLocaleString()}</strong>
                                </li>
                              )}
                            </ul>
                          </div>
                        </Col>
                      </Row>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <FaHistory className="text-primary me-2" />
                    Quick Actions
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-3">
                    <Button
                      variant="outline-primary"
                      className="d-flex align-items-center"
                      onClick={() => navigate('/owner-orders')}
                    >
                      <FaClipboardCheck className="me-2" /> View Orders
                    </Button>
                    <Button
                      variant="outline-success"
                      className="d-flex align-items-center"
                      onClick={() => navigate('/approveproduct-list')}
                    >
                      <FaBoxes className="me-2" /> View Products
                    </Button>
                    <Button
                      variant="outline-info"
                      className="d-flex align-items-center"
                      onClick={() => navigate('/viewsuppliers')}
                    >
                      <FaBuilding className="me-2" /> View Suppliers
                    </Button>
                    <Button
                      variant="outline-warning"
                      className="d-flex align-items-center"
                      onClick={() => navigate('/viewfabric')}
                    >
                      <FaTshirt className="me-2" /> View Fabrics
                    </Button>
                    <Button
                      variant="outline-secondary"
                      className="d-flex align-items-center"
                      onClick={() => navigate('/order-analysis')}
                    >
                      <FaChartLine className="me-2" /> Order Analysis
                    </Button>
                    <Button
                      variant="outline-danger"
                      className="d-flex align-items-center"
                      onClick={() => navigate('/signup')}
                    >
                      <FaExclamationTriangle className="me-2" /> User Management
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
}

export default OwnerDashboard;
