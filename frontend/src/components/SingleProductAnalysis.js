// src/components/SingleProductAnalysis.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner, Alert, Card } from 'react-bootstrap';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';

const SingleProductAnalysis = ({ productId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [distributionData, setDistributionData] = useState([]);
  const [productData, setProductData] = useState(null);
  const [packingData, setPackingData] = useState(null);
  const [salesData, setSalesData] = useState([]);

  // Colors for the pie charts
  const COLORS = {
    'Not Sewn': '#0088FE',                // Blue
    'Sewn (Not Packed)': '#00C49F',       // Green
    'In Inventory (Packed)': '#FFBB28',   // Yellow/Orange
    'Sold Out': '#FF8042',                // Orange/Red
    'In Inventory': '#FFBB28',            // For backward compatibility
    'Sold': '#FF8042',                    // For backward compatibility
    'No Data': '#8884d8'                  // Purple
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;

      setLoading(true);
      setError('');

      try {
        // Fetch product details
        let productData = null;
        let packingData = null;
        let salesData = [];

        try {
          const productResponse = await axios.get(`http://localhost:8000/api/finished_product/${productId}/`);
          productData = productResponse.data;
          setProductData(productData);
          console.log("Product data:", productData);
        } catch (err) {
          console.error('Error fetching product details:', err);
          setError(`Failed to load product details: ${err.response?.status === 404 ? 'Product not found' : err.message}`);
          setLoading(false);
          return;
        }

        // Fetch packing inventory for this product
        try {
          const packingResponse = await axios.get(`http://localhost:8000/api/packing/product/${productId}/inventory/`);
          packingData = packingResponse.data;
          setPackingData(packingData);
        } catch (err) {
          console.error('Error fetching packing inventory:', err);
          // Continue even if packing inventory fails
        }

        // Fetch sales data for this product
        try {
          const salesResponse = await axios.get(`http://localhost:8000/api/product/${productId}/sales/`);
          salesData = Array.isArray(salesResponse.data) ? salesResponse.data : [];
          setSalesData(salesData);
        } catch (err) {
          console.error('Error fetching sales data:', err);
          // Continue even if sales data fails
        }

        // Process data for distribution chart
        if (productData) {
          processDistributionData(productData, packingData, salesData);
        }
      } catch (err) {
        console.error('Error in product analysis:', err);
        setError('Failed to load product analysis data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Process data for the distribution pie chart
  const processDistributionData = (product, packing, sales) => {
    if (!product) return;

    // Calculate totals
    let totalSewn = 0;
    let totalPacked = 0;
    let totalSold = 0;
    let totalNotSewn = 0;

    // Calculate total sewn
    totalSewn = (
      (product.total_sewn_xs || 0) +
      (product.total_sewn_s || 0) +
      (product.total_sewn_m || 0) +
      (product.total_sewn_l || 0) +
      (product.total_sewn_xl || 0)
    );

    // Calculate total packed
    if (packing && packing.total_quantity) {
      totalPacked = packing.total_quantity;
    }

    // Calculate total sold
    if (Array.isArray(sales)) {
      totalSold = sales.reduce((sum, sale) => sum + (sale.total_units || 0), 0);
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

    // Split inventory into "In Inventory (Packed)" and "Sold Out"
    if (totalPacked > 0) {
      data.push({ name: 'In Inventory (Packed)', value: totalPacked });
    }

    if (totalSold > 0) {
      data.push({ name: 'Sold Out', value: totalSold });
    }

    // If no data, add a placeholder
    if (data.length === 0) {
      data.push({ name: 'No Data', value: 1 });
    }

    setDistributionData(data);
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
      <div className="text-center py-4">
        <Spinner animation="border" role="status" className="me-2">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span>Loading product analysis...</span>
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
      <h5 className="mb-3">Product Distribution Analysis</h5>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <ResponsiveContainer width="100%" height={250}>
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
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Col>
            <Col md={6}>
              <h6 className="mb-3">Distribution Summary</h6>
              <div className="mb-2">
                <strong>Total Sewn:</strong> {
                  productData ? (
                    (productData.total_sewn_xs || 0) +
                    (productData.total_sewn_s || 0) +
                    (productData.total_sewn_m || 0) +
                    (productData.total_sewn_l || 0) +
                    (productData.total_sewn_xl || 0)
                  ) : 0
                } units
              </div>
              <div className="mb-2">
                <strong>Not Sewn (Estimated):</strong> {
                  productData ? Math.round((
                    (productData.total_sewn_xs || 0) +
                    (productData.total_sewn_s || 0) +
                    (productData.total_sewn_m || 0) +
                    (productData.total_sewn_l || 0) +
                    (productData.total_sewn_xl || 0)
                  ) * 0.2) : 0
                } units
              </div>
              <div className="mb-2">
                <strong>Sewn (Not Packed):</strong> {
                  Math.max(0,
                    (productData ? (
                      (productData.total_sewn_xs || 0) +
                      (productData.total_sewn_s || 0) +
                      (productData.total_sewn_m || 0) +
                      (productData.total_sewn_l || 0) +
                      (productData.total_sewn_xl || 0)
                    ) : 0) -
                    (packingData?.total_quantity || 0) -
                    (Array.isArray(salesData) ? salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) : 0)
                  )
                } units
              </div>
              <div className="mb-2">
                <strong>In Inventory (Packed):</strong> {packingData?.total_quantity || 0} units
              </div>
              <div className="mb-2">
                <strong>Sold Out:</strong> {Array.isArray(salesData) ? salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) : 0} units
              </div>
              <div className="mt-3 text-muted">
                <FaInfoCircle className="me-1" />
                This chart shows the distribution of this product across different stages of the production pipeline.
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default SingleProductAnalysis;
