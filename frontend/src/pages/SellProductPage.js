import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Badge, Modal } from "react-bootstrap";
import { FaStore, FaBoxes, FaShoppingCart, FaPlus, FaMinus, FaTrash, FaFileInvoice, FaCheck } from "react-icons/fa";
import SalesTeamNavBar from "../components/SalesTeamNavBar";
import { authGet, authPost } from "../utils/api";
import { useNavigate, useLocation } from "react-router-dom";
import InvoicePreviewModal from "../components/InvoicePreviewModal";

const SellProductPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preSelectedProductId = queryParams.get("productId");

  // Fetch shops and products data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch shops
        const shopsResponse = await authGet("orders/shops/");
        if (shopsResponse.status === 200) {
          setShops(shopsResponse.data);
        } else {
          setError("Failed to fetch shops data");
        }

        // Fetch products with inventory
        const productsResponse = await authGet("finished_product/sales-products/");
        if (productsResponse.status === 200) {
          // Filter products with available inventory
          const availableProducts = productsResponse.data.filter(
            product => (product.packing_inventory?.total_quantity || 0) > 0
          );
          setProducts(availableProducts);

          // If a product ID was provided in the URL, pre-select it
          if (preSelectedProductId) {
            const selectedProduct = availableProducts.find(
              p => p.id === parseInt(preSelectedProductId)
            );
            if (selectedProduct) {
              addProductToSelection(selectedProduct);
            }
          }
        } else {
          setError("Failed to fetch products data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [preSelectedProductId]);

  // Add product to selection
  const addProductToSelection = (product) => {
    // Check if product is already selected
    if (selectedProducts.some(p => p.id === product.id)) {
      return;
    }

    console.log("Adding product to selection:", product);

    // Add product with initial quantities
    const newProduct = {
      id: product.id,
      name: product.product_name,
      selling_price: product.selling_price,
      quantity_6_packs: 0,
      quantity_12_packs: 0,
      quantity_extra_items: 0,
      max_6_packs: product.packing_inventory?.number_of_6_packs || 0,
      max_12_packs: product.packing_inventory?.number_of_12_packs || 0,
      max_extra_items: product.packing_inventory?.extra_items || 0,
      total_quantity: product.packing_inventory?.total_quantity || 0
    };

    console.log("New product object:", newProduct);

    setSelectedProducts(prevProducts => {
      const updatedProducts = [...prevProducts, newProduct];
      console.log("Updated selected products:", updatedProducts);
      return updatedProducts;
    });
  };

  // Remove product from selection
  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Update product quantity
  const updateProductQuantity = (productId, field, value) => {
    // Log the update for debugging
    console.log(`Updating ${field} for product ${productId} to ${value}`);

    // Create a new array with the updated product
    const updatedProducts = selectedProducts.map(product => {
      if (product.id === productId) {
        // Ensure value is not negative and doesn't exceed max
        const newValue = Math.max(0, Math.min(value, product[`max_${field}`]));
        console.log(`Calculated new value: ${newValue}`);
        // Create a new product object with the updated field
        return {
          ...product,
          [field]: newValue
        };
      }
      return product;
    });

    // Update state with the new array
    setSelectedProducts(updatedProducts);
  };

  // Calculate total units for a product
  const calculateTotalUnits = (product) => {
    if (!product) return 0;

    const sixPacks = parseInt(product.quantity_6_packs) || 0;
    const twelvePacks = parseInt(product.quantity_12_packs) || 0;
    const extraItems = parseInt(product.quantity_extra_items) || 0;

    return (sixPacks * 6) + (twelvePacks * 12) + extraItems;
  };

  // Calculate subtotal for a product
  const calculateSubtotal = (product) => {
    const totalUnits = calculateTotalUnits(product);
    return totalUnits * product.selling_price;
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    return selectedProducts.reduce(
      (total, product) => total + calculateSubtotal(product),
      0
    );
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  // Validate form
  const validateForm = () => {
    if (!selectedShop) {
      setError("Please select a shop");
      return false;
    }

    if (selectedProducts.length === 0) {
      setError("Please select at least one product");
      return false;
    }

    // Check if any product has quantities
    const hasQuantities = selectedProducts.some(
      product => calculateTotalUnits(product) > 0
    );

    if (!hasQuantities) {
      setError("Please add quantities for at least one product");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  // Confirm and submit order
  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError(null);

    try {
      // Create order
      const orderResponse = await authPost("orders/orders/create/", {
        shop: selectedShop,
        status: "draft" // Start as draft to comply with the workflow
      });

      if (orderResponse.status !== 201) {
        throw new Error("Failed to create order");
      }

      const orderId = orderResponse.data.id;

      // Add order items
      for (const product of selectedProducts) {
        if (calculateTotalUnits(product) > 0) {
          await authPost("orders/orders/items/", {
            order: orderId,
            finished_product: product.id,
            quantity_6_packs: product.quantity_6_packs,
            quantity_12_packs: product.quantity_12_packs,
            quantity_extra_items: product.quantity_extra_items
          });
        }
      }

      // Submit the order
      await authPost(`orders/orders/${orderId}/submit/`);

      // Auto-approve the order (since sales team is selling directly)
      await authPost(`orders/orders/${orderId}/approve/`);

      // Generate invoice
      const invoiceResponse = await authPost(`orders/orders/${orderId}/generate-invoice/`);

      if (invoiceResponse.status === 200) {
        // Mark as delivered immediately
        await authPost(`orders/orders/${orderId}/mark-delivered/`, {
          delivery_date: new Date().toISOString(),
          delivery_notes: "Direct sale by sales team"
        });

        // Get the complete order details for the invoice
        const orderDetailsResponse = await authGet(`orders/orders/${orderId}/`);
        if (orderDetailsResponse.status === 200) {
          setCreatedOrder(orderDetailsResponse.data);
          setSuccessMessage(`Order #${orderId} created and processed successfully!`);
          setShowInvoiceModal(true);
        }
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setError("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SalesTeamNavBar />
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <Container fluid>
          <Row className="mb-4">
            <Col>
              <h2 className="text-primary fw-bold">Sell Products</h2>
              <p className="text-muted">Create a new sale and generate invoice</p>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="mb-4" dismissible onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading data...</p>
            </div>
          ) : (
            <Row>
              <Col lg={4} className="mb-4">
                <Card className="shadow-sm h-100">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Sale Details</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form>
                      <Form.Group className="mb-4">
                        <Form.Label>Select Shop</Form.Label>
                        <Form.Select
                          value={selectedShop}
                          onChange={(e) => setSelectedShop(e.target.value)}
                          required
                        >
                          <option value="">-- Select a shop --</option>
                          {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                              {shop.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label>Add Products</Form.Label>
                        <Form.Select
                          onChange={(e) => {
                            const productId = e.target.value;
                            if (productId) {
                              const product = products.find(p => p.id === parseInt(productId));
                              if (product) {
                                addProductToSelection(product);
                              }
                            }
                          }}
                          value=""
                        >
                          <option value="">-- Select a product --</option>
                          {products
                            .filter(p => !selectedProducts.some(sp => sp.id === p.id))
                            .map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.product_name} ({product.packing_inventory?.total_quantity || 0} in stock)
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>

                      <div className="d-grid">
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? (
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
                              <FaFileInvoice className="me-2" /> Create Sale & Generate Invoice
                            </>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Selected Products</h5>
                  </Card.Header>
                  <Card.Body>
                    {selectedProducts.length === 0 ? (
                      <Alert variant="info">
                        No products selected. Please select products to add to the sale.
                      </Alert>
                    ) : (
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead className="table-light">
                            <tr>
                              <th>Product</th>
                              <th>6-Packs</th>
                              <th>12-Packs</th>
                              <th>Extra Items</th>
                              <th>Total Units</th>
                              <th>Unit Price</th>
                              <th>Subtotal</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProducts.map((product) => (
                              <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Decrementing 6-packs for product:", product.id);
                                        const newValue = Math.max(0, product.quantity_6_packs - 1);
                                        console.log("New value:", newValue);
                                        setSelectedProducts(prevProducts => {
                                          const updated = prevProducts.map(p =>
                                            p.id === product.id ? {...p, quantity_6_packs: newValue} : p
                                          );
                                          console.log("Updated products:", updated);
                                          return updated;
                                        });
                                      }}
                                      disabled={product.quantity_6_packs <= 0}
                                    >
                                      <FaMinus />
                                    </Button>
                                    <div className="mx-2 text-center" style={{ width: "60px", backgroundColor: "#f8f9fa", padding: "6px", borderRadius: "4px" }}>
                                      {product.quantity_6_packs}
                                    </div>
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Incrementing 6-packs for product:", product.id);
                                        const newValue = Math.min(product.max_6_packs, product.quantity_6_packs + 1);
                                        console.log("New value:", newValue);
                                        setSelectedProducts(prevProducts => {
                                          const updated = prevProducts.map(p =>
                                            p.id === product.id ? {...p, quantity_6_packs: newValue} : p
                                          );
                                          console.log("Updated products:", updated);
                                          return updated;
                                        });
                                      }}
                                      disabled={product.quantity_6_packs >= product.max_6_packs}
                                    >
                                      <FaPlus />
                                    </Button>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Decrementing 12-packs for product:", product.id);
                                        const newValue = Math.max(0, product.quantity_12_packs - 1);
                                        console.log("New value:", newValue);
                                        setSelectedProducts(prevProducts => {
                                          const updated = prevProducts.map(p =>
                                            p.id === product.id ? {...p, quantity_12_packs: newValue} : p
                                          );
                                          console.log("Updated products:", updated);
                                          return updated;
                                        });
                                      }}
                                      disabled={product.quantity_12_packs <= 0}
                                    >
                                      <FaMinus />
                                    </Button>
                                    <div className="mx-2 text-center" style={{ width: "60px", backgroundColor: "#f8f9fa", padding: "6px", borderRadius: "4px" }}>
                                      {product.quantity_12_packs}
                                    </div>
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Incrementing 12-packs for product:", product.id);
                                        const newValue = Math.min(product.max_12_packs, product.quantity_12_packs + 1);
                                        console.log("New value:", newValue);
                                        setSelectedProducts(prevProducts => {
                                          const updated = prevProducts.map(p =>
                                            p.id === product.id ? {...p, quantity_12_packs: newValue} : p
                                          );
                                          console.log("Updated products:", updated);
                                          return updated;
                                        });
                                      }}
                                      disabled={product.quantity_12_packs >= product.max_12_packs}
                                    >
                                      <FaPlus />
                                    </Button>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Decrementing extra items for product:", product.id);
                                        const newValue = Math.max(0, product.quantity_extra_items - 1);
                                        console.log("New value:", newValue);
                                        setSelectedProducts(prevProducts => {
                                          const updated = prevProducts.map(p =>
                                            p.id === product.id ? {...p, quantity_extra_items: newValue} : p
                                          );
                                          console.log("Updated products:", updated);
                                          return updated;
                                        });
                                      }}
                                      disabled={product.quantity_extra_items <= 0}
                                    >
                                      <FaMinus />
                                    </Button>
                                    <div className="mx-2 text-center" style={{ width: "60px", backgroundColor: "#f8f9fa", padding: "6px", borderRadius: "4px" }}>
                                      {product.quantity_extra_items}
                                    </div>
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => {
                                        console.log("Incrementing extra items for product:", product.id);
                                        const newValue = Math.min(product.max_extra_items, product.quantity_extra_items + 1);
                                        console.log("New value:", newValue);
                                        setSelectedProducts(prevProducts => {
                                          const updated = prevProducts.map(p =>
                                            p.id === product.id ? {...p, quantity_extra_items: newValue} : p
                                          );
                                          console.log("Updated products:", updated);
                                          return updated;
                                        });
                                      }}
                                      disabled={product.quantity_extra_items >= product.max_extra_items}
                                    >
                                      <FaPlus />
                                    </Button>
                                  </div>
                                </td>
                                <td className="text-center">
                                  <div className="d-flex flex-column align-items-center">
                                    <Badge
                                      bg={calculateTotalUnits(product) > 0 ? "success" : "secondary"}
                                      className="px-3 py-2 fs-6 mb-1 w-100"
                                    >
                                      {calculateTotalUnits(product)} units
                                    </Badge>
                                    <small className="text-muted">
                                      {product.quantity_6_packs > 0 && `${product.quantity_6_packs} × 6`}
                                      {product.quantity_6_packs > 0 && (product.quantity_12_packs > 0 || product.quantity_extra_items > 0) && ' + '}
                                      {product.quantity_12_packs > 0 && `${product.quantity_12_packs} × 12`}
                                      {product.quantity_12_packs > 0 && product.quantity_extra_items > 0 && ' + '}
                                      {product.quantity_extra_items > 0 && `${product.quantity_extra_items}`}
                                    </small>
                                  </div>
                                </td>
                                <td>{formatCurrency(product.selling_price)}</td>
                                <td className="fw-bold">
                                  {formatCurrency(calculateSubtotal(product))}
                                </td>
                                <td>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => removeProduct(product.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan="6" className="text-end fw-bold">
                                Total:
                              </td>
                              <td className="fw-bold text-primary">
                                {formatCurrency(calculateOrderTotal())}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Sale</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to create this sale? This will:</p>
          <ul>
            <li>Create a new order</li>
            <li>Automatically approve the order</li>
            <li>Generate an invoice</li>
            <li>Mark the order as delivered</li>
          </ul>
          <p className="mb-0">Total amount: <strong>{formatCurrency(calculateOrderTotal())}</strong></p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Processing...
              </>
            ) : (
              <>
                <FaCheck className="me-2" /> Confirm Sale
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Preview Modal */}
      {createdOrder && (
        <InvoicePreviewModal
          show={showInvoiceModal}
          onHide={() => setShowInvoiceModal(false)}
          order={createdOrder}
          onSuccess={() => {
            setShowInvoiceModal(false);
            // Reset form
            setSelectedShop("");
            setSelectedProducts([]);
            // Navigate to orders page
            navigate("/sales-team-orders");
          }}
        />
      )}
    </>
  );
};

export default SellProductPage;
