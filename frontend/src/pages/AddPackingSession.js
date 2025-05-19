import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Card, Form, Button, Row, Col, Spinner, Alert } from "react-bootstrap";
import { BsBoxSeam, BsCheck2Circle, BsExclamationTriangle } from "react-icons/bs";

const AddPackingSession = () => {
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [pack6, setPack6] = useState(0);
  const [pack12, setPack12] = useState(0);
  const [extraItems, setExtraItems] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [formValid, setFormValid] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if a product ID was passed in the location state
  const productIdFromState = location.state?.productId;

  const totalItems = pack6 * 6 + pack12 * 12 + Number(extraItems);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load finished products
  useEffect(() => {
    setIsLoading(true);
    axios
      .get("http://localhost:8000/api/reports/product-packing-report/")
      .then((res) => {
        console.log("API response:", res.data);
        setFinishedProducts(res.data);

        // If a product ID was passed in the state, select it
        if (productIdFromState) {
          setSelectedProduct(productIdFromState.toString());
        }

        setIsLoading(false);
      })
      .catch((err) => {
        setError("⚠️ Failed to load finished products");
        setIsLoading(false);
        console.error("Error loading products:", err);
      });
  }, [productIdFromState]);

  // Fetch selected product details when product changes
  useEffect(() => {
    if (selectedProduct) {
      const product = finishedProducts.find(p => p.id.toString() === selectedProduct.toString());
      console.log("Selected product details:", product);
      setSelectedProductDetails(product);
    } else {
      setSelectedProductDetails(null);
    }
  }, [selectedProduct, finishedProducts]);

  // Validate form
  useEffect(() => {
    // Form is valid if a product is selected and total items is greater than 0
    const hasProduct = !!selectedProduct;
    const hasItems = totalItems > 0;

    setFormValid(hasProduct && hasItems);
  }, [selectedProduct, totalItems]);

  // Check if total exceeds available quantity
  const isQuantityExceeded = selectedProductDetails &&
    totalItems > selectedProductDetails.available_quantity;

  const resetForm = () => {
    setSelectedProduct("");
    setPack6(0);
    setPack12(0);
    setExtraItems(0);
    setError("");
    setMessage("");
    setShowConfirmation(false);
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();

    // Validate form
    if (!selectedProduct) {
      setError("Please select a finished product.");
      return;
    }

    if (totalItems <= 0) {
      setError("Please add at least one item to pack.");
      return;
    }

    if (isQuantityExceeded) {
      setError(`Cannot pack ${totalItems} items. Only ${selectedProductDetails.available_quantity} available.`);
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const payload = {
      finished_product: selectedProduct,
      number_of_6_packs: Number(pack6),
      number_of_12_packs: Number(pack12),
      extra_items: Number(extraItems)
    };

    try {
      await axios.post("http://localhost:8000/api/packing/sessions/", payload);
      setMessage("✅ Packing session created successfully!");
      setShowConfirmation(false);

      // Redirect after success - go back to the previous page if coming from the modal
      if (productIdFromState) {
        setTimeout(() => navigate(-1), 1500); // Go back to the previous page
      } else {
        setTimeout(() => navigate("/view-packing-sessions"), 1500);
      }
    } catch (err) {
      console.error("Error creating session:", err);
      setShowConfirmation(false);

      // Display detailed backend error if available
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "object"
      ) {
        const firstKey = Object.keys(err.response.data)[0];
        const errorMsg = err.response.data[firstKey];
        setError(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg);
      } else {
        setError("❌ Failed to create packing session.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <BsBoxSeam className="me-2" />
          Add Packing Session
        </h2>

        {message && (
          <Alert variant="success" className="d-flex align-items-center">
            <BsCheck2Circle className="me-2" size={20} />
            {message}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <BsExclamationTriangle className="me-2" size={20} />
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" className="mb-2" />
            <p>Loading products...</p>
          </div>
        ) : (
          <Card
            className="mb-4 shadow-sm"
            style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}
          >
            <Card.Body>
              <Form onSubmit={handleSubmitClick}>
                <Form.Group className="mb-4">
                  <Form.Label><strong>Select Finished Product:</strong></Form.Label>
                  <Form.Select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    required
                    className={!selectedProduct && "border-danger"}
                  >
                    <option value="">-- Choose Product --</option>
                    {finishedProducts.map((fp) => (
                      <option key={fp.id} value={fp.id}>
                        {fp.product_name} - Available: {fp.available_quantity || 0} items
                      </option>
                    ))}
                  </Form.Select>
                  {!selectedProduct && (
                    <Form.Text className="text-danger">
                      Please select a product
                    </Form.Text>
                  )}
                </Form.Group>

                {selectedProductDetails && (
                  <Card className="mb-4 bg-light">
                    <Card.Body>
                      <h6 className="mb-3">Product Details:</h6>
                      <Row>
                        <Col md={6}>
                          <p><strong>Product:</strong> {selectedProductDetails.product_name || "Unknown Product"}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Available Quantity:</strong> {selectedProductDetails.available_quantity || 0} items</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Number of 12-Packs:</strong></Form.Label>
                      <Form.Control
                        type="number"
                        value={pack12}
                        onChange={(e) => setPack12(Math.max(0, Number(e.target.value)))}
                        min="0"
                        required
                        className={isQuantityExceeded ? "border-danger" : ""}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Number of 6-Packs:</strong></Form.Label>
                      <Form.Control
                        type="number"
                        value={pack6}
                        onChange={(e) => setPack6(Math.max(0, Number(e.target.value)))}
                        min="0"
                        required
                        className={isQuantityExceeded ? "border-danger" : ""}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label><strong>Extra Items:</strong></Form.Label>
                      <Form.Control
                        type="number"
                        value={extraItems}
                        onChange={(e) => setExtraItems(Math.max(0, Number(e.target.value)))}
                        min="0"
                        required
                        className={isQuantityExceeded ? "border-danger" : ""}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Card
                  className="mt-4 mb-4"
                  style={{
                    backgroundColor: isQuantityExceeded ? "#f8d7da" : "#d1e7dd",
                    borderColor: isQuantityExceeded ? "#f5c2c7" : "#badbcc"
                  }}
                >
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">Total Packed Quantity: {totalItems}</h5>
                      {selectedProductDetails && (
                        <small className={isQuantityExceeded ? "text-danger" : "text-success"}>
                          {isQuantityExceeded
                            ? `Exceeds available quantity by ${totalItems - selectedProductDetails.available_quantity} items`
                            : `${selectedProductDetails.available_quantity - totalItems} items will remain available`}
                        </small>
                      )}
                    </div>
                    <div>
                      {isQuantityExceeded && (
                        <BsExclamationTriangle size={24} className="text-danger" />
                      )}
                    </div>
                  </Card.Body>
                </Card>

                <div className="d-flex justify-content-between mt-4">
                  <Button
                    variant="secondary"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!formValid || isQuantityExceeded || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Processing...
                      </>
                    ) : (
                      "Submit Packing Session"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
               style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <Card style={{ width: "400px" }}>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Confirm Packing Session</h5>
              </Card.Header>
              <Card.Body>
                <p>Are you sure you want to create this packing session?</p>
                <p><strong>Product:</strong> {selectedProductDetails?.product_name}</p>
                <p><strong>12-Packs:</strong> {pack12}</p>
                <p><strong>6-Packs:</strong> {pack6}</p>
                <p><strong>Extra Items:</strong> {extraItems}</p>
                <p><strong>Total Items:</strong> {totalItems}</p>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between">
                <Button variant="secondary" onClick={() => setShowConfirmation(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleConfirmSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </Card.Footer>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default AddPackingSession;
