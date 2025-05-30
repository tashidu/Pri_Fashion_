import React, { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  InputGroup,
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
import "./CreateOrder.css";
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

      // Prepare headers with authentication token
      const headers = {
        'Authorization': `JWT ${token}`
      };

      // Define API endpoints based on user role
      const apiEndpoints = [
        axios.get("http://localhost:8000/api/orders/shops/", { headers }),
        axios.get("http://localhost:8000/api/finished_product/report", { headers }),
      ];

      // Both roles need packing inventory
      apiEndpoints.push(axios.get("http://localhost:8000/api/packing/inventory/", { headers }));

      const responses = await Promise.all(apiEndpoints);
      const shopsRes = responses[0];
      const productsRes = responses[1];
      const inventoryRes = responses[2];

      setShops(shopsRes.data);

      // Combine product data with inventory data
      const products = productsRes.data;
      const inventory = inventoryRes.data;

      // Add inventory information to each product
      const productsWithInventory = products.map(product => {
        // The inventory API returns product_id, not finished_product
        const inventoryItem = inventory.find(item => item.product_id === product.id);

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

      // Filter out products without selling price for Sales Team and products without packing stock
      let filteredProducts = productsWithInventory;

      // First filter by selling price for Sales Team
      if (userRole === 'Sales Team') {
        filteredProducts = filteredProducts.filter(product => product.selling_price !== null);
      }

      // Then filter to only include products with packing stock
      filteredProducts = filteredProducts.filter(product => {
        // Check if the product has any packing inventory
        const inventory = product.inventory;
        const totalPackingStock =
          (inventory.number_of_6_packs * 6) +
          (inventory.number_of_12_packs * 12) +
          (inventory.extra_items);

        // Only include products with packing stock > 0
        return totalPackingStock > 0;
      });

      setFinishedProducts(filteredProducts);
      setFilteredProducts(filteredProducts);

      if (isRefresh) {
        setSuccess("Inventory data refreshed successfully!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load necessary data. Please refresh the page.");
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

    // If changing the product, reset quantities
    if (name === "finished_product") {
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
        quantity_6_packs: 0,
        quantity_12_packs: 0,
        quantity_extra_items: 0
      };
    } else if (name.includes("quantity_")) {
      // For quantity fields, validate against available stock
      const product = finishedProducts.find(p => p.id === parseInt(updatedItems[index].finished_product));

      if (product && product.inventory) {
        const inventory = product.inventory;
        let newValue = parseInt(value) || 0;

        // Prevent negative values
        if (newValue < 0) newValue = 0;

        // Check against available stock for each pack type
        if (name === "quantity_6_packs" && newValue > inventory.number_of_6_packs) {
          newValue = inventory.number_of_6_packs;
        } else if (name === "quantity_12_packs" && newValue > inventory.number_of_12_packs) {
          newValue = inventory.number_of_12_packs;
        } else if (name === "quantity_extra_items" && newValue > inventory.extra_items) {
          newValue = inventory.extra_items;
        }

        updatedItems[index][name] = newValue;
      } else {
        updatedItems[index][name] = value;
      }
    } else {
      updatedItems[index][name] = value;
    }

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

    if (!product.inventory) {
      return {
        hasWarning: true,
        message: "Inventory data not available",
        productName: product.product_name
      };
    }

    // Check if there's any packing stock at all
    const inventory = product.inventory;
    const totalAvailable =
      (parseInt(inventory.number_of_6_packs) || 0) * 6 +
      (parseInt(inventory.number_of_12_packs) || 0) * 12 +
      (parseInt(inventory.extra_items) || 0);

    if (totalAvailable === 0) {
      return {
        hasWarning: true,
        message: "This product has no packing stock available",
        productName: product.product_name
      };
    }

    // Make sure we're comparing numbers, not strings
    const requestedSixPacks = parseInt(item.quantity_6_packs) || 0;
    const requestedTwelvePacks = parseInt(item.quantity_12_packs) || 0;
    const requestedExtraItems = parseInt(item.quantity_extra_items) || 0;

    const availableSixPacks = parseInt(inventory.number_of_6_packs) || 0;
    const availableTwelvePacks = parseInt(inventory.number_of_12_packs) || 0;
    const availableExtraItems = parseInt(inventory.extra_items) || 0;

    const warnings = [];

    // Check specific pack types
    if (requestedSixPacks > availableSixPacks) {
      warnings.push(`Not enough 6-packs in stock (requested: ${requestedSixPacks}, available: ${availableSixPacks})`);
    }

    if (requestedTwelvePacks > availableTwelvePacks) {
      warnings.push(`Not enough 12-packs in stock (requested: ${requestedTwelvePacks}, available: ${availableTwelvePacks})`);
    }

    if (requestedExtraItems > availableExtraItems) {
      warnings.push(`Not enough extra items in stock (requested: ${requestedExtraItems}, available: ${availableExtraItems})`);
    }

    // Calculate total requested items
    const totalRequested =
      (requestedSixPacks * 6) +
      (requestedTwelvePacks * 12) +
      requestedExtraItems;

    // If no specific warnings but total requested exceeds total available
    if (warnings.length === 0 && totalRequested > totalAvailable) {
      warnings.push(`Total requested items (${totalRequested}) exceeds available stock (${totalAvailable})`);
    }

    return {
      hasWarning: warnings.length > 0,
      message: warnings.join(", "),
      productName: product.product_name
    };
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

    // Validate that all selected products have packing stock
    const noPackingStockItems = orderData.items.filter(item => {
      const product = finishedProducts.find(p => p.id === parseInt(item.finished_product));
      if (!product || !product.inventory) return true;

      const totalPackingStock =
        (product.inventory.number_of_6_packs * 6) +
        (product.inventory.number_of_12_packs * 12) +
        (product.inventory.extra_items);

      return totalPackingStock === 0;
    });

    if (noPackingStockItems.length > 0) {
      setError("Some selected products have no packing stock. Only products with packing stock can be ordered.");
      return false;
    }

    // Check stock availability
    const warnings = [];

    orderData.items.forEach(item => {
      const stockCheck = checkStockAvailability(item);

      if (stockCheck.hasWarning) {
        warnings.push({
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

      // Prepare headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`
      };

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

      const orderRes = await axios.post(
        "http://localhost:8000/api/orders/orders/create/",
        orderPayload,
        { headers }
      );

      const orderId = orderRes.data.id;

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
          { headers }
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
      setError("An error occurred while submitting the order. Please try again.");
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

      // Prepare headers with authentication token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `JWT ${token}`
      };

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

      const orderRes = await axios.post(
        "http://localhost:8000/api/orders/orders/create/",
        orderPayload,
        { headers }
      );

      const orderId = orderRes.data.id;

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
          { headers }
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
      setError("An error occurred while submitting the order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <h2 className="mb-4">
          <FaShoppingCart className="me-2" />
          Create New Order
          <Badge bg="primary" className="ms-3 px-3 py-2">
            {userRole === 'Sales Team' ? 'Sales Team' : 'Order Coordinator'}
          </Badge>
        </h2>

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

            <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row className="mb-4">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                          <FaStore className="me-2" />
                          Select Shop
                        </Form.Label>
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
                      </Form.Group>
                    </Col>

                    {userRole === 'Order Coordinator' && (
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
                    )}
                  </Row>

                  {userRole === 'Order Coordinator' && (
                    <Row className="mb-4">
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
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">
                            <FaStickyNote className="me-2" />
                            Order Notes
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={orderData.notes}
                            onChange={handleChange}
                            placeholder="Add any special instructions or notes for this order"
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {userRole === 'Sales Team' && (
                    <Row className="mb-4">
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">
                            <FaStickyNote className="me-2" />
                            Customer Notes
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="notes"
                            value={orderData.notes}
                            onChange={handleChange}
                            placeholder="Add any customer requests or special instructions"
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <h4 className="mt-4 mb-3 border-bottom pb-2">
                    <FaBoxOpen className="me-2" />
                    Order Items
                  </h4>

                  <Alert variant="info" className="mb-3">
                    <FaInfoCircle className="me-2" />
                    Only products with available packing stock are displayed. Orders can only include items that are already packed.
                  </Alert>

                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <InputGroup className="w-50">
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search packed products..."
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

                  {orderData.items.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded mb-4">
                      <FaBoxes className="text-muted mb-2" style={{ fontSize: '2rem' }} />
                      <p className="text-muted">No items added yet. Click "Add Item" to start.</p>
                    </div>
                  ) : (
                    orderData.items.map((item, index) => {
                      // Get product details for stock information
                      const product = finishedProducts.find(p => p.id === parseInt(item.finished_product));
                      const inventory = product?.inventory || { number_of_6_packs: 0, number_of_12_packs: 0, extra_items: 0 };

                      return (
                        <Card key={index} className="mb-4 shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
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
                                <Col md={6}>
                                  <div className="stock-info p-2 rounded h-100 d-flex flex-column justify-content-center" style={{ backgroundColor: '#e9ecef' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <strong>Available Stock:</strong>
                                      {product && (
                                        <Badge bg={
                                          product.stockStatus === 'in-stock' ? 'success' :
                                          product.stockStatus === 'low-stock' ? 'warning' : 'danger'
                                        } pill>
                                          {product.stockStatus === 'in-stock' ? 'In Stock' :
                                           product.stockStatus === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="d-flex justify-content-between">
                                      <span>6-Packs: <strong>{inventory.number_of_6_packs || 0}</strong></span>
                                      <span>12-Packs: <strong>{inventory.number_of_12_packs || 0}</strong></span>
                                      <span>Extra Items: <strong>{inventory.extra_items || 0}</strong></span>
                                    </div>
                                  </div>
                                </Col>
                              )}
                            </Row>

                            {item.finished_product && (
                              <Row className="mt-3">
                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="d-flex justify-content-between">
                                      <span>6-Packs</span>
                                      <small className="text-muted">Available: {inventory.number_of_6_packs || 0}</small>
                                    </Form.Label>
                                    <InputGroup>
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          const updatedItems = [...orderData.items];
                                          const currentValue = parseInt(updatedItems[index].quantity_6_packs) || 0;
                                          if (currentValue > 0) {
                                            updatedItems[index].quantity_6_packs = currentValue - 1;
                                            setOrderData({ ...orderData, items: updatedItems });
                                          }
                                        }}
                                        disabled={isSubmitting || parseInt(item.quantity_6_packs) <= 0}
                                      >
                                        -
                                      </Button>
                                      <Form.Control
                                        type="number"
                                        name="quantity_6_packs"
                                        min="0"
                                        max={inventory.number_of_6_packs}
                                        value={item.quantity_6_packs}
                                        onChange={(e) => handleItemChange(index, e)}
                                        disabled={isSubmitting}
                                        className="text-center"
                                      />
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          const updatedItems = [...orderData.items];
                                          const currentValue = parseInt(updatedItems[index].quantity_6_packs) || 0;
                                          const maxValue = inventory.number_of_6_packs || 0;
                                          if (currentValue < maxValue) {
                                            updatedItems[index].quantity_6_packs = currentValue + 1;
                                            setOrderData({ ...orderData, items: updatedItems });
                                          }
                                        }}
                                        disabled={isSubmitting || parseInt(item.quantity_6_packs) >= inventory.number_of_6_packs}
                                      >
                                        +
                                      </Button>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>

                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="d-flex justify-content-between">
                                      <span>12-Packs</span>
                                      <small className="text-muted">Available: {inventory.number_of_12_packs || 0}</small>
                                    </Form.Label>
                                    <InputGroup>
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          const updatedItems = [...orderData.items];
                                          const currentValue = parseInt(updatedItems[index].quantity_12_packs) || 0;
                                          if (currentValue > 0) {
                                            updatedItems[index].quantity_12_packs = currentValue - 1;
                                            setOrderData({ ...orderData, items: updatedItems });
                                          }
                                        }}
                                        disabled={isSubmitting || parseInt(item.quantity_12_packs) <= 0}
                                      >
                                        -
                                      </Button>
                                      <Form.Control
                                        type="number"
                                        name="quantity_12_packs"
                                        min="0"
                                        max={inventory.number_of_12_packs}
                                        value={item.quantity_12_packs}
                                        onChange={(e) => handleItemChange(index, e)}
                                        disabled={isSubmitting}
                                        className="text-center"
                                      />
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          const updatedItems = [...orderData.items];
                                          const currentValue = parseInt(updatedItems[index].quantity_12_packs) || 0;
                                          const maxValue = inventory.number_of_12_packs || 0;
                                          if (currentValue < maxValue) {
                                            updatedItems[index].quantity_12_packs = currentValue + 1;
                                            setOrderData({ ...orderData, items: updatedItems });
                                          }
                                        }}
                                        disabled={isSubmitting || parseInt(item.quantity_12_packs) >= inventory.number_of_12_packs}
                                      >
                                        +
                                      </Button>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>

                                <Col md={4}>
                                  <Form.Group>
                                    <Form.Label className="d-flex justify-content-between">
                                      <span>Extra Items</span>
                                      <small className="text-muted">Available: {inventory.extra_items || 0}</small>
                                    </Form.Label>
                                    <InputGroup>
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          const updatedItems = [...orderData.items];
                                          const currentValue = parseInt(updatedItems[index].quantity_extra_items) || 0;
                                          if (currentValue > 0) {
                                            updatedItems[index].quantity_extra_items = currentValue - 1;
                                            setOrderData({ ...orderData, items: updatedItems });
                                          }
                                        }}
                                        disabled={isSubmitting || parseInt(item.quantity_extra_items) <= 0}
                                      >
                                        -
                                      </Button>
                                      <Form.Control
                                        type="number"
                                        name="quantity_extra_items"
                                        min="0"
                                        max={inventory.extra_items}
                                        value={item.quantity_extra_items}
                                        onChange={(e) => handleItemChange(index, e)}
                                        disabled={isSubmitting}
                                        className="text-center"
                                      />
                                      <Button
                                        variant="outline-secondary"
                                        onClick={() => {
                                          const updatedItems = [...orderData.items];
                                          const currentValue = parseInt(updatedItems[index].quantity_extra_items) || 0;
                                          const maxValue = inventory.extra_items || 0;
                                          if (currentValue < maxValue) {
                                            updatedItems[index].quantity_extra_items = currentValue + 1;
                                            setOrderData({ ...orderData, items: updatedItems });
                                          }
                                        }}
                                        disabled={isSubmitting || parseInt(item.quantity_extra_items) >= inventory.extra_items}
                                      >
                                        +
                                      </Button>
                                    </InputGroup>
                                  </Form.Group>
                                </Col>
                              </Row>
                            )}

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
                    })
                  )}

                  {orderData.items.length > 0 && (
                    <Card className="mb-4 border-0" style={{ backgroundColor: "#e8f4fe" }}>
                      <Card.Body className="py-3">
                        <h5 className="mb-3">Order Summary</h5>
                        <Row>
                          <Col md={3}>
                            <small className="text-muted">Total 6-Packs</small>
                            <p className="mb-0 fw-bold">{orderTotals.totalSixPacks}</p>
                          </Col>
                          <Col md={3}>
                            <small className="text-muted">Total 12-Packs</small>
                            <p className="mb-0 fw-bold">{orderTotals.totalTwelvePacks}</p>
                          </Col>
                          <Col md={3}>
                            <small className="text-muted">Total Extra Items</small>
                            <p className="mb-0 fw-bold">{orderTotals.totalExtraItems}</p>
                          </Col>
                          <Col md={3}>
                            <small className="text-muted">Total Units</small>
                            <p className="mb-0 fw-bold">{orderTotals.totalUnits}</p>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )}

                  <div className="d-flex justify-content-center mt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting || orderData.items.length === 0}
                      className="px-5"
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
              </Card.Body>
            </Card>

            {/* Stock Warning Confirmation Modal */}
            <Modal
              show={showConfirmModal}
              onHide={() => setShowConfirmModal(false)}
              backdrop="static"
              keyboard={false}
              centered
            >
              <Modal.Header className="bg-warning">
                <Modal.Title>
                  <FaExclamationTriangle className="me-2" />
                  Stock Warning
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p>The following items have insufficient stock:</p>
                <ul className="list-group mb-3">
                  {stockWarnings.map((warning, index) => (
                    <li
                      key={index}
                      className="list-group-item list-group-item-warning"
                    >
                      <strong>{warning.productName}</strong>: {warning.message}
                    </li>
                  ))}
                </ul>
                <p>Do you want to proceed with creating this order anyway?</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </Button>
                <Button variant="warning" onClick={handleConfirmDespiteWarnings}>
                  Create Order Anyway
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </div>
    </>
  );
};

export default AddOrderForm;
