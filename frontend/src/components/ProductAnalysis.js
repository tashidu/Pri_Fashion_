// src/components/ProductAnalysis.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';

const ProductAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productData, setProductData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);

  // Colors for the pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Format currency
  const formatCurrency = (value) => {
    return `LKR ${parseFloat(value).toFixed(2)}`;
  };

  // Fetch data for analysis
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch products
        const productsResponse = await axios.get('http://localhost:8000/api/finished_product/report/');
        setProductData(productsResponse.data);

        // Fetch inventory data
        const inventoryResponse = await axios.get('http://localhost:8000/api/packing/inventory/');

        // Fetch sales data (orders)
        const salesResponse = await axios.get('http://localhost:8000/api/orders/summary/');

        // Process data for distribution chart
        processDistributionData(productsResponse.data, inventoryResponse.data, salesResponse.data);

        // Process data for inventory chart
        processInventoryData(inventoryResponse.data);

        // Process data for sales chart
        processSalesData(salesResponse.data);

      } catch (err) {
        console.error('Error fetching analysis data:', err);
        setError('Failed to load analysis data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data for the distribution pie chart
  const processDistributionData = (products, inventory, sales) => {
    // Calculate totals
    let totalSewn = 0;
    let totalPacked = 0;
    let totalSold = 0;
    let totalNotSewn = 0;

    // Calculate total sewn
    products.forEach(product => {
      const sewn = (
        (product.total_sewn_xs || 0) +
        (product.total_sewn_s || 0) +
        (product.total_sewn_m || 0) +
        (product.total_sewn_l || 0) +
        (product.total_sewn_xl || 0)
      );
      totalSewn += sewn;
    });

    // Calculate total packed
    inventory.forEach(item => {
      totalPacked += item.total_quantity || 0;
    });

    // Calculate total sold from the sales data
    if (sales && sales.total_sold) {
      totalSold = sales.total_sold;
    }

    // Calculate sewn but not packed
    const sewnButNotPacked = Math.max(0, totalSewn - totalPacked - totalSold);

    // Calculate not sewn (this is an estimate based on cutting records)
    // For simplicity, we'll assume totalNotSewn is a percentage of totalSewn
    // In a real implementation, you would calculate this from cutting records
    totalNotSewn = Math.round(totalSewn * 0.2); // Assuming 20% of cut items are not yet sewn

    // Create data for the pie chart
    const data = [];

    // Only add categories with values > 0
    if (totalNotSewn > 0) {
      data.push({ name: 'Not Sewn', value: totalNotSewn });
    }

    if (sewnButNotPacked > 0) {
      data.push({ name: 'Sewn (Not Packed)', value: sewnButNotPacked });
    }

    if (totalPacked > 0) {
      data.push({ name: 'In Inventory', value: totalPacked });
    }

    if (totalSold > 0) {
      data.push({ name: 'Sold', value: totalSold });
    }

    // If no data, add a placeholder
    if (data.length === 0) {
      data.push({ name: 'No Data', value: 1 });
    }

    setDistributionData(data);
  };

  // Process data for the inventory pie chart
  const processInventoryData = (inventory) => {
    let sixPacks = 0;
    let twelvePacks = 0;
    let extraItems = 0;

    inventory.forEach(item => {
      sixPacks += (item.number_of_6_packs || 0) * 6;
      twelvePacks += (item.number_of_12_packs || 0) * 12;
      extraItems += item.extra_items || 0;
    });

    const data = [
      { name: '6-Packs', value: sixPacks },
      { name: '12-Packs', value: twelvePacks },
      { name: 'Extra Items', value: extraItems }
    ];

    setInventoryData(data);
  };

  // Process data for the sales pie chart
  const processSalesData = (sales) => {
    // Use real data from the OrderSummaryView
    const data = [
      { name: 'Delivered', value: sales?.delivered || 0 },
      { name: 'Pending', value: sales?.pending || 0 },
      { name: 'Cancelled', value: sales?.cancelled || 0 }
    ];

    // Add more detailed breakdown if available
    if (sales?.order_counts) {
      data.length = 0; // Clear the array

      // Add more detailed breakdown
      if (sales.order_counts.paid > 0) {
        data.push({ name: 'Paid', value: sales.order_counts.paid });
      }

      if (sales.order_counts.partially_paid > 0) {
        data.push({ name: 'Partially Paid', value: sales.order_counts.partially_paid });
      }

      if (sales.order_counts.payment_due > 0) {
        data.push({ name: 'Payment Due', value: sales.order_counts.payment_due });
      }

      if (sales.order_counts.delivered > 0 &&
          sales.order_counts.delivered > (sales.order_counts.paid + sales.order_counts.partially_paid + sales.order_counts.payment_due)) {
        data.push({
          name: 'Delivered (No Payment)',
          value: sales.order_counts.delivered - (sales.order_counts.paid + sales.order_counts.partially_paid + sales.order_counts.payment_due)
        });
      }

      if (sales.order_counts.invoiced > 0) {
        data.push({ name: 'Invoiced', value: sales.order_counts.invoiced });
      }

      if (sales.order_counts.approved > 0) {
        data.push({ name: 'Approved', value: sales.order_counts.approved });
      }
    }

    setSalesData(data);
  };

  // Custom tooltip for pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc' }}>
          <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p>
          <p className="percent">{`${((payload[0].value / payload[0].payload.total) * 100).toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate totals for each dataset
  const calculateTotal = (data) => {
    return data.reduce((sum, item) => sum + item.value, 0);
  };

  // Add total to each data item
  const addTotalToData = (data) => {
    const total = calculateTotal(data);
    return data.map(item => ({ ...item, total }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" className="me-2">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span>Loading analysis data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <FaExclamationTriangle className="me-2" />
        {error}
      </Alert>
    );
  }

  return (
    <div className="product-analysis">
      <h3 className="mb-4">Product Analysis</h3>

      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Production Pipeline</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={addTotalToData(distributionData)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-3">
                <p className="text-muted">
                  <FaInfoCircle className="me-1" />
                  Distribution of products across the production pipeline
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">Inventory Breakdown</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={addTotalToData(inventoryData)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-3">
                <p className="text-muted">
                  <FaInfoCircle className="me-1" />
                  Breakdown of current inventory by packaging type
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">Sales Status</h5>
            </Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={addTotalToData(salesData)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {salesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-3">
                <p className="text-muted">
                  <FaInfoCircle className="me-1" />
                  Distribution of sales by status
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductAnalysis;
