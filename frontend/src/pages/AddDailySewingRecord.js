import React, { useState, useEffect } from "react";
import axios from "axios";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import Select from "react-select";
import { Row, Col, Card, Form, Button, Alert, Spinner, Badge } from "react-bootstrap";
import { FaInfoCircle, FaTshirt, FaCheck, FaExclamationTriangle, FaClipboardCheck } from "react-icons/fa";

const AddDailySewingRecord = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productColors, setProductColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [alreadySewn, setAlreadySewn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state

  const [xs, setXs] = useState(0);
  const [s, setS] = useState(0);
  const [m, setM] = useState(0);
  const [l, setL] = useState(0);
  const [xl, setXl] = useState(0);
  const [damageCount, setDamageCount] = useState(0);

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/cutting/cutting-records/")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      const product = products.find((p) => p.id === parseInt(selectedProduct));
      if (product?.details) {
        const options = product.details.map((detail) => {
          const totalCut =
            (detail.xs || 0) +
            (detail.s || 0) +
            (detail.m || 0) +
            (detail.l || 0) +
            (detail.xl || 0);
          return {
            value: detail.id,
            label:
              detail.fabric_variant_data?.color_name ||
              detail.fabric_variant_data?.color ||
              "N/A",
            color: detail.fabric_variant_data?.color || "#ffffff",
            totalCut,
            // Store individual size quantities for validation
            xs_cut: detail.xs || 0,
            s_cut: detail.s || 0,
            m_cut: detail.m || 0,
            l_cut: detail.l || 0,
            xl_cut: detail.xl || 0,
          };
        });
        setProductColors(options);
      } else {
        setProductColors([]);
      }
      setSelectedColor("");
      setAlreadySewn(null);
    }
  }, [selectedProduct, products]);

  // Fetch already sewn quantities when a color is selected
  useEffect(() => {
    if (selectedColor) {
      setLoading(true);
      axios.get(`http://localhost:8000/api/sewing/already-sewn/${selectedColor}/`)
        .then(res => {
          setAlreadySewn(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching already sewn quantities:", err);
          setLoading(false);
          // If the endpoint doesn't exist yet, use a fallback of zeros
          setAlreadySewn({
            xs: 0,
            s: 0,
            m: 0,
            l: 0,
            xl: 0
          });
        });
    } else {
      setAlreadySewn(null);
    }
  }, [selectedColor]);

  // Check if form is valid
  useEffect(() => {
    // Form is valid if a product and color are selected and at least one size has a value > 0
    const hasProduct = !!selectedProduct;
    const hasColor = !!selectedColor;
    const hasSizes = parseInt(xs || 0) > 0 ||
                    parseInt(s || 0) > 0 ||
                    parseInt(m || 0) > 0 ||
                    parseInt(l || 0) > 0 ||
                    parseInt(xl || 0) > 0;

    setFormValid(hasProduct && hasColor && hasSizes);
  }, [selectedProduct, selectedColor, xs, s, m, l, xl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!selectedProduct) {
      setMessage("Please select a Product.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedColor) {
      setMessage("Please select a Color.");
      setIsSubmitting(false);
      return;
    }

    const selectedOption = productColors.find(
      (opt) => opt.value === selectedColor
    );

    if (!selectedOption) {
      setMessage("Selected color details not found.");
      setIsSubmitting(false);
      return;
    }

    // Validate each size individually
    const parsedXs = parseInt(xs || 0);
    const parsedS = parseInt(s || 0);
    const parsedM = parseInt(m || 0);
    const parsedL = parseInt(l || 0);
    const parsedXl = parseInt(xl || 0);
    const parsedDamage = parseInt(damageCount || 0);

    // Check for negative values
    if (parsedXs < 0 || parsedS < 0 || parsedM < 0 || parsedL < 0 || parsedXl < 0 || parsedDamage < 0) {
      setMessage("All quantities must be non-negative values.");
      setIsSubmitting(false);
      return;
    }

    // Check individual size limits with already sewn quantities
    if (!alreadySewn) {
      setMessage("Unable to validate quantities. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const alreadySewnXs = alreadySewn.xs || 0;
    const alreadySewnS = alreadySewn.s || 0;
    const alreadySewnM = alreadySewn.m || 0;
    const alreadySewnL = alreadySewn.l || 0;
    const alreadySewnXl = alreadySewn.xl || 0;

    if (parsedXs + alreadySewnXs > selectedOption.xs_cut) {
      setMessage(`XS quantity (${parsedXs}) exceeds the available quantity (${selectedOption.xs_cut - alreadySewnXs}). Already sewn: ${alreadySewnXs}`);
      setIsSubmitting(false);
      return;
    }
    if (parsedS + alreadySewnS > selectedOption.s_cut) {
      setMessage(`S quantity (${parsedS}) exceeds the available quantity (${selectedOption.s_cut - alreadySewnS}). Already sewn: ${alreadySewnS}`);
      setIsSubmitting(false);
      return;
    }
    if (parsedM + alreadySewnM > selectedOption.m_cut) {
      setMessage(`M quantity (${parsedM}) exceeds the available quantity (${selectedOption.m_cut - alreadySewnM}). Already sewn: ${alreadySewnM}`);
      setIsSubmitting(false);
      return;
    }
    if (parsedL + alreadySewnL > selectedOption.l_cut) {
      setMessage(`L quantity (${parsedL}) exceeds the available quantity (${selectedOption.l_cut - alreadySewnL}). Already sewn: ${alreadySewnL}`);
      setIsSubmitting(false);
      return;
    }
    if (parsedXl + alreadySewnXl > selectedOption.xl_cut) {
      setMessage(`XL quantity (${parsedXl}) exceeds the available quantity (${selectedOption.xl_cut - alreadySewnXl}). Already sewn: ${alreadySewnXl}`);
      setIsSubmitting(false);
      return;
    }

    const newDailyTotal = parsedXs + parsedS + parsedM + parsedL + parsedXl;
    const alreadySewnTotal = alreadySewnXs + alreadySewnS + alreadySewnM + alreadySewnL + alreadySewnXl;

    if (newDailyTotal + alreadySewnTotal > selectedOption.totalCut) {
      setMessage(`The total sewing count (${newDailyTotal}) exceeds the available quantity (${selectedOption.totalCut - alreadySewnTotal}). Already sewn: ${alreadySewnTotal}`);
      setIsSubmitting(false);
      return;
    }

    const payload = {
      cutting_record_fabric: selectedColor,
      xs: parsedXs,
      s: parsedS,
      m: parsedM,
      l: parsedL,
      xl: parsedXl,
      damage_count: parsedDamage,
    };

    axios
      .post("http://localhost:8000/api/sewing/daily-records/", payload)
      .then(() => {
        setMessage("✅ Daily sewing record added successfully!");
        setSelectedProduct("");
        setProductColors([]);
        setSelectedColor("");
        setXs(0);
        setS(0);
        setM(0);
        setL(0);
        setXl(0);
        setDamageCount(0);
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error("Error adding daily sewing record:", err);
        let errorMessage = "Error adding daily sewing record.";
        if (err.response?.data) {
          errorMessage =
            typeof err.response.data === "object"
              ? Object.values(err.response.data).flat().join("\n")
              : err.response.data;
        }
        setMessage(errorMessage);
        setIsSubmitting(false);
      });
  };

  const ColourOption = ({ data, innerRef, innerProps }) => (
    <div
      ref={innerRef}
      {...innerProps}
      style={{ display: "flex", alignItems: "center", padding: "8px" }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          backgroundColor: data.color,
          marginRight: 10,
          border: "1px solid #ccc",
          borderRadius: "4px"
        }}
      />
      <span>{data.label}</span>
    </div>
  );

  // Calculate remaining quantities
  const getRemainingQuantities = () => {
    if (!selectedColor || !alreadySewn) return null;

    const selectedOption = productColors.find(opt => opt.value === selectedColor);
    if (!selectedOption) return null;

    return {
      xs: selectedOption.xs_cut - (alreadySewn.xs || 0) - parseInt(xs || 0),
      s: selectedOption.s_cut - (alreadySewn.s || 0) - parseInt(s || 0),
      m: selectedOption.m_cut - (alreadySewn.m || 0) - parseInt(m || 0),
      l: selectedOption.l_cut - (alreadySewn.l || 0) - parseInt(l || 0),
      xl: selectedOption.xl_cut - (alreadySewn.xl || 0) - parseInt(xl || 0),
    };
  };

  // Calculate total sewn
  const totalSewn = parseInt(xs || 0) + parseInt(s || 0) + parseInt(m || 0) + parseInt(l || 0) + parseInt(xl || 0);

  // Get remaining quantities
  const remainingQuantities = getRemainingQuantities();

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
          <FaTshirt className="me-2" />
          Add Daily Sewing Record
        </h2>

        {message && message.startsWith("✅") && (
          <Alert
            variant="success"
            className="d-flex align-items-center"
          >
            <FaCheck className="me-2" size={20} />
            <div>{message}</div>
          </Alert>
        )}

        {message && !message.startsWith("✅") && (
          <Alert
            variant="danger"
            className="d-flex align-items-center"
          >
            <FaExclamationTriangle className="me-2" size={20} />
            <div>{message}</div>
          </Alert>
        )}

        <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
          <Card.Body>
            <Form noValidate onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Product (Cutting Record)</strong></Form.Label>
                    <Form.Select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="form-control shadow-sm"
                      style={{
                        borderRadius: "8px",
                        padding: "10px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <option value="">Select Product</option>
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.product_name ||
                            `${prod.fabric_definition_data?.fabric_name} cut on ${prod.cutting_date}`}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Select the product from cutting records
                    </Form.Text>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Color</strong></Form.Label>
                    <Select
                      options={productColors}
                      components={{ Option: ColourOption }}
                      value={
                        productColors.find((opt) => opt.value === selectedColor) || null
                      }
                      onChange={(opt) => setSelectedColor(opt?.value)}
                      placeholder="Select Color"
                      isDisabled={!selectedProduct}
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: "#ddd",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                          borderRadius: "8px",
                          "&:hover": { borderColor: "#aaa" },
                          padding: "5px",
                          transition: "all 0.2s ease"
                        }),
                        option: (provided, state) => ({
                          ...provided,
                          backgroundColor: state.isSelected ? "#0d6efd" : state.isFocused ? "#e9ecef" : "white",
                          color: state.isSelected ? "white" : "#333",
                          cursor: "pointer"
                        })
                      }}
                    />
                    <Form.Text className="text-muted">
                      {!selectedProduct ? "Please select a product first" : "Select the color variant"}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {selectedColor && (
                <Card className="mb-4 mt-3 border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <div className="d-flex align-items-center">
                      <FaClipboardCheck className="me-2 text-primary" />
                      <h5 className="mb-0">Available Quantities</h5>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {loading ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" variant="primary" className="me-2" />
                        <span className="text-muted">Loading quantities...</span>
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th className="text-center">Size</th>
                                <th className="text-center">Cut</th>
                                <th className="text-center">Already Sewn</th>
                                <th className="text-center">Available</th>
                              </tr>
                            </thead>
                            <tbody>
                              {["XS", "S", "M", "L", "XL"].map((size) => {
                                const selectedOption = productColors.find(
                                  (opt) => opt.value === selectedColor
                                );
                                const sizeKey = size.toLowerCase();
                                const cutKey = `${sizeKey}_cut`;
                                const alreadySewnQty = alreadySewn ? alreadySewn[sizeKey] || 0 : 0;
                                const availableQty = selectedOption ?
                                  Math.max(0, selectedOption[cutKey] - alreadySewnQty) : 0;

                                return (
                                  <tr key={`avail-${size}`}>
                                    <td className="text-center">
                                      <Badge bg="secondary" className="px-3 py-2">{size}</Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="secondary" pill className="px-3">
                                        {selectedOption ? selectedOption[cutKey] : 0}
                                      </Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge bg="info" pill className="px-3">
                                        {alreadySewnQty}
                                      </Badge>
                                    </td>
                                    <td className="text-center">
                                      <Badge
                                        bg={availableQty > 0 ? 'success' : 'danger'}
                                        pill
                                        className="px-3"
                                      >
                                        {availableQty}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 p-2 bg-light rounded border">
                          <small className="text-muted d-block mb-1">
                            <FaInfoCircle className="me-1" />
                            The quantities above show how many items are available for sewing in each size.
                          </small>
                          <small className="text-muted d-block">
                            You cannot add more than the available quantity for each size.
                          </small>
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              )}

              <h4 className="mt-4 mb-3 border-bottom pb-2">Size Quantities</h4>
              <Row className="mb-3">
                {["XS", "S", "M", "L", "XL"].map((size) => {
                  const sizeMap = { XS: xs, S: s, M: m, L: l, XL: xl };
                  const sizeKey = size.toLowerCase();
                  const isExceeded = remainingQuantities && remainingQuantities[sizeKey] < 0;

                  return (
                    <Col key={size} xs={6} sm={4} md={2} className="mb-3">
                      <Form.Group>
                        <Form.Label className="text-center d-block">{size}</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={sizeMap[size]}
                          onChange={(e) => {
                            // Ensure value is not negative
                            const val = Math.max(0, parseInt(e.target.value || 0));
                            switch (size) {
                              case "XS":
                                setXs(val);
                                break;
                              case "S":
                                setS(val);
                                break;
                              case "M":
                                setM(val);
                                break;
                              case "L":
                                setL(val);
                                break;
                              case "XL":
                                setXl(val);
                                break;
                              default:
                                break;
                            }
                          }}
                          className={`text-center ${isExceeded ? 'border-danger' : ''}`}
                          disabled={!selectedColor}
                        />
                        {isExceeded && (
                          <div className="text-danger small mt-1 text-center">
                            <FaExclamationTriangle className="me-1" size={12} />
                            Exceeds limit
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  );
                })}

                <Col xs={6} sm={4} md={2} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-center d-block">Damage</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      value={damageCount}
                      onChange={(e) => {
                        // Ensure value is not negative
                        const val = Math.max(0, parseInt(e.target.value || 0));
                        setDamageCount(val);
                      }}
                      className="text-center"
                      disabled={!selectedColor}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {totalSewn > 0 && (
                <Card className="border-0 mb-4" style={{ backgroundColor: "#e8f4fe" }}>
                  <Card.Body className="py-2">
                    <div className="d-flex flex-column">
                      <div className="d-flex align-items-center mb-2">
                        <strong className="me-2">Total Quantities:</strong>
                        <Badge bg="primary" className="me-1">XS: {xs}</Badge>
                        <Badge bg="primary" className="me-1">S: {s}</Badge>
                        <Badge bg="primary" className="me-1">M: {m}</Badge>
                        <Badge bg="primary" className="me-1">L: {l}</Badge>
                        <Badge bg="primary" className="me-1">XL: {xl}</Badge>
                        <Badge bg="success" className="ms-2">Total: {totalSewn}</Badge>
                      </div>
                      {damageCount > 0 && (
                        <div className="d-flex align-items-center">
                          <strong className="me-2">Damage Count:</strong>
                          <Badge bg="warning" text="dark">{damageCount}</Badge>
                          <strong className="mx-2">Good Items:</strong>
                          <Badge bg="success">{totalSewn - damageCount}</Badge>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              )}

              <div className="d-flex justify-content-center mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!formValid || isSubmitting}
                  className="px-5"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Daily Sewing Record'
                  )}
                </Button>
              </div>

              {!formValid && (
                <div className="text-center mt-3">
                  <small className="text-muted">
                    <FaInfoCircle className="me-1" />
                    {!selectedProduct ? "Please select a product" :
                     !selectedColor ? "Please select a color" :
                     "Please enter at least one size quantity"}
                  </small>
                </div>
              )}
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default AddDailySewingRecord;
