import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from "react-bootstrap";
import {
  FaChartLine, FaChartPie, FaMoneyBillWave, FaClipboardCheck
} from "react-icons/fa";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { authGet } from "../utils/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OrderAnalysisPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("6"); // Default to 6 months
  const [orderData, setOrderData] = useState(null);
  const [statusDistribution, setStatusDistribution] = useState(null);
  const [paymentMethodDistribution, setPaymentMethodDistribution] = useState(null);
  const [monthlySales, setMonthlySales] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Define the data fetching function
  const fetchOrderAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sales performance data
      const salesResponse = await authGet(`reports/sales/performance/?months=${timeRange}`);

      // Process monthly sales data
      if (salesResponse.data && salesResponse.data.monthly_sales) {
        setMonthlySales({
          labels: salesResponse.data.monthly_sales.map(item => item.month),
          datasets: [
            {
              label: 'Total Sales (LKR)',
              data: salesResponse.data.monthly_sales.map(item => item.total_sales),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Order Count',
              data: salesResponse.data.monthly_sales.map(item => item.order_count),
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        });
      }

      // Fetch all orders to analyze status and payment methods
      const ordersResponse = await authGet('orders/orders/create/');

      if (ordersResponse.data) {
        setOrderData(ordersResponse.data);

        // Process status distribution
        const statusCounts = {};
        ordersResponse.data.forEach(order => {
          const status = order.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        setStatusDistribution({
          labels: Object.keys(statusCounts).map(status =>
            status.charAt(0).toUpperCase() + status.slice(1)
          ),
          datasets: [
            {
              data: Object.values(statusCounts),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(199, 199, 199, 0.6)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(199, 199, 199, 1)'
              ],
              borderWidth: 1
            }
          ]
        });

        // Process payment method distribution
        const paymentCounts = {};
        ordersResponse.data.forEach(order => {
          const method = order.payment_method || 'unknown';
          paymentCounts[method] = (paymentCounts[method] || 0) + 1;
        });

        setPaymentMethodDistribution({
          labels: Object.keys(paymentCounts).map(method =>
            method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')
          ),
          datasets: [
            {
              data: Object.values(paymentCounts),
              backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
              ],
              borderWidth: 1
            }
          ]
        });
      }
    } catch (err) {
      console.error("Error fetching order analysis data:", err);

      // Get current year for sample data
      const currentYear = new Date().getFullYear();

      // Create sample order data for interactive functionality
      const sampleOrders = [
        {
          id: 1,
          shop_name: "Fashion Store",
          shop: "Fashion Store",
          status: "paid",
          created_at: `${currentYear}-01-15T10:30:00Z`,
          total_amount: 45000,
          payment_method: "cash"
        },
        {
          id: 2,
          shop_name: "Trendy Boutique",
          shop: "Trendy Boutique",
          status: "paid",
          created_at: `${currentYear}-02-20T14:20:00Z`,
          total_amount: 32000,
          payment_method: "check"
        },
        {
          id: 3,
          shop_name: "Style Hub",
          shop: "Style Hub",
          status: "invoiced",
          created_at: `${currentYear}-03-10T09:15:00Z`,
          total_amount: 28500,
          payment_method: "bank_transfer"
        },
        {
          id: 4,
          shop_name: "Fashion World",
          shop: "Fashion World",
          status: "approved",
          created_at: `${currentYear}-03-25T11:45:00Z`,
          total_amount: 36000,
          payment_method: "cash"
        },
        {
          id: 5,
          shop_name: "Clothing Outlet",
          shop: "Clothing Outlet",
          status: "submitted",
          created_at: `${currentYear}-04-05T13:30:00Z`,
          total_amount: 22000,
          payment_method: "credit"
        },
        {
          id: 6,
          shop_name: "Fashion Store",
          shop: "Fashion Store",
          status: "draft",
          created_at: `${currentYear}-04-15T10:00:00Z`,
          total_amount: 18000,
          payment_method: "advance"
        },
        {
          id: 7,
          shop_name: "Trendy Boutique",
          shop: "Trendy Boutique",
          status: "delivered",
          created_at: `${currentYear}-05-02T15:20:00Z`,
          total_amount: 42000,
          payment_method: "check"
        },
        {
          id: 8,
          shop_name: "Style Hub",
          shop: "Style Hub",
          status: "paid",
          created_at: `${currentYear}-05-18T09:45:00Z`,
          total_amount: 31500,
          payment_method: "cash"
        }
      ];

      setOrderData(sampleOrders);

      // Set fallback sample data with current year
      setMonthlySales({
        labels: [`Jan ${currentYear}`, `Feb ${currentYear}`, `Mar ${currentYear}`, `Apr ${currentYear}`, `May ${currentYear}`, `Jun ${currentYear}`],
        datasets: [
          {
            label: 'Total Sales (LKR)',
            data: [125000, 145000, 165000, 185000, 205000, 225000],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Order Count',
            data: [12, 15, 18, 20, 22, 25],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      });

      // Sample status distribution
      setStatusDistribution({
        labels: ['Draft', 'Submitted', 'Approved', 'Invoiced', 'Delivered', 'Paid'],
        datasets: [
          {
            data: [10, 15, 8, 20, 12, 35],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }
        ]
      });

      // Sample payment method distribution
      setPaymentMethodDistribution({
        labels: ['Cash', 'Check', 'Bank Transfer', 'Credit', 'Advance'],
        datasets: [
          {
            data: [30, 25, 15, 20, 10],
            backgroundColor: [
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)'
            ],
            borderColor: [
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1
          }
        ]
      });

      // Show a warning but don't block the UI
      setError("Could not load real data. Showing sample data instead.");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Fetch data when component mounts or timeRange changes
  useEffect(() => {
    fetchOrderAnalysisData();
  }, [fetchOrderAnalysisData]);

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  // Handle click on status chart segment
  const handleStatusClick = (_, elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedStatus = statusDistribution.labels[clickedIndex].toLowerCase();

      // If clicking the same status, clear the selection
      if (selectedStatus === clickedStatus) {
        setSelectedStatus(null);
        setFilteredOrders([]);
        return;
      }

      setSelectedStatus(clickedStatus);

      // Filter orders by the selected status
      if (orderData) {
        const filtered = orderData.filter(order =>
          order.status.toLowerCase() === clickedStatus
        );
        setFilteredOrders(filtered);
      }
    }
  };

  // Clear selected status
  const clearSelection = () => {
    setSelectedStatus(null);
    setFilteredOrders([]);
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          transition: "margin-left 0.3s ease",
          padding: "1.5rem",
        }}
      >
        <Container fluid>
          {/* Page Header */}
          <Row className="mb-4">
            <Col>
              <h2 className="text-primary">
                <FaChartLine className="me-2" />
                Order Analysis
              </h2>
              <p className="text-muted">
                Analyze order trends, status distribution, and payment methods
              </p>
            </Col>
            <Col xs="auto" className="d-flex align-items-center">
              <Form.Group className="d-flex align-items-center">
                <Form.Label className="me-2 mb-0">Time Range:</Form.Label>
                <Form.Select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  style={{ width: "150px" }}
                >
                  <option value="3">Last 3 Months</option>
                  <option value="6">Last 6 Months</option>
                  <option value="12">Last 12 Months</option>
                  <option value="24">Last 24 Months</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Error Alert */}
          {error && (
            <Alert variant={error.includes("sample data") ? "warning" : "danger"} className="mb-4">
              {error}
            </Alert>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading analysis data...</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Monthly Sales Trend */}
              <Row className="mb-4">
                <Col lg={12}>
                  <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB" }}>
                    <Card.Body>
                      <Card.Title className="d-flex align-items-center mb-4">
                        <FaChartLine className="me-2 text-primary" />
                        Monthly Sales Trend
                      </Card.Title>
                      <div style={{ height: "300px" }}>
                        {monthlySales ? (
                          <Line
                            data={monthlySales}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Sales Amount (LKR)'
                                  }
                                },
                                y1: {
                                  beginAtZero: true,
                                  position: 'right',
                                  grid: {
                                    drawOnChartArea: false
                                  },
                                  title: {
                                    display: true,
                                    text: 'Order Count'
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <p className="text-center">No sales data available</p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Status and Payment Method Distribution */}
              <Row className="mb-4">
                <Col md={selectedStatus ? 6 : 12}>
                  <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                    <Card.Body>
                      <Card.Title className="d-flex align-items-center justify-content-between mb-4">
                        <div className="d-flex align-items-center">
                          <FaChartPie className="me-2 text-primary" />
                          Order Status Distribution
                        </div>
                        {selectedStatus && (
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={clearSelection}
                          >
                            Clear Selection
                          </Button>
                        )}
                      </Card.Title>
                      <div style={{ height: "250px" }}>
                        {statusDistribution ? (
                          <Pie
                            data={statusDistribution}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              onClick: handleStatusClick,
                              plugins: {
                                legend: {
                                  position: 'right',
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percentage = Math.round((value / total) * 100);
                                      return `${label}: ${value} orders (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <p className="text-center">No status data available</p>
                        )}
                      </div>
                      <p className="text-center text-muted mt-3">
                        Click on a segment to view detailed order information
                      </p>
                    </Card.Body>
                  </Card>
                </Col>

                {selectedStatus && (
                  <Col md={6}>
                    <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                      <Card.Body>
                        <Card.Title className="d-flex align-items-center mb-4">
                          <FaClipboardCheck className="me-2 text-primary" />
                          {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Orders
                        </Card.Title>
                        {filteredOrders.length > 0 ? (
                          <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
                            <table className="table table-hover">
                              <thead className="table-light sticky-top">
                                <tr>
                                  <th>Order ID</th>
                                  <th>Shop</th>
                                  <th>Date</th>
                                  <th>Total (LKR)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredOrders.map(order => (
                                  <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{order.shop_name || order.shop}</td>
                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td>{order.total_amount?.toLocaleString() || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-5">
                            <p>No {selectedStatus} orders found</p>
                          </div>
                        )}

                        {filteredOrders.length > 0 && (
                          <div className="mt-3 p-3 bg-light rounded">
                            <h6>Summary</h6>
                            <div className="d-flex justify-content-between">
                              <span>Total Orders:</span>
                              <strong>{filteredOrders.length}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Total Amount:</span>
                              <strong>LKR {filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toLocaleString()}</strong>
                            </div>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                )}
                <Col md={6}>
                  <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                    <Card.Body>
                      <Card.Title className="d-flex align-items-center mb-4">
                        <FaMoneyBillWave className="me-2 text-primary" />
                        Payment Method Distribution
                      </Card.Title>
                      <div style={{ height: "250px" }}>
                        {paymentMethodDistribution ? (
                          <Pie
                            data={paymentMethodDistribution}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right',
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percentage = Math.round((value / total) * 100);
                                      return `${label}: ${value} orders (${percentage}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        ) : (
                          <p className="text-center">No payment method data available</p>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default OrderAnalysisPage;
