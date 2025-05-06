import React, { useState, useEffect, useCallback } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge, Table, Spinner, Form } from 'react-bootstrap';
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
  FaPercentage
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

function OwnerDashboard() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState(6); // Default to 6 months
  const [stats, setStats] = useState({
    pendingApprovalCount: 0,
    pendingInvoiceCount: 0,
    paymentsOverdueCount: 0,
    totalSalesValue: 0,
    fabricStockValue: 0
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

          setStats({
            pendingApprovalCount: pendingApproval,
            pendingInvoiceCount: pendingInvoice,
            paymentsOverdueCount: paymentsOverdue,
            totalSalesValue: totalSales,
            fabricStockValue: remainingFabrics.reduce((sum, fabric) =>
              sum + (fabric.availableYards * fabric.pricePerYard), 0)
          });

          // Get recent orders
          setRecentOrders(ordersResponse.data.slice(0, 5));

        } catch (error) {
          console.error('Error fetching orders:', error);
          // Fallback to sample data
          setStats({
            pendingApprovalCount: 3,
            pendingInvoiceCount: 5,
            paymentsOverdueCount: 2,
            totalSalesValue: 250000,
            fabricStockValue: remainingFabrics.reduce((sum, fabric) =>
              sum + (fabric.availableYards * fabric.pricePerYard), 0)
          });

          // Sample recent orders
          setRecentOrders([
            { id: 1, shop_name: 'Fashion Store', status: 'submitted', created_at: '2023-06-15T10:30:00Z', total_amount: 45000 },
            { id: 2, shop_name: 'Trendy Boutique', status: 'approved', created_at: '2023-06-14T14:20:00Z', total_amount: 32000 },
            { id: 3, shop_name: 'Style Hub', status: 'invoiced', created_at: '2023-06-13T09:15:00Z', total_amount: 28500 }
          ]);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data for fabric stock
        setRemainingFabrics([
          { id: 1, name: 'Cotton - Blue', colorCode: '#0000FF', availableYards: 120, pricePerYard: 450 },
          { id: 2, name: 'Linen - White', colorCode: '#FFFFFF', availableYards: 85, pricePerYard: 650 },
          { id: 3, name: 'Silk - Red', colorCode: '#FF0000', availableYards: 40, pricePerYard: 1200 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch sales performance data
  useEffect(() => {
    const fetchSalesPerformance = async () => {
      try {
        setSalesLoading(true);

        // Fetch sales performance data from the API
        const response = await axios.get(`http://localhost:8000/api/reports/sales/performance/?months=${timeFrame}`);
        setSalesPerformance(response.data);

      } catch (error) {
        console.error('Error fetching sales performance data:', error);

        // Get current year for sample data
        const currentYear = new Date().getFullYear();

        // Set fallback sample data with current year
        setSalesPerformance({
          monthly_sales: [
            { month: `Jan ${currentYear}`, total_sales: 125000, order_count: 12 },
            { month: `Feb ${currentYear}`, total_sales: 145000, order_count: 15 },
            { month: `Mar ${currentYear}`, total_sales: 165000, order_count: 18 },
            { month: `Apr ${currentYear}`, total_sales: 185000, order_count: 20 },
            { month: `May ${currentYear}`, total_sales: 205000, order_count: 22 },
            { month: `Jun ${currentYear}`, total_sales: 225000, order_count: 25 }
          ],
          top_products: [
            { product_name: 'Men\'s T-Shirt', total_units: 450, total_sales: 90000 },
            { product_name: 'Women\'s Blouse', total_units: 320, total_sales: 80000 },
            { product_name: 'Kids Shirt', total_units: 280, total_sales: 56000 },
            { product_name: 'Polo Shirt', total_units: 220, total_sales: 55000 },
            { product_name: 'Formal Shirt', total_units: 180, total_sales: 54000 }
          ],
          shop_sales: [
            { shop_name: 'Fashion Store', total_sales: 250000, order_count: 25 },
            { shop_name: 'Trendy Boutique', total_sales: 180000, order_count: 18 },
            { shop_name: 'Style Hub', total_sales: 150000, order_count: 15 },
            { shop_name: 'Clothing Outlet', total_sales: 120000, order_count: 12 },
            { shop_name: 'Fashion World', total_sales: 100000, order_count: 10 }
          ],
          payment_status: {
            paid_count: 45,
            partially_paid_count: 15,
            payment_due_count: 10,
            total_paid: 850000,
            total_amount: 1000000,
            payment_rate: 85
          }
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

          {/* Stats Cards */}
          <Row>
            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Pending Approval"
                value={loading ? "..." : stats.pendingApprovalCount}
                icon={<FaClipboardCheck />}
                linkTo="/owner-orders"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Pending Invoice"
                value={loading ? "..." : stats.pendingInvoiceCount}
                icon={<FaFileInvoice />}
                linkTo="/owner-orders"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Payments Due"
                value={loading ? "..." : stats.paymentsOverdueCount}
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
                value={loading ? "..." : `Rs. ${remainingFabrics.reduce((sum, fabric) => sum + (fabric.availableYards * fabric.pricePerYard), 0).toLocaleString()}`}
                icon={<FaTshirt />}
                linkTo="/viewfabric"
              />
            </Col>

            <Col md={4} lg={2} sm={6} className="mb-4">
              <DashboardCard
                title="Products"
                value={loading ? "..." : packingData.length}
                icon={<FaBoxes />}
                linkTo="/approveproduct-list"
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
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/packing-report')}
                  >
                    View Full Report
                  </Button>
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
                            {packingData.reduce((acc, item) => acc + item.total_sewn, 0)} units
                          </p>
                        </div>
                        <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                          <h5 className="mb-1">Total Packed</h5>
                          <p className="mb-0 fs-4">
                            {packingData.reduce((acc, item) => acc + item.total_packed, 0)} units
                          </p>
                        </div>
                        <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                          <h5 className="mb-1">Available Left</h5>
                          <p className="mb-0 fs-4">
                            {packingData.reduce((acc, item) => acc + item.available_quantity, 0)} units
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
                                {salesPerformance.payment_status.payment_rate}%
                              </p>
                            </div>
                            <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                              <h5 className="mb-1">Total Paid</h5>
                              <p className="mb-0 fs-4">
                                Rs. {salesPerformance.payment_status.total_paid.toLocaleString()}
                              </p>
                            </div>
                            <div className="stat px-4 py-2 rounded" style={{ backgroundColor: '#D9EDFB' }}>
                              <h5 className="mb-1">Total Amount</h5>
                              <p className="mb-0 fs-4">
                                Rs. {salesPerformance.payment_status.total_amount.toLocaleString()}
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
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate('/owner-orders')}
                            >
                              View All Orders
                            </Button>
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
