import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  InputGroup,
  Tabs,
  Tab,
  Modal
} from "react-bootstrap";
import {
  FaStore,
  FaBoxOpen,
  FaPlus,
  FaTrash,
  FaShoppingCart,
  FaBoxes,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaSearch,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaStickyNote,
  FaSync
} from "react-icons/fa";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import "./CreateOrder.css"; // We'll create this CSS file later
import { useNavigate } from "react-router-dom";
import { getUserRole, getUserId } from "../utils/auth";

const AddOrderForm = () => {
  const navigate = useNavigate();
  const [userRole] = useState(getUserRole());

  // Initialize orderData based on user role
  const [orderData, setOrderData] = useState(() => {
    // Full form for Order Coordinator
    if (userRole === 'Order Coordinator') {
      return {
        shop: "",
        placed_by: "", // will be filled with current user ID
        items: [],
        notes: "",
        requested_delivery_date: "",
        payment_method: "cash" // Default payment method
      };
    }
    // Simplified form for Sales Team
    else {
      return {
        shop: "",
        placed_by: "", // will be filled with current user ID
        items: [],
        notes: ""
      };
    }
  });

  const [shops, setShops] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [isInfoModal, setIsInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState("order-details");

  // Get the current user ID from the JWT token
  const currentUserId = getUserId();

  // Filter products based on search term
  useEffect(() => {
    if (finishedProducts.length > 0) {
      if (!productSearch.trim()) {
        setFilteredProducts(finishedProducts);
      } else {
        const searchTerm = productSearch.toLowerCase();
        const filtered = finishedProducts.filter(product =>
          product.product_name.toLowerCase().includes(searchTerm) ||
          (product.color && product.color.toLowerCase().includes(searchTerm)) ||
          (product.size && product.size.toLowerCase().includes(searchTerm))
        );
        setFilteredProducts(filtered);
      }
    }
  }, [productSearch, finishedProducts]);

  // Function to fetch data
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      console.log('Fetch Data - Token exists:', !!token);

      // Prepare headers with authentication token
      const headers = {
        'Authorization': `JWT ${token}`
      };

      console.log('Fetch Data - Headers:', headers);

      // Define API endpoints based on user role
      const apiEndpoints = [
        axios.get("http://localhost:8000/api/orders/shops/", { headers }),
        axios.get("http://localhost:8000/api/finished_product/report", { headers }),
      ];

      // Order Coordinators need detailed packing inventory
      // Sales Team needs approved products and production information
      if (userRole === 'Order Coordinator') {
        apiEndpoints.push(axios.get("http://localhost:8000/api/packing/inventory/", { headers }));
      } else {
        // For Sales Team, get approved products and production information
        apiEndpoints.push(axios.get("http://localhost:8000/api/packing/inventory/", { headers }));
        // We'll use the finished_product/report endpoint which already includes available_quantity
      }

      const responses = await Promise.all(apiEndpoints);
      const shopsRes = responses[0];
      const productsRes = responses[1];
      const inventoryRes = responses[2];

      setShops(shopsRes.data);

      // Log the data to debug
      console.log("Products API response:", productsRes.data);
      console.log("Inventory API response:", inventoryRes.data);

      // Combine product data with inventory data
      const products = productsRes.data;
      const inventory = inventoryRes.data;

      // Add inventory information to each product
      const productsWithInventory = products.map(product => {
        // The inventory API returns product_id, not finished_product
        const inventoryItem = inventory.find(item => item.product_id === product.id);

        console.log(`Product ID: ${product.id}, Found inventory:`, inventoryItem);

        // Calculate production status for Sales Team
        const totalSewn = (
          (product.total_sewn_xs || 0) +
          (product.total_sewn_s || 0) +
          (product.total_sewn_m || 0) +
          (product.total_sewn_l || 0) +
          (product.total_sewn_xl || 0)
        );

        // Items in production = total sewn - items in inventory
        const totalInventory = inventoryItem ?
          (inventoryItem.number_of_6_packs * 6 +
           inventoryItem.number_of_12_packs * 12 +
           inventoryItem.extra_items) : 0;

        const inProduction = Math.max(0, totalSewn - totalInventory);

        return {
          ...product,
          inventory: inventoryItem || {
            number_of_6_packs: 0,
            number_of_12_packs: 0,
            extra_items: 0
          },
          totalSewn: totalSewn,
          inProduction: inProduction,
          stockStatus: getStockStatus(inventoryItem)
        };
      });

      // Filter out products without selling price for Sales Team
      const filteredProducts = userRole === 'Sales Team'
        ? productsWithInventory.filter(product => product.selling_price !== null)
        : productsWithInventory;

      setFinishedProducts(filteredProducts);
      setFilteredProducts(filteredProducts);

      if (isRefresh) {
        setSuccess("Inventory data refreshed successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error fetching data:", err);

      // Provide more detailed error message
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);

        if (err.response.data && err.response.data.detail) {
          setError(`Error: ${err.response.data.detail}`);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        console.error("No response received:", err.request);
        setError("No response received from server. Please check your connection.");
      } else {
        console.error("Error setting up request:", err.message);
        setError(isRefresh
          ? "Failed to refresh inventory data. Please try again."
          : "Failed to load necessary data. Please refresh the page."
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper function to determine stock status for Sales Team view
  const getStockStatus = (inventoryItem) => {
    if (!inventoryItem) return "out-of-stock";

    const totalItems =
      inventoryItem.number_of_6_packs * 6 +
      inventoryItem.number_of_12_packs * 12 +
      inventoryItem.extra_items;

    if (totalItems === 0) return "out-of-stock";
    if (totalItems < 10) return "low-stock"; // Arbitrary threshold for low stock
    return "in-stock";
  };

  // Handle refresh button click
  const handleRefreshInventory = () => {
    fetchData(true);
  };

  // Fetch initial data
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...orderData.items];
    updatedItems[index][name] = value;
    setOrderData({ ...orderData, items: updatedItems });
  };

  const addItem = () => {
    setOrderData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          finished_product: "",
          quantity_6_packs: 0,
          quantity_12_packs: 0,
          quantity_extra_items: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const updated = [...orderData.items];
    updated.splice(index, 1);
    setOrderData({ ...orderData, items: updated });
  };

  // Calculate total units for an item
  const calculateTotalUnits = (item) => {
    const sixPacks = parseInt(item.quantity_6_packs) || 0;
    const twelvePacks = parseInt(item.quantity_12_packs) || 0;
    const extraItems = parseInt(item.quantity_extra_items) || 0;

    return (sixPacks * 6) + (twelvePacks * 12) + extraItems;
  };

  // Calculate total items in the order
  const calculateOrderTotals = () => {
    let totalSixPacks = 0;
    let totalTwelvePacks = 0;
    let totalExtraItems = 0;
    let totalUnits = 0;

    orderData.items.forEach(item => {
      totalSixPacks += parseInt(item.quantity_6_packs) || 0;
      totalTwelvePacks += parseInt(item.quantity_12_packs) || 0;
      totalExtraItems += parseInt(item.quantity_extra_items) || 0;
      totalUnits += calculateTotalUnits(item);
    });

    return {
      totalSixPacks,
      totalTwelvePacks,
      totalExtraItems,
      totalUnits
    };
  };

  // Check stock availability for an item
  const checkStockAvailability = (item) => {
    const product = finishedProducts.find(p => p.id === parseInt(item.finished_product));
    if (!product) {
      return {
        hasWarning: true,
        message: "Product not found",
        productName: `Product ID ${item.finished_product}`
      };
    }

    // Debug log to see what inventory data we have
    console.log(`Checking stock for product ${product.product_name} (ID: ${product.id})`, product.inventory);

    if (!product.inventory) {
      return {
        hasWarning: true,
        message: "Inventory data not available",
        productName: product.product_name
      };
    }

    // Different validation logic based on user role
    if (userRole === 'Order Coordinator') {
      // Order Coordinators need to check actual inventory
      const inventory = product.inventory;
      const warnings = [];

      // Make sure we're comparing numbers, not strings
      const requestedSixPacks = parseInt(item.quantity_6_packs) || 0;
      const requestedTwelvePacks = parseInt(item.quantity_12_packs) || 0;
      const requestedExtraItems = parseInt(item.quantity_extra_items) || 0;

      const availableSixPacks = parseInt(inventory.number_of_6_packs) || 0;
      const availableTwelvePacks = parseInt(inventory.number_of_12_packs) || 0;
      const availableExtraItems = parseInt(inventory.extra_items) || 0;

      if (requestedSixPacks > availableSixPacks) {
        warnings.push(`Not enough 6-packs in stock (requested: ${requestedSixPacks}, available: ${availableSixPacks})`);
      }

      if (requestedTwelvePacks > availableTwelvePacks) {
        warnings.push(`Not enough 12-packs in stock (requested: ${requestedTwelvePacks}, available: ${availableTwelvePacks})`);
      }

      if (requestedExtraItems > availableExtraItems) {
        warnings.push(`Not enough extra items in stock (requested: ${requestedExtraItems}, available: ${availableExtraItems})`);
      }

      return {
        hasWarning: warnings.length > 0,
        message: warnings.join(", "),
        productName: product.product_name
      };
    } else {
      // Sales Team can create orders for items in production
      // They only need a warning if there's no stock AND no items in production
      const inventory = product.inventory;
      const totalRequested =
        (parseInt(item.quantity_6_packs) || 0) * 6 +
        (parseInt(item.quantity_12_packs) || 0) * 12 +
        (parseInt(item.quantity_extra_items) || 0);

      const totalAvailable =
        (parseInt(inventory.number_of_6_packs) || 0) * 6 +
        (parseInt(inventory.number_of_12_packs) || 0) * 12 +
        (parseInt(inventory.extra_items) || 0);

      // If there's not enough in stock but there are items in production, just inform
      if (totalRequested > totalAvailable) {
        if (product.inProduction > 0) {
          return {
            hasWarning: false, // Not a blocking warning for Sales Team
            message: `This order will require ${totalRequested - totalAvailable} items from production (${product.inProduction} in production)`,
            productName: product.product_name,
            isInfo: true // Flag to show as info, not warning
          };
        } else {
          return {
            hasWarning: true,
            message: `Not enough items in stock (requested: ${totalRequested}, available: ${totalAvailable}) and no items in production`,
            productName: product.product_name
          };
        }
      }

      return {
        hasWarning: false,
        message: "",
        productName: product.product_name
      };
    }
  };

  // Validate the entire order
  const validateOrder = () => {
    // Basic validation
    if (!orderData.shop || orderData.items.length === 0) {
      setError("Please select a shop and add at least one item.");
      return false;
    }

    // Validate that each item has a product and at least one quantity
    const invalidItems = orderData.items.filter(
      item => !item.finished_product || calculateTotalUnits(item) === 0
    );

    if (invalidItems.length > 0) {
      setError("Please select a product and add at least one quantity for each item.");
      return false;
    }

    // Check stock availability
    const warnings = [];
    const infoMessages = [];

    orderData.items.forEach(item => {
      const stockCheck = checkStockAvailability(item);

      if (stockCheck.hasWarning) {
        warnings.push({
          productId: item.finished_product,
          productName: stockCheck.productName,
          message: stockCheck.message
        });
      } else if (stockCheck.isInfo) {
        // For Sales Team - items that will use production stock
        infoMessages.push({
          productId: item.finished_product,
          productName: stockCheck.productName,
          message: stockCheck.message
        });
      }
    });

    // If there are warnings, show the confirmation modal
    if (warnings.length > 0) {
      setStockWarnings(warnings);
      setShowConfirmModal(true);
      return false;
    }

    // If there are info messages but no warnings, show them but don't block submission
    if (infoMessages.length > 0 && warnings.length === 0) {
      // For Sales Team, we'll show info about production items but allow the order
      setStockWarnings(infoMessages);
      // Set a flag to indicate these are info messages, not warnings
      setIsInfoModal(true);
      setShowConfirmModal(true);
      // We return true because we want to proceed with the order
      return true;
    } else {
      // Make sure isInfoModal is false for warnings
      setIsInfoModal(false);
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // Validate the order
    if (!validateOrder()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      console.log('Submit Order - Token exists:', !!token);

      // Prepare headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`
      };

      console.log('Submit Order - Headers:', headers);

      // Step 1: Create the order with role-specific fields
      const orderPayload = {
        shop: orderData.shop,
        placed_by: currentUserId,
        notes: orderData.notes
      };

      // Add additional fields only for Order Coordinator
      if (userRole === 'Order Coordinator') {
        orderPayload.requested_delivery_date = orderData.requested_delivery_date;
        orderPayload.payment_method = orderData.payment_method;
      } else {
        // Default values for Sales Team
        orderPayload.payment_method = 'cash'; // Default payment method
      }

      console.log('Submit Order - Payload:', orderPayload);

      const orderRes = await axios.post(
        "http://localhost:8000/api/orders/orders/create/",
        orderPayload,
        { headers }
      );

      const orderId = orderRes.data.id;
      console.log('Order created with ID:', orderId);

      // Step 2: Create each order item
      const itemRequests = orderData.items.map((item) =>
        axios.post("http://localhost:8000/api/orders/orders/items/",
          {
            order: orderId,
            finished_product: item.finished_product,
            quantity_6_packs: item.quantity_6_packs,
            quantity_12_packs: item.quantity_12_packs,
            quantity_extra_items: item.quantity_extra_items,
          },
          { headers } // Use the same headers with the token
        )
      );

      await Promise.all(itemRequests);

      setSuccess(`Order #${orderId} created successfully!`);
      // Reset form with role-specific fields
      if (userRole === 'Order Coordinator') {
        setOrderData({
          shop: "",
          placed_by: "",
          items: [],
          notes: "",
          requested_delivery_date: "",
          payment_method: "cash"
        });
      } else {
        // Simpler reset for Sales Team
        setOrderData({
          shop: "",
          placed_by: "",
          items: [],
          notes: ""
        });
      }

      // Redirect to appropriate order list page based on user role
      setTimeout(() => {
        // Redirect Sales Team users to the Sales Team orders page
        if (userRole === 'Sales Team') {
          navigate("/sales-team-orders");
        } else {
          // Redirect Order Coordinators to the standard order list page
          navigate("/order-list");
        }
      }, 2000);
    } catch (err) {
      console.error("Error submitting order", err);

      // Provide more detailed error message
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);

        if (err.response.data && err.response.data.error) {
          // Handle the specific error from our backend
          const errorMsg = err.response.data.error;

          // If it's the "not enough inventory" error and user is Sales Team
          if (errorMsg.includes("Not enough inventory") && userRole === 'Sales Team') {
            setError("Not enough items in stock and no items in production. Please select products that are in stock or in production.");
          } else {
            setError(`Error: ${errorMsg}`);
          }
        } else if (err.response.data && err.response.data.detail) {
          setError(`Error: ${err.response.data.detail}`);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError("No response received from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", err.message);
        setError("An error occurred while submitting the order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle confirmation when there are stock warnings
  const handleConfirmDespiteWarnings = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      console.log('Confirm Despite Warnings - Token exists:', !!token);

      // Prepare headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`
      };

      console.log('Confirm Despite Warnings - Headers:', headers);

      // Create order despite warnings with role-specific fields
      const orderPayload = {
        shop: orderData.shop,
        placed_by: currentUserId,
        notes: orderData.notes + "\n[WARNING: Order created with insufficient stock]"
      };

      // Add additional fields only for Order Coordinator
      if (userRole === 'Order Coordinator') {
        orderPayload.requested_delivery_date = orderData.requested_delivery_date;
        orderPayload.payment_method = orderData.payment_method;
      } else {
        // Default values for Sales Team
        orderPayload.payment_method = 'cash'; // Default payment method
      }

      console.log('Confirm Despite Warnings - Payload:', orderPayload);

      const orderRes = await axios.post(
        "http://localhost:8000/api/orders/orders/create/",
        orderPayload,
        { headers }
      );

      const orderId = orderRes.data.id;
      console.log('Order created with ID (despite warnings):', orderId);

      // Create each order item
      const itemRequests = orderData.items.map((item) =>
        axios.post("http://localhost:8000/api/orders/orders/items/",
          {
            order: orderId,
            finished_product: item.finished_product,
            quantity_6_packs: item.quantity_6_packs,
            quantity_12_packs: item.quantity_12_packs,
            quantity_extra_items: item.quantity_extra_items,
          },
          { headers } // Use the same headers with the token
        )
      );

      await Promise.all(itemRequests);

      setSuccess(`Order #${orderId} created successfully with stock warnings!`);
      // Reset form with role-specific fields
      if (userRole === 'Order Coordinator') {
        setOrderData({
          shop: "",
          placed_by: "",
          items: [],
          notes: "",
          requested_delivery_date: "",
          payment_method: "cash"
        });
      } else {
        // Simpler reset for Sales Team
        setOrderData({
          shop: "",
          placed_by: "",
          items: [],
          notes: ""
        });
      }

      // Redirect to appropriate order list page based on user role
      setTimeout(() => {
        // Redirect Sales Team users to the Sales Team orders page
        if (userRole === 'Sales Team') {
          navigate("/sales-team-orders");
        } else {
          // Redirect Order Coordinators to the standard order list page
          navigate("/order-list");
        }
      }, 2000);
    } catch (err) {
      console.error("Error submitting order (despite warnings)", err);

      // Provide more detailed error message
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);

        if (err.response.data && err.response.data.error) {
          // Handle the specific error from our backend
          const errorMsg = err.response.data.error;

          // If it's the "not enough inventory" error and user is Sales Team
          if (errorMsg.includes("Not enough inventory") && userRole === 'Sales Team') {
            setError("Not enough items in stock and no items in production. Please select products that are in stock or in production.");
          } else {
            setError(`Error: ${errorMsg}`);
          }
        } else if (err.response.data && err.response.data.detail) {
          setError(`Error: ${err.response.data.detail}`);
        } else {
          setError(`Error ${err.response.status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError("No response received from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", err.message);
        setError("An error occurred while submitting the order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // This function can be used if we need to display product names elsewhere
  // Currently only using getShopName

  // Get shop name by ID
  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === parseInt(shopId));
    return shop ? shop.name : "Unknown Shop";
  };

  const orderTotals = calculateOrderTotals();

  // Track sidebar state for dynamic margin adjustment
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Check if user has permission to access this page
  useEffect(() => {
    // Only Sales Team and Order Coordinator roles should have access
    if (userRole !== 'Sales Team' && userRole !== 'Order Coordinator') {
      // Redirect unauthorized users to their dashboard
      if (userRole === 'Owner') {
        navigate('/owner-dashboard');
      } else if (userRole === 'Inventory Manager') {
        navigate('/inventory-dashboard');
      } else {
        // Default fallback
        navigate('/');
      }
    }
  }, [userRole, navigate]);

  // Listen for sidebar toggle events from the navbar
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      if (e.detail) {
        setIsSidebarOpen(e.detail.isOpen);
      }
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle);

    // Check initial sidebar state based on screen size
    setIsSidebarOpen(window.innerWidth >= 768);

    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);

  return (
    <>
      <RoleBasedNavBar />
      <Container
        fluid
        className="main-content py-4"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          transition: "margin-left 0.3s ease",
          width: "auto"
        }}
      >
        <Row className="justify-content-center">
          <Col lg={10} xl={9}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <FaShoppingCart className="me-2" />
                  <h5 className="mb-0">Create New Order</h5>
                </div>
                <Badge bg="light" text="dark" className="px-3 py-2">
                  {userRole === 'Sales Team' ? 'Sales Team' : 'Order Coordinator'}
                </Badge>
              </Card.Header>

              <Card.Body>
                {isLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading order form...</p>
                  </div>
                ) : (
                  <>
                    {error && (
                      <Alert variant="danger" className="d-flex align-items-center">
                        <FaTimes className="me-2" />
                        {error}
                      </Alert>
                    )}

                    {success && (
                      <Alert variant="success" className="d-flex align-items-center">
                        <FaCheck className="me-2" />
                        {success}
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                      <Tabs
                        id="order-tabs"
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className="mb-4"
                      >
                        <Tab eventKey="order-details" title="Order Details">
                          <Row className="mb-4">
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">
                                  <FaStore className="me-2" />
                                  Select Shop
                                </Form.Label>
                                <InputGroup>
                                  <Form.Select
                                    name="shop"
                                    value={orderData.shop}
                                    onChange={handleChange}
                                    required
                                    disabled={isSubmitting}
                                  >
                                    <option value="">-- Select Shop --</option>
                                    {shops.map((shop) => (
                                      <option key={shop.id} value={shop.id}>
                                        {shop.name}
                                      </option>
                                    ))}
                                  </Form.Select>
                                </InputGroup>
                              </Form.Group>
                            </Col>

                            {orderData.shop && (
                              <Col md={6}>
                                <div className="h-100 d-flex align-items-center">
                                  <Card className="w-100 custom-card">
                                    <Card.Body className="py-2">
                                      <div className="d-flex align-items-center">
                                        <FaInfoCircle className="me-2 text-primary" />
                                        <div>
                                          <small className="text-muted">Selected Shop</small>
                                          <p className="mb-0 fw-bold">{getShopName(orderData.shop)}</p>
                                        </div>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </div>
                              </Col>
                            )}
                          </Row>

                          {/* Show delivery date and payment method only for Order Coordinators */}
                          {userRole === 'Order Coordinator' && (
                            <Row className="mb-4">
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-bold">
                                    <FaCalendarAlt className="me-2" />
                                    Requested Delivery Date
                                  </Form.Label>
                                  <Form.Control
                                    type="date"
                                    name="requested_delivery_date"
                                    value={orderData.requested_delivery_date}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={isSubmitting}
                                  />
                                </Form.Group>
                              </Col>

                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-bold">
                                    <FaMoneyBillWave className="me-2" />
                                    Payment Method
                                  </Form.Label>
                                  <Form.Select
                                    name="payment_method"
                                    value={orderData.payment_method}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                  >
                                    <option value="cash">Cash</option>
                                    <option value="check">Check</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="credit">Credit (Pay Later)</option>
                                    <option value="advance">Advance Payment</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            </Row>
                          )}

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">
                              <FaStickyNote className="me-2" />
                              {userRole === 'Sales Team' ? 'Customer Notes' : 'Order Notes'}
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="notes"
                              value={orderData.notes}
                              onChange={handleChange}
                              placeholder={userRole === 'Sales Team'
                                ? "Add any customer requests or special instructions"
                                : "Add any special instructions or notes for this order"
                              }
                              disabled={isSubmitting}
                            />
                          </Form.Group>
                        </Tab>

                        <Tab eventKey="order-items" title="Order Items">
                          <div className="mb-3 d-flex justify-content-between align-items-center">
                            <InputGroup className="w-50">
                              <InputGroup.Text>
                                <FaSearch />
                              </InputGroup.Text>
                              <Form.Control
                                type="text"
                                placeholder="Search products..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                disabled={isSubmitting}
                              />
                            </InputGroup>

                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleRefreshInventory}
                                disabled={isSubmitting || isRefreshing}
                                className="me-2 d-inline-flex align-items-center"
                              >
                                {isRefreshing ? (
                                  <Spinner animation="border" size="sm" className="me-1" />
                                ) : (
                                  <FaSync className="me-1" />
                                )}
                                Refresh Inventory
                              </Button>

                              <Button
                                variant="success"
                                size="sm"
                                onClick={addItem}
                                disabled={isSubmitting}
                                className="d-inline-flex align-items-center"
                              >
                                <FaPlus className="me-1" /> Add Item
                              </Button>
                            </div>
                          </div>

                          <Card className="mb-4 border-0 shadow-sm">
                            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 d-flex align-items-center">
                                <FaBoxOpen className="me-2" />
                                Order Items
                              </h6>
                              <Badge bg="primary" pill>
                                {orderData.items.length} {orderData.items.length === 1 ? 'item' : 'items'}
                              </Badge>
                            </Card.Header>

                            <Card.Body className="p-0">
                              {orderData.items.length === 0 ? (
                                <div className="text-center py-4">
                                  <FaBoxes className="text-muted mb-2" style={{ fontSize: '2rem' }} />
                                  <p className="text-muted">No items added yet. Click "Add Item" to start.</p>
                                </div>
                              ) : (
                                <div className="p-3">
                                  {orderData.items.map((item, index) => {
                                    // Get product details for stock information
                                    const product = finishedProducts.find(p => p.id === parseInt(item.finished_product));
                                    const inventory = product?.inventory || { number_of_6_packs: 0, number_of_12_packs: 0, extra_items: 0 };

                                    return (
                                      <Card
                                        key={index}
                                        className="mb-3 order-item-card"
                                        style={{ backgroundColor: '#f8f9fa' }}
                                      >
                                        <Card.Body>
                                          <Row>
                                            <Col md={12} className="mb-3">
                                              <Form.Group>
                                                <Form.Label className="fw-bold">Product</Form.Label>
                                                <Form.Select
                                                  name="finished_product"
                                                  value={item.finished_product}
                                                  onChange={(e) => handleItemChange(index, e)}
                                                  required
                                                  disabled={isSubmitting}
                                                >
                                                  <option value="">-- Select Product --</option>
                                                  {filteredProducts.map((fp) => (
                                                    <option key={fp.id} value={fp.id}>
                                                      {fp.product_name}
                                                    </option>
                                                  ))}
                                                </Form.Select>
                                              </Form.Group>
                                            </Col>

                                            {item.finished_product && (
                                              <Col md={12} className="mb-3">
                                                {userRole === 'Order Coordinator' ? (
                                                  // Detailed inventory view for Order Coordinators
                                                  <div className="stock-info p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                    <small className="d-flex justify-content-between">
                                                      <span>Available 6-Packs: <strong>{inventory.number_of_6_packs || 0}</strong></span>
                                                      <span>Available 12-Packs: <strong>{inventory.number_of_12_packs || 0}</strong></span>
                                                      <span>Available Extra Items: <strong>{inventory.extra_items || 0}</strong></span>
                                                    </small>
                                                    {(!inventory.number_of_6_packs && !inventory.number_of_12_packs && !inventory.extra_items) && (
                                                      <div className="mt-1 text-danger">
                                                        <small>No inventory data available for this product</small>
                                                      </div>
                                                    )}
                                                  </div>
                                                ) : (
                                                  // Simplified view for Sales Team
                                                  <div className="stock-info p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                      <div>
                                                        {product && (
                                                          <div className="d-flex align-items-center">
                                                            <span className="me-2">Stock Status:</span>
                                                            {product.stockStatus === 'in-stock' && (
                                                              <Badge bg="success">In Stock</Badge>
                                                            )}
                                                            {product.stockStatus === 'low-stock' && (
                                                              <Badge bg="warning">Low Stock</Badge>
                                                            )}
                                                            {product.stockStatus === 'out-of-stock' && (
                                                              <Badge bg="danger">Out of Stock</Badge>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                      <div>
                                                        {product && product.inProduction > 0 && (
                                                          <Badge bg="info" className="ms-2">
                                                            {product.inProduction} items in production
                                                          </Badge>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {product && product.selling_price && (
                                                      <div className="mt-2">
                                                        <small>Selling Price: <strong>Rs. {product.selling_price.toFixed(2)}</strong></small>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </Col>
                                            )}

                                            <Col md={4}>
                                              <Form.Group>
                                                <Form.Label>6-Packs</Form.Label>
                                                <InputGroup>
                                                  <Form.Control
                                                    type="number"
                                                    name="quantity_6_packs"
                                                    min="0"
                                                    value={item.quantity_6_packs}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    disabled={isSubmitting}
                                                    className={parseInt(item.quantity_6_packs) > inventory.number_of_6_packs ? "border-danger" : ""}
                                                  />
                                                  <InputGroup.Text>packs</InputGroup.Text>
                                                </InputGroup>
                                                {parseInt(item.quantity_6_packs) > inventory.number_of_6_packs && (
                                                  <Form.Text className="text-danger">
                                                    Exceeds available stock
                                                  </Form.Text>
                                                )}
                                              </Form.Group>
                                            </Col>

                                            <Col md={4}>
                                              <Form.Group>
                                                <Form.Label>12-Packs</Form.Label>
                                                <InputGroup>
                                                  <Form.Control
                                                    type="number"
                                                    name="quantity_12_packs"
                                                    min="0"
                                                    value={item.quantity_12_packs}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    disabled={isSubmitting}
                                                    className={parseInt(item.quantity_12_packs) > inventory.number_of_12_packs ? "border-danger" : ""}
                                                  />
                                                  <InputGroup.Text>packs</InputGroup.Text>
                                                </InputGroup>
                                                {parseInt(item.quantity_12_packs) > inventory.number_of_12_packs && (
                                                  <Form.Text className="text-danger">
                                                    Exceeds available stock
                                                  </Form.Text>
                                                )}
                                              </Form.Group>
                                            </Col>

                                            <Col md={4}>
                                              <Form.Group>
                                                <Form.Label>Extra Items</Form.Label>
                                                <InputGroup>
                                                  <Form.Control
                                                    type="number"
                                                    name="quantity_extra_items"
                                                    min="0"
                                                    value={item.quantity_extra_items}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    disabled={isSubmitting}
                                                    className={parseInt(item.quantity_extra_items) > inventory.extra_items ? "border-danger" : ""}
                                                  />
                                                  <InputGroup.Text>units</InputGroup.Text>
                                                </InputGroup>
                                                {parseInt(item.quantity_extra_items) > inventory.extra_items && (
                                                  <Form.Text className="text-danger">
                                                    Exceeds available stock
                                                  </Form.Text>
                                                )}
                                              </Form.Group>
                                            </Col>
                                          </Row>

                                          <div className="d-flex justify-content-between align-items-center mt-3">
                                            <div>
                                              <Badge bg="info" className="me-2">
                                                Total Units: {calculateTotalUnits(item)}
                                              </Badge>
                                            </div>
                                            <Button
                                              variant="outline-danger"
                                              size="sm"
                                              onClick={() => removeItem(index)}
                                              disabled={isSubmitting}
                                              className="d-flex align-items-center"
                                            >
                                              <FaTrash className="me-1" /> Remove
                                            </Button>
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    );
                                  })}
                                </div>
                              )}
                            </Card.Body>

                            {orderData.items.length > 0 && (
                              <Card.Footer className="bg-light">
                                <Row>
                                  <Col>
                                    <small className="text-muted">Total 6-Packs</small>
                                    <p className="mb-0 fw-bold">{orderTotals.totalSixPacks}</p>
                                  </Col>
                                  <Col>
                                    <small className="text-muted">Total 12-Packs</small>
                                    <p className="mb-0 fw-bold">{orderTotals.totalTwelvePacks}</p>
                                  </Col>
                                  <Col>
                                    <small className="text-muted">Total Extra Items</small>
                                    <p className="mb-0 fw-bold">{orderTotals.totalExtraItems}</p>
                                  </Col>
                                  <Col>
                                    <small className="text-muted">Total Units</small>
                                    <p className="mb-0 fw-bold">{orderTotals.totalUnits}</p>
                                  </Col>
                                </Row>
                              </Card.Footer>
                            )}
                          </Card>
                        </Tab>

                        <Tab eventKey="order-summary" title="Order Summary">
                          {orderData.shop && orderData.items.length > 0 ? (
                            <Card className="mb-4 border-0 shadow-sm">
                              <Card.Header className="bg-primary text-white">
                                <h6 className="mb-0">Order Summary</h6>
                              </Card.Header>
                              <Card.Body>
                                <Row className="mb-3">
                                  <Col md={6}>
                                    <h6>Shop Information</h6>
                                    <p className="mb-1"><strong>Shop:</strong> {getShopName(orderData.shop)}</p>
                                    {userRole === 'Order Coordinator' && (
                                      <>
                                        {orderData.requested_delivery_date && (
                                          <p className="mb-1"><strong>Requested Delivery:</strong> {new Date(orderData.requested_delivery_date).toLocaleDateString()}</p>
                                        )}
                                        <p className="mb-1"><strong>Payment Method:</strong> {orderData.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                      </>
                                    )}
                                  </Col>
                                  <Col md={6}>
                                    <h6>Order Totals</h6>
                                    <p className="mb-1"><strong>Total Items:</strong> {orderData.items.length}</p>
                                    <p className="mb-1"><strong>Total Units:</strong> {orderTotals.totalUnits}</p>
                                  </Col>
                                </Row>

                                <h6>Order Items</h6>
                                <div className="table-responsive">
                                  <table className="table table-striped">
                                    <thead>
                                      <tr>
                                        <th>Product</th>
                                        <th>6-Packs</th>
                                        <th>12-Packs</th>
                                        <th>Extra Items</th>
                                        <th>Total Units</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {orderData.items.map((item, index) => {
                                        const product = finishedProducts.find(p => p.id === parseInt(item.finished_product));
                                        return (
                                          <tr key={index}>
                                            <td>{product ? product.product_name : 'Unknown Product'}</td>
                                            <td>{item.quantity_6_packs}</td>
                                            <td>{item.quantity_12_packs}</td>
                                            <td>{item.quantity_extra_items}</td>
                                            <td>{calculateTotalUnits(item)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>

                                {orderData.notes && (
                                  <div className="mt-3">
                                    <h6>Order Notes</h6>
                                    <p className="mb-0">{orderData.notes}</p>
                                  </div>
                                )}
                              </Card.Body>
                            </Card>
                          ) : (
                            <Alert variant="info">
                              <FaInfoCircle className="me-2" />
                              Please select a shop and add items to view the order summary.
                            </Alert>
                          )}
                        </Tab>
                      </Tabs>

                      <div className="d-grid mt-4">
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          disabled={isSubmitting || orderData.items.length === 0}
                          className="d-flex align-items-center justify-content-center"
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FaShoppingCart className="me-2" /> Submit Order
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>

                    {/* Stock Warning/Info Confirmation Modal */}
                    <Modal
                      show={showConfirmModal}
                      onHide={() => setShowConfirmModal(false)}
                      backdrop="static"
                      keyboard={false}
                      centered
                    >
                      <Modal.Header className={isInfoModal ? "bg-info" : "bg-warning"}>
                        <Modal.Title>
                          {isInfoModal ? (
                            <>
                              <FaInfoCircle className="me-2" />
                              Production Information
                            </>
                          ) : (
                            <>
                              <FaExclamationTriangle className="me-2" />
                              Stock Warning
                            </>
                          )}
                        </Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        {isInfoModal ? (
                          <p>The following items will use products from production:</p>
                        ) : (
                          <p>The following items have insufficient stock:</p>
                        )}
                        <ul className="list-group mb-3">
                          {stockWarnings.map((warning, index) => (
                            <li
                              key={index}
                              className={`list-group-item ${isInfoModal ?
                                "list-group-item-info" :
                                "list-group-item-warning"}`}
                            >
                              <strong>{warning.productName}</strong>: {warning.message}
                            </li>
                          ))}
                        </ul>
                        {isInfoModal ? (
                          <p>This order will be fulfilled when production is complete. Do you want to proceed?</p>
                        ) : (
                          <p>Do you want to proceed with creating this order anyway?</p>
                        )}
                      </Modal.Body>
                      <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                          Cancel
                        </Button>
                        {isInfoModal ? (
                          <Button variant="primary" onClick={handleConfirmDespiteWarnings}>
                            Create Order
                          </Button>
                        ) : (
                          <Button variant="warning" onClick={handleConfirmDespiteWarnings}>
                            Create Order Anyway
                          </Button>
                        )}
                      </Modal.Footer>
                    </Modal>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AddOrderForm;
