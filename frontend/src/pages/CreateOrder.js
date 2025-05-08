import React, { useState, useEffect } from "react";
import axios from "axios";
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
  InputGroup
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
  FaInfoCircle
} from "react-icons/fa";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import "./CreateOrder.css"; // We'll create this CSS file later

const AddOrderForm = () => {
  const [orderData, setOrderData] = useState({
    shop: "",
    placed_by: "", // will be filled with current user ID
    items: [],
  });

  const [shops, setShops] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = 1; // ⚠️ Replace with actual authenticated user ID from context or token

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [shopsRes, productsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/orders/shops/"),
          axios.get("http://localhost:8000/api/finished_product/report")
        ]);

        setShops(shopsRes.data);
        setFinishedProducts(productsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load necessary data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (!orderData.shop || orderData.items.length === 0) {
      setError("Please select a shop and add at least one item.");
      setIsSubmitting(false);
      return;
    }

    // Validate that each item has a product and at least one quantity
    const invalidItems = orderData.items.filter(
      item => !item.finished_product || calculateTotalUnits(item) === 0
    );

    if (invalidItems.length > 0) {
      setError("Please select a product and add at least one quantity for each item.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create the order
      const orderRes = await axios.post("http://localhost:8000/api/orders/orders/create/", {
        shop: orderData.shop,
        placed_by: currentUserId, // use ID, not name
      });

      const orderId = orderRes.data.id;

      // Step 2: Create each order item
      const itemRequests = orderData.items.map((item) =>
        axios.post("http://localhost:8000/api/orders/orders/items/", {
          order: orderId,
          finished_product: item.finished_product,
          quantity_6_packs: item.quantity_6_packs,
          quantity_12_packs: item.quantity_12_packs,
          quantity_extra_items: item.quantity_extra_items,
        })
      );

      await Promise.all(itemRequests);

      setSuccess(`Order #${orderId} created successfully!`);
      setOrderData({ shop: "", placed_by: "", items: [] });
    } catch (err) {
      console.error("Error submitting order", err);
      setError("An error occurred while submitting the order. Please try again.");
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

  return (
    <>
      <RoleBasedNavBar />
      <Container fluid className="main-content py-4">
        <Row className="justify-content-center">
          <Col lg={10} xl={9}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-primary text-white d-flex align-items-center">
                <FaShoppingCart className="me-2" />
                <h5 className="mb-0">Create New Order</h5>
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

                      <Card className="mb-4 border-0 shadow-sm">
                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 d-flex align-items-center">
                            <FaBoxOpen className="me-2" />
                            Order Items
                          </h6>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={addItem}
                            disabled={isSubmitting}
                            className="d-flex align-items-center"
                          >
                            <FaPlus className="me-1" /> Add Item
                          </Button>
                        </Card.Header>

                        <Card.Body className="p-0">
                          {orderData.items.length === 0 ? (
                            <div className="text-center py-4">
                              <FaBoxes className="text-muted mb-2" style={{ fontSize: '2rem' }} />
                              <p className="text-muted">No items added yet. Click "Add Item" to start.</p>
                            </div>
                          ) : (
                            <div className="p-3">
                              {orderData.items.map((item, index) => (
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
                                            {finishedProducts.map((fp) => (
                                              <option key={fp.id} value={fp.id}>
                                                {fp.product_name}
                                              </option>
                                            ))}
                                          </Form.Select>
                                        </Form.Group>
                                      </Col>

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
                                            />
                                            <InputGroup.Text>packs</InputGroup.Text>
                                          </InputGroup>
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
                                            />
                                            <InputGroup.Text>packs</InputGroup.Text>
                                          </InputGroup>
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
                                            />
                                            <InputGroup.Text>units</InputGroup.Text>
                                          </InputGroup>
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
                              ))}
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

                      <div className="d-grid">
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
