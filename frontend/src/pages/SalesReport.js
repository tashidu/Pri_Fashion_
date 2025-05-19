import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import {
  FaChartLine, FaChartBar, FaChartPie, FaStore,
  FaTshirt, FaMoneyBillWave, FaCalendarAlt
} from 'react-icons/fa';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const SalesReport = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState(6); // Default to 6 months
  const [salesPerformance, setSalesPerformance] = useState(null);
  const [productIncomeData, setProductIncomeData] = useState(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch sales data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch sales performance data
        const salesResponse = await axios.get(`http://localhost:8000/api/reports/sales/performance/?months=${timeFrame}`);
        setSalesPerformance(salesResponse.data);

        // Fetch product income percentage data
        const incomeResponse = await axios.get(`http://localhost:8000/api/reports/sales/product-income-percentage/?months=${timeFrame}`);
        setProductIncomeData(incomeResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        setError('Failed to load sales reports. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFrame]);

  // Handle time frame change
  const handleTimeFrameChange = (e) => {
    setTimeFrame(parseInt(e.target.value));
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <FaChartLine className="me-2 text-primary" />
              Sales Reports
            </h2>
            <Form.Group>
              <Form.Select
                value={timeFrame}
                onChange={handleTimeFrameChange}
                style={{ width: '200px' }}
              >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
              </Form.Select>
            </Form.Group>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading sales reports...</p>
            </div>
          ) : (
            <>
              <Row>
                {/* Monthly Sales Trend */}
                <Col lg={8} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h5 className="mb-0">
                        <FaChartLine className="me-2" />
                        Monthly Sales Trend
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {salesPerformance?.monthly_sales?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={salesPerformance.monthly_sales}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="total_sales"
                              name="Sales (Rs.)"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Alert variant="info">No monthly sales data available for the selected period.</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Payment Status */}
                <Col lg={4} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-success text-white">
                      <h5 className="mb-0">
                        <FaMoneyBillWave className="me-2" />
                        Payment Status
                      </h5>
                    </Card.Header>
                    <Card.Body className="d-flex flex-column">
                      {salesPerformance?.payment_status ? (
                        <>
                          <div className="text-center mb-3">
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Paid', value: salesPerformance.payment_status.paid_count },
                                    { name: 'Partially Paid', value: salesPerformance.payment_status.partially_paid_count },
                                    { name: 'Payment Due', value: salesPerformance.payment_status.payment_due_count }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {[0, 1, 2].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => value} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between mb-2">
                              <span>Total Amount:</span>
                              <strong>Rs. {salesPerformance.payment_status.total_amount.toLocaleString()}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span>Total Paid:</span>
                              <strong>Rs. {salesPerformance.payment_status.total_paid.toLocaleString()}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span>Payment Rate:</span>
                              <strong>{salesPerformance.payment_status.payment_rate}%</strong>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Alert variant="info">No payment status data available.</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                {/* Top Selling Products */}
                <Col lg={6} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-warning text-dark">
                      <h5 className="mb-0">
                        <FaTshirt className="me-2" />
                        Top Selling Products
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {salesPerformance?.top_products?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={salesPerformance.top_products}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="product_name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `${value} units`} />
                            <Legend />
                            <Bar dataKey="total_units" name="Units Sold" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Alert variant="info">No product sales data available for the selected period.</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Sales by Shop */}
                <Col lg={6} className="mb-4">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-info text-white">
                      <h5 className="mb-0">
                        <FaStore className="me-2" />
                        Sales by Shop
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      {salesPerformance?.shop_sales?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={salesPerformance.shop_sales}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="shop_name" type="category" width={100} />
                            <Tooltip formatter={(value) => `Rs. ${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="total_sales" name="Sales (Rs.)" fill="#00C49F" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Alert variant="info">No shop sales data available for the selected period.</Alert>
                      )}
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

export default SalesReport;
