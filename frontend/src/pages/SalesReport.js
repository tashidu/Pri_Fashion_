import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Alert, Spinner } from 'react-bootstrap';
import {
  FaChartLine, FaChartPie, FaStore,
  FaTshirt, FaMoneyBillWave
} from 'react-icons/fa';
import RoleBasedNavBar from '../components/RoleBasedNavBar';

// Import Chart.js components
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip as ChartJSTooltip, Legend as ChartJSLegend } from 'chart.js';
import { Pie as ChartJSPie, Bar as ChartJSBar, Line as ChartJSLine } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartJSTooltip,
  ChartJSLegend
);

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

  // Log data for debugging
  useEffect(() => {
    if (salesPerformance) {
      console.log('Sales Performance Data:', salesPerformance);
    }
    if (productIncomeData) {
      console.log('Product Income Data:', productIncomeData);
    }
  }, [salesPerformance, productIncomeData]);

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

  // Colors are now defined directly in the chart configurations

  return (
    <>
      <RoleBasedNavBar />
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px",
          overflow: "auto" // Add overflow auto to ensure content is scrollable
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
                        <div style={{ width: '100%', height: '300px' }}>
                          <div style={{ height: '100%', position: 'relative' }}>
                            <ChartJSLine
                              data={{
                                labels: salesPerformance.monthly_sales.map(item => item.month),
                                datasets: [
                                  {
                                    label: 'Sales (Rs.)',
                                    data: salesPerformance.monthly_sales.map(item => item.total_sales),
                                    borderColor: 'rgba(136, 132, 216, 1)',
                                    backgroundColor: 'rgba(136, 132, 216, 0.2)',
                                    tension: 0.1,
                                    borderWidth: 2,
                                    pointRadius: 3,
                                    pointHoverRadius: 8
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function(value) {
                                        return 'Rs.' + value.toLocaleString();
                                      }
                                    }
                                  }
                                },
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.dataset.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: Rs.${value.toLocaleString()}`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
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
                            <div style={{ width: '100%', height: '200px' }}>
                              <div style={{ height: '100%', position: 'relative' }}>
                                <ChartJSPie
                                  data={{
                                    labels: ['Paid', 'Partially Paid', 'Payment Due'],
                                    datasets: [
                                      {
                                        data: [
                                          salesPerformance.payment_status.paid_count,
                                          salesPerformance.payment_status.partially_paid_count,
                                          salesPerformance.payment_status.payment_due_count
                                        ],
                                        backgroundColor: ['#0088FE', '#00C49F', '#FF8042'],
                                        borderColor: ['rgba(0, 136, 254, 0.8)', 'rgba(0, 196, 159, 0.8)', 'rgba(255, 128, 66, 0.8)'],
                                        borderWidth: 1,
                                      },
                                    ],
                                  }}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'bottom',
                                        labels: {
                                          boxWidth: 15,
                                          padding: 15
                                        }
                                      },
                                      tooltip: {
                                        callbacks: {
                                          label: function(context) {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: ${value} (${percentage}%)`;
                                          }
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
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
                        <div style={{ width: '100%', height: '300px' }}>
                          <div style={{ height: '100%', position: 'relative' }}>
                            <ChartJSBar
                              data={{
                                labels: salesPerformance.top_products.map(item => item.product_name),
                                datasets: [
                                  {
                                    label: 'Units Sold',
                                    data: salesPerformance.top_products.map(item => item.total_units),
                                    backgroundColor: 'rgba(136, 132, 216, 0.7)',
                                    borderColor: 'rgba(136, 132, 216, 1)',
                                    borderWidth: 1
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  x: {
                                    ticks: {
                                      maxRotation: 45,
                                      minRotation: 45
                                    }
                                  },
                                  y: {
                                    beginAtZero: true
                                  }
                                },
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.dataset.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: ${value} units`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
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
                        <div style={{ width: '100%', height: '300px' }}>
                          <div style={{ height: '100%', position: 'relative' }}>
                            <ChartJSBar
                              data={{
                                labels: salesPerformance.shop_sales.map(item => item.shop_name),
                                datasets: [
                                  {
                                    label: 'Sales (Rs.)',
                                    data: salesPerformance.shop_sales.map(item => item.total_sales),
                                    backgroundColor: 'rgba(0, 196, 159, 0.7)',
                                    borderColor: 'rgba(0, 196, 159, 1)',
                                    borderWidth: 1
                                  }
                                ]
                              }}
                              options={{
                                indexAxis: 'y', // This makes the chart horizontal
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  x: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: function(value) {
                                        return 'Rs.' + value.toLocaleString();
                                      }
                                    }
                                  }
                                },
                                plugins: {
                                  legend: {
                                    position: 'top',
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.dataset.label || '';
                                        const value = context.raw || 0;
                                        return `${label}: Rs.${value.toLocaleString()}`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <Alert variant="info">No shop sales data available for the selected period.</Alert>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Product Income Percentage Analysis */}
              {productIncomeData && productIncomeData.products && productIncomeData.products.length > 0 && (
                <Row>
                  <Col lg={12} className="mb-4">
                    <Card className="shadow-sm">
                      <Card.Header className="bg-success text-white">
                        <h5 className="mb-0">
                          <FaChartPie className="me-2" />
                          Product Income Percentage Analysis
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <div style={{ width: '100%', height: '400px' }}>
                          <div style={{ height: '100%', position: 'relative' }}>
                            <ChartJSBar
                              data={{
                                labels: productIncomeData.products.slice(0, 10).map(item => item.product_name),
                                datasets: [
                                  {
                                    label: 'Sales Amount (Rs.)',
                                    data: productIncomeData.products.slice(0, 10).map(item => item.total_sales),
                                    backgroundColor: 'rgba(136, 132, 216, 0.7)',
                                    borderColor: 'rgba(136, 132, 216, 1)',
                                    borderWidth: 1,
                                    yAxisID: 'y'
                                  },
                                  {
                                    label: 'Income Percentage',
                                    data: productIncomeData.products.slice(0, 10).map(item => item.income_percentage),
                                    backgroundColor: 'rgba(130, 202, 157, 0.7)',
                                    borderColor: 'rgba(130, 202, 157, 1)',
                                    borderWidth: 1,
                                    yAxisID: 'y1'
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  x: {
                                    ticks: {
                                      maxRotation: 45,
                                      minRotation: 45
                                    }
                                  },
                                  y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: {
                                      display: true,
                                      text: 'Sales Amount (Rs.)'
                                    },
                                    ticks: {
                                      callback: function(value) {
                                        return 'Rs.' + value.toLocaleString();
                                      }
                                    }
                                  },
                                  y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    title: {
                                      display: true,
                                      text: 'Income Percentage (%)'
                                    },
                                    ticks: {
                                      callback: function(value) {
                                        return value + '%';
                                      }
                                    },
                                    grid: {
                                      drawOnChartArea: false,
                                    },
                                  }
                                },
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.dataset.label || '';
                                        const value = context.raw || 0;
                                        if (label === 'Sales Amount (Rs.)') {
                                          return `${label}: Rs.${value.toLocaleString()}`;
                                        }
                                        return `${label}: ${value}%`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <h6>Profit Margin Analysis</h6>
                          <div style={{ width: '100%', height: '300px' }}>
                            <div style={{ height: '100%', position: 'relative' }}>
                              <ChartJSPie
                                data={{
                                  labels: productIncomeData.products.slice(0, 5).map(product => product.product_name),
                                  datasets: [
                                    {
                                      data: productIncomeData.products.slice(0, 5).map(product => product.profit_margin),
                                      backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'],
                                      borderColor: ['rgba(0, 136, 254, 0.8)', 'rgba(0, 196, 159, 0.8)', 'rgba(255, 187, 40, 0.8)', 'rgba(255, 128, 66, 0.8)', 'rgba(136, 132, 216, 0.8)'],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  plugins: {
                                    legend: {
                                      position: 'right',
                                      labels: {
                                        boxWidth: 15,
                                        padding: 15
                                      }
                                    },
                                    tooltip: {
                                      callbacks: {
                                        label: function(context) {
                                          const label = context.label || '';
                                          const value = context.raw || 0;
                                          return `${label}: ${value}%`;
                                        }
                                      }
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default SalesReport;
