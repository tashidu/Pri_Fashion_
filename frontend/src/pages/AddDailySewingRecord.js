import React, { useState, useEffect } from "react";
import axios from "axios";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import Select from "react-select";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";

const AddDailySewingRecord = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productColors, setProductColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [alreadySewn, setAlreadySewn] = useState(null);
  const [loading, setLoading] = useState(false);

  const [xs, setXs] = useState(0);
  const [s, setS] = useState(0);
  const [m, setM] = useState(0);
  const [l, setL] = useState(0);
  const [xl, setXl] = useState(0);
  const [damageCount, setDamageCount] = useState(0);

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);

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
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Add Daily Sewing Record</h4>
              </Card.Header>
              <Card.Body>
                {message && (
                  <Alert variant={message.startsWith("✅") ? "success" : "danger"}>
                    {message}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Product (Cutting Record):</Form.Label>
                        <Form.Select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className="form-control"
                        >
                          <option value="">Select Product</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.product_name ||
                                `${prod.fabric_definition_data?.fabric_name} cut on ${prod.cutting_date}`}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Color:</Form.Label>
                        <Select
                          options={productColors}
                          components={{ Option: ColourOption }}
                          value={
                            productColors.find((opt) => opt.value === selectedColor) || null
                          }
                          onChange={(opt) => setSelectedColor(opt?.value)}
                          placeholder="Select Color"
                          styles={{
                            control: (provided) => ({
                              ...provided,
                              borderColor: "#ddd",
                              boxShadow: "none",
                              "&:hover": { borderColor: "#aaa" },
                              padding: "2px",
                            }),
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {selectedColor && (
                    <Card className="mb-4 mt-2 bg-light">
                      <Card.Body>
                        {loading ? (
                          <div className="text-center py-3">
                            <Spinner animation="border" size="sm" className="me-2" />
                            Loading quantities...
                          </div>
                        ) : (
                          <>
                            <h6 className="mb-3">Quantities:</h6>
                            <Row className="mb-3">
                              <Col xs={12}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-bold">Size</span>
                                  <span className="fw-bold">Cut</span>
                                  <span className="fw-bold">Already Sewn</span>
                                  <span className="fw-bold">Available</span>
                                </div>
                                <hr className="my-1" />
                              </Col>
                            </Row>
                            <Row>
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
                                  <Col key={`avail-${size}`} xs={12} className="mb-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div className="fw-bold">{size}</div>
                                      <div className="badge bg-secondary">
                                        {selectedOption ? selectedOption[cutKey] : 0}
                                      </div>
                                      <div className="badge bg-info">
                                        {alreadySewnQty}
                                      </div>
                                      <div className={`badge ${availableQty > 0 ? 'bg-success' : 'bg-danger'}`}>
                                        {availableQty}
                                      </div>
                                    </div>
                                  </Col>
                                );
                              })}
                            </Row>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                  <Row className="mb-3">
                    {["XS", "S", "M", "L", "XL"].map((size) => {
                      const sizeMap = { XS: xs, S: s, M: m, L: l, XL: xl };
                      const sizeKey = size.toLowerCase();

                      return (
                        <Col key={size} xs={6} md={4} lg={2} className="mb-3">
                          <Form.Group>
                            <Form.Label>{size}:</Form.Label>
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
                              className={remainingQuantities && remainingQuantities[sizeKey] < 0 ? 'border-danger' : ''}
                            />
                            {remainingQuantities && remainingQuantities[sizeKey] < 0 && (
                              <div className="text-danger small mt-1">Exceeds limit</div>
                            )}
                          </Form.Group>
                        </Col>
                      );
                    })}

                    <Col xs={6} md={4} lg={2} className="mb-3">
                      <Form.Group>
                        <Form.Label>Damage:</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          value={damageCount}
                          onChange={(e) => {
                            // Ensure value is not negative
                            const val = Math.max(0, parseInt(e.target.value || 0));
                            setDamageCount(val);
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {totalSewn > 0 && (
                    <Card className="mb-4 bg-light">
                      <Card.Body>
                        <h6>Summary:</h6>
                        <Row className="text-center">
                          <Col>
                            <div className="fw-bold">Total Sewn</div>
                            <div className="badge bg-primary">{totalSewn}</div>
                          </Col>
                          {damageCount > 0 && (
                            <Col>
                              <div className="fw-bold">Damage</div>
                              <div className="badge bg-warning">{damageCount}</div>
                            </Col>
                          )}
                          <Col>
                            <div className="fw-bold">Good Items</div>
                            <div className="badge bg-success">{totalSewn - damageCount}</div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  )}

                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      type="submit"
                      size="lg"
                      disabled={!formValid || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Daily Sewing Record"
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AddDailySewingRecord;
