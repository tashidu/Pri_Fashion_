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
  FaSortUp,
  FaSortDown,
  FaInfoCircle
} from 'react-icons/fa';
// No longer using recharts

// Import Chart.js components
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip as ChartJSTooltip, Legend as ChartJSLegend } from 'chart.js';
import { Pie as ChartJSPie, Bar as ChartJSBar, Line as ChartJSLine } from 'react-chartjs-2';
import DashboardCard from "../components/DashboardCard";

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
    deliveredUnpaidCount: 0, // New stat for delivered but not fully paid orders
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

  // Colors are now defined directly in the chart configuration

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
        setSalesLoading(true);

        try {
          // Try to fetch data from API
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

          // Fetch delivered but not fully paid orders count
          let deliveredUnpaidCount = 0;
          try {
            const deliveredUnpaidResponse = await axios.get('http://localhost:8000/api/reports/dashboard/delivered-unpaid-orders/');
            deliveredUnpaidCount = deliveredUnpaidResponse.data.delivered_unpaid_count || 0;
          } catch (error) {
            console.error('Error fetching delivered unpaid orders count:', error);
            // Keep default value of 0
          }

          // Fetch orders data
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
            deliveredUnpaidCount: deliveredUnpaidCount,
            totalSalesValue: totalSales,
            fabricStockValue: fabricStockValue,
            todaySewingCount: todaySewingCount
          });

          // Get recent orders
          setRecentOrders(ordersResponse.data.slice(0, 5));

          // Fetch sales performance data
          const salesResponse = await axios.get(`http://localhost:8000/api/reports/sales/performance/?months=${timeFrame}`);
          setSalesPerformance(salesResponse.data);

          // Fetch product income percentage data
          const incomeResponse = await axios.get(`http://localhost:8000/api/reports/sales/product-income-percentage/?months=${timeFrame}`);
          setProductIncomeData(incomeResponse.data);

          // Check if we have data for charts
          const hasChartData =
            salesResponse.data.monthly_sales.length > 0 &&
            incomeResponse.data.products.length > 0 &&
            packingResponse.data.length > 0;

          // If no chart data, use sample data
          if (!hasChartData) {
            console.log('No chart data available, using sample data');
            const sampleData = generateSampleData();

            if (salesResponse.data.monthly_sales.length === 0) {
              setSalesPerformance(sampleData.salesPerformance);
            }

            if (incomeResponse.data.products.length === 0) {
              setProductIncomeData(sampleData.productIncomeData);
            }

            if (packingResponse.data.length === 0) {
              setPackingData(sampleData.packingData);
            }
          }

        } catch (error) {
          console.error('Error fetching API data, using sample data instead:', error);

          // Use sample data if API fails
          const sampleData = generateSampleData();

          // Set sample data for charts
          setPackingData(sampleData.packingData);
          setSalesPerformance(sampleData.salesPerformance);
          setProductIncomeData(sampleData.productIncomeData);

          // Set sample stats
          setStats({
            pendingApprovalCount: Math.floor(Math.random() * 10) + 2,
            pendingInvoiceCount: Math.floor(Math.random() * 8) + 1,
            paymentsOverdueCount: Math.floor(Math.random() * 5) + 1,
            deliveredUnpaidCount: Math.floor(Math.random() * 7) + 2,
            totalSalesValue: sampleData.salesPerformance.monthly_sales.reduce((sum, month) => sum + month.total_sales, 0),
            fabricStockValue: Math.floor(Math.random() * 500000) + 200000,
            todaySewingCount: Math.floor(Math.random() * 50) + 10
          });

          // Generate sample recent orders
          const sampleOrders = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            shop_name: sampleData.salesPerformance.shop_sales[i % sampleData.salesPerformance.shop_sales.length].shop_name,
            created_at: new Date().toISOString(),
            status: ['submitted', 'approved', 'invoiced', 'delivered', 'paid'][Math.floor(Math.random() * 5)],
            total_amount: Math.floor(Math.random() * 50000) + 10000
          }));

          setRecentOrders(sampleOrders);

          // Generate sample fabric data
          const fabricColors = ['Red', 'Blue', 'Green', 'Black', 'White'];
          const fabricTypes = ['Cotton', 'Silk', 'Linen', 'Polyester', 'Velvet'];
          const sampleFabrics = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            name: `${fabricTypes[i % fabricTypes.length]} - ${fabricColors[i % fabricColors.length]}`,
            colorCode: ['#ff0000', '#0000ff', '#00ff00', '#000000', '#ffffff'][i % 5],
            availableYards: Math.floor(Math.random() * 100) + 20,
            pricePerYard: Math.floor(Math.random() * 500) + 100
          }));

          setRemainingFabrics(sampleFabrics);
        }
      } catch (error) {
        console.error('Error in fetchDashboardData:', error);

        // Set default values in case of error
        setStats({
          pendingApprovalCount: 0,
          pendingInvoiceCount: 0,
          paymentsOverdueCount: 0,
          deliveredUnpaidCount: 0,
          totalSalesValue: 0,
          fabricStockValue: 0,
          todaySewingCount: 0
        });

        setRecentOrders([]);
        setPackingData([]);
        setRemainingFabrics([]);

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

        setProductIncomeData({
          total_sales_amount: 0,
          products: []
        });
      } finally {
        setLoading(false);
        setSalesLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to generate sample data for testing
  const generateSampleData = () => {
    // Use actual product names from your system
    const productNames = ['Velvet Frock', 'Frayed Jeans', 'Roshi Blouse', 'Voile Frock', 'Short'];

    // Use actual shop names from your system
    const shopNames = ['Dilan Fashion', 'Thilakawardhana', 'New Colombo', 'Hemara Rich Look', 'Kotuwa Kade'];

    // Generate sample monthly sales data - use current year
    const currentYear = new Date().getFullYear();
    const months = [
      `Jan ${currentYear}`,
      `Feb ${currentYear}`,
      `Mar ${currentYear}`,
      `Apr ${currentYear}`,
      `May ${currentYear}`,
      `Jun ${currentYear}`
    ];

    const monthlySales = months.map(month => ({
      month,
      total_sales: Math.floor(Math.random() * 500000) + 100000,
      order_count: Math.floor(Math.random() * 20) + 5
    }));

    // Generate sample top products data
    const topProducts = productNames.map(product_name => ({
      product_name,
      total_units: Math.floor(Math.random() * 100) + 20,
      total_sales: Math.floor(Math.random() * 200000) + 50000
    }));

    // Generate sample shop sales data
    const shopSales = shopNames.map(shop_name => ({
      shop_name,
      order_count: Math.floor(Math.random() * 15) + 2,
      total_sales: Math.floor(Math.random() * 300000) + 80000
    }));

    // Generate sample payment status data based on your actual order statuses
    const paid_count = 5; // Based on your orders data
    const partially_paid_count = 3; // Based on your orders data
    const payment_due_count = 2; // Based on your orders data
    const total_amount = 2000000; // Example value
    const total_paid = 1500000; // Example value

    // Generate sample product income data
    const products = productNames.map(product_name => {
      // Set realistic prices based on product name
      let manufacture_price, selling_price, total_units, total_sales;

      if (product_name === 'Velvet Frock') {
        manufacture_price = 2500;
        selling_price = 3500;
        total_units = 114;
        total_sales = 399000;
      } else if (product_name === 'Frayed Jeans') {
        manufacture_price = 1800;
        selling_price = 2500;
        total_units = 170;
        total_sales = 425000;
      } else if (product_name === 'Roshi Blouse') {
        manufacture_price = 1000;
        selling_price = 1500;
        total_units = 66;
        total_sales = 99000;
      } else if (product_name === 'Voile Frock') {
        manufacture_price = 1500;
        selling_price = 2000;
        total_units = 4;
        total_sales = 8000;
      } else {
        manufacture_price = 1500;
        selling_price = 2000;
        total_units = 32;
        total_sales = 64000;
      }

      const profit = selling_price - manufacture_price;
      const profit_margin = Math.round((profit / selling_price) * 100);

      return {
        product_id: Math.floor(Math.random() * 100) + 1,
        product_name,
        total_units,
        total_sales,
        manufacture_price,
        selling_price,
        profit_margin,
        income_percentage: 0 // Will be calculated below
      };
    });

    // Calculate total sales for all products
    const totalSalesAmount = products.reduce((sum, product) => sum + product.total_sales, 0);

    // Calculate income percentage for each product based on its contribution to total sales
    products.forEach(product => {
      product.income_percentage = parseFloat(((product.total_sales / totalSalesAmount) * 100).toFixed(2));
    });

    // Generate sample packing data that matches your product gallery
    const packingItems = productNames.map(product_name => {
      // Set realistic packing numbers based on product name
      let total_sewn, total_packed, available_quantity;

      if (product_name === 'Velvet Frock') {
        total_sewn = 79;
        total_packed = 70;
        available_quantity = 9;
      } else if (product_name === 'Frayed Jeans') {
        total_sewn = 44;
        total_packed = 40;
        available_quantity = 4;
      } else if (product_name === 'Roshi Blouse') {
        total_sewn = 64;
        total_packed = 61;
        available_quantity = 3;
      } else if (product_name === 'Voile Frock') {
        total_sewn = 15;
        total_packed = 13;
        available_quantity = 2;
      } else {
        total_sewn = 6;
        total_packed = 1;
        available_quantity = 5;
      }

      return {
        id: Math.floor(Math.random() * 100) + 1,
        product_name,
        total_sewn,
        total_packed,
        available_quantity
      };
    });

    return {
      salesPerformance: {
        monthly_sales: monthlySales,
        top_products: topProducts,
        shop_sales: shopSales,
        payment_status: {
          paid_count,
          partially_paid_count,
          payment_due_count,
          total_paid,
          total_amount,
          payment_rate: Math.round((total_paid / total_amount) * 100)
        }
      },
      productIncomeData: {
        total_sales_amount: totalSalesAmount,
        products
      },
      packingData: packingItems
    };
  };

  // Fetch sales performance data
  useEffect(() => {
    const fetchSalesPerformance = async () => {
      try {
        setSalesLoading(true);

        try {
          // Fetch sales performance data from the API
          const response = await axios.get(`http://localhost:8000/api/reports/sales/performance/?months=${timeFrame}`);
          setSalesPerformance(response.data);

          // Fetch product income percentage data
          const incomeResponse = await axios.get(`http://localhost:8000/api/reports/sales/product-income-percentage/?months=${timeFrame}`);
          setProductIncomeData(incomeResponse.data);
        } catch (apiError) {
          console.error('Error fetching data from API, using sample data instead:', apiError);

          // Use sample data if API fails
          const sampleData = generateSampleData();
          setSalesPerformance(sampleData.salesPerformance);
          setProductIncomeData(sampleData.productIncomeData);
          setPackingData(sampleData.packingData);
        }
      } catch (error) {
        console.error('Error in fetchSalesPerformance:', error);

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

  // Add debugging logs
  useEffect(() => {
    if (salesPerformance && salesPerformance.monthly_sales) {
      console.log('Monthly Sales Data:', salesPerformance.monthly_sales);
      console.log('Monthly Sales Data Length:', salesPerformance.monthly_sales.length);
    }
    if (packingData) {
      console.log('Packing Data:', packingData);
      console.log('Packing Data Length:', packingData.length);
    }
    if (productIncomeData && productIncomeData.products) {
      console.log('Product Income Data:', productIncomeData.products);
      console.log('Product Income Data Length:', productIncomeData.products.length);
    }

    // Check if data is empty
    const isDataEmpty =
      (!salesPerformance.monthly_sales || salesPerformance.monthly_sales.length === 0) &&
      (!packingData || packingData.length === 0) &&
      (!productIncomeData.products || productIncomeData.products.length === 0);

    console.log('Is Data Empty:', isDataEmpty);

    // Log chart container dimensions
    const chartContainers = document.querySelectorAll('[style*="width: 100%; height:"]');
    console.log('Chart Containers Found:', chartContainers.length);
    chartContainers.forEach((container, index) => {
      console.log(`Chart Container ${index} Dimensions:`, {
        width: container.offsetWidth,
        height: container.offsetHeight,
        style: container.getAttribute('style')
      });
    });
  }, [salesPerformance, packingData, productIncomeData]);

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
            onClick={() => navigate('/view-packing-sessions')}
          >
            Go to Packing History
          </Button>
        </Modal.Footer>
      </Modal>
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

                      try {
                        // Use sample data for testing
                        const sampleData = generateSampleData();
                        setPackingData(sampleData.packingData);
                        setSalesPerformance(sampleData.salesPerformance);
                        setProductIncomeData(sampleData.productIncomeData);

                        // Set sample stats
                        setStats({
                          pendingApprovalCount: Math.floor(Math.random() * 10) + 2,
                          pendingInvoiceCount: Math.floor(Math.random() * 8) + 1,
                          paymentsOverdueCount: Math.floor(Math.random() * 5) + 1,
                          deliveredUnpaidCount: Math.floor(Math.random() * 7) + 2,
                          totalSalesValue: sampleData.salesPerformance.monthly_sales.reduce((sum, month) => sum + month.total_sales, 0),
                          fabricStockValue: Math.floor(Math.random() * 500000) + 200000,
                          todaySewingCount: Math.floor(Math.random() * 50) + 10
                        });

                        // Generate sample recent orders
                        const sampleOrders = Array.from({ length: 5 }, (_, i) => ({
                          id: i + 1,
                          shop_name: sampleData.salesPerformance.shop_sales[i % sampleData.salesPerformance.shop_sales.length].shop_name,
                          created_at: new Date().toISOString(),
                          status: ['submitted', 'approved', 'invoiced', 'delivered', 'paid'][Math.floor(Math.random() * 5)],
                          total_amount: Math.floor(Math.random() * 50000) + 10000
                        }));

                        setRecentOrders(sampleOrders);

                        console.log('Using sample data for charts');
                      } catch (error) {
                        console.error('Error generating sample data:', error);
                      } finally {
                        setLoading(false);
                        setSalesLoading(false);
                      }
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
                title="Delivered Unpaid"
                value={loading ? "..." : (stats.deliveredUnpaidCount || 0).toString()}
                icon={<FaMoneyBillWave />}
                linkTo="/owner-orders"
                color="#FFF0E0"
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
                      {packingData && packingData.length > 0 ? (
                        <div style={{ width: '100%', height: '300px', marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
                          <div style={{ height: '100%', position: 'relative' }}>
                            <ChartJSBar
                              data={{
                                labels: packingData.map(item => item.product_name),
                                datasets: [
                                  {
                                    label: 'Total Sewn',
                                    data: packingData.map(item => item.total_sewn),
                                    backgroundColor: 'rgba(136, 132, 216, 0.7)',
                                    borderColor: 'rgba(136, 132, 216, 1)',
                                    borderWidth: 1
                                  },
                                  {
                                    label: 'Total Packed',
                                    data: packingData.map(item => item.total_packed),
                                    backgroundColor: 'rgba(130, 202, 157, 0.7)',
                                    borderColor: 'rgba(130, 202, 157, 1)',
                                    borderWidth: 1
                                  },
                                  {
                                    label: 'Available Left',
                                    data: packingData.map(item => item.available_quantity),
                                    backgroundColor: 'rgba(255, 198, 88, 0.7)',
                                    borderColor: 'rgba(255, 198, 88, 1)',
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
                        <div className="alert alert-info">
                          No packing data available to display chart. Please add some products to see the chart.
                        </div>
                      )}
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
                      {salesPerformance.monthly_sales && salesPerformance.monthly_sales.length > 0 ? (
                        <div style={{ width: '100%', height: '300px', marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}>
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
                                    yAxisID: 'y',
                                    tension: 0.1,
                                    borderWidth: 2,
                                    pointRadius: 3,
                                    pointHoverRadius: 8
                                  },
                                  {
                                    label: 'Orders',
                                    data: salesPerformance.monthly_sales.map(item => item.order_count),
                                    borderColor: 'rgba(130, 202, 157, 1)',
                                    backgroundColor: 'rgba(130, 202, 157, 0.2)',
                                    yAxisID: 'y1',
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
                                interaction: {
                                  mode: 'index',
                                  intersect: false,
                                },
                                stacked: false,
                                scales: {
                                  y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    title: {
                                      display: true,
                                      text: 'Sales (Rs.)'
                                    },
                                    ticks: {
                                      callback: function(value) {
                                        return 'Rs.' + (value/1000).toFixed(0) + 'K';
                                      }
                                    }
                                  },
                                  y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    title: {
                                      display: true,
                                      text: 'Orders'
                                    },
                                    grid: {
                                      drawOnChartArea: false,
                                    },
                                  },
                                },
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const label = context.dataset.label || '';
                                        const value = context.raw || 0;
                                        if (label === 'Sales (Rs.)') {
                                          return `${label}: Rs.${value.toLocaleString()}`;
                                        }
                                        return `${label}: ${value}`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          No sales data available to display chart. Please add some orders to see the chart.
                        </div>
                      )}

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
                          {productIncomeData.products && productIncomeData.products.length > 0 ? (
                            <div style={{ width: '100%', height: '350px', border: '1px solid #eee', padding: '10px', position: 'relative' }}>
                              {/* Debug info to check data */}
                              {console.log('Product Income Data for Pie Chart:',
                                productIncomeData.products.slice(0, 5).map(product => ({
                                  name: product.product_name,
                                  value: parseFloat(product.income_percentage) || 1
                                }))
                              )}

                              {/* Chart.js Pie Chart */}
                              <div style={{ height: '300px', position: 'relative' }}>
                                <ChartJSPie
                                  data={{
                                    labels: productIncomeData.products.slice(0, 5).map(product => product.product_name),
                                    datasets: [
                                      {
                                        data: productIncomeData.products.slice(0, 5).map(product =>
                                          Math.max(0.1, parseFloat(product.income_percentage) || 1)
                                        ),
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
                                            return `${label}: ${value.toFixed(1)}%`;
                                          }
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="alert alert-info">
                              No product income data available to display chart. Please add some orders to see the chart.
                            </div>
                          )}
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
