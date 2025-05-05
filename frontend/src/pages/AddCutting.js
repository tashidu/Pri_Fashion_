import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Card, Form, Button, Row, Col, Spinner, Alert, Container, Badge } from 'react-bootstrap';
import { BsScissors, BsPlus, BsTrash, BsCheck2Circle, BsExclamationTriangle } from 'react-icons/bs';

const AddCuttingRecord = () => {
  // Overall cutting record fields
  const [fabricDefinitions, setFabricDefinitions] = useState([]);
  const [selectedFabricDefinition, setSelectedFabricDefinition] = useState('');
  const [cuttingDate, setCuttingDate] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');

  // For storing variants of the currently selected FabricDefinition
  const [fabricVariants, setFabricVariants] = useState([]);

  // Cutting detail rows
  const [details, setDetails] = useState([
    { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }
  ]);

  // Loading, error, success states
  const [loadingDefinitions, setLoadingDefinitions] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [validated, setValidated] = useState(false);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Fetch fabric definitions on mount
  useEffect(() => {
    setLoadingDefinitions(true);
    axios.get("http://localhost:8000/api/fabric-definitions/")
      .then((res) => {
        setFabricDefinitions(res.data);
        setLoadingDefinitions(false);
      })
      .catch((err) => {
        console.error('Error fetching fabric definitions:', err);
        setError('Failed to load fabric definitions. Please try again.');
        setLoadingDefinitions(false);
      });
  }, []);

  // 2. Fetch variants when a FabricDefinition is selected
  useEffect(() => {
    if (selectedFabricDefinition) {
      setLoadingVariants(true);
      axios.get(`http://localhost:8000/api/fabric-definitions/${selectedFabricDefinition}/variants/`)
        .then((res) => {
          setFabricVariants(res.data);
          setLoadingVariants(false);
        })
        .catch((err) => {
          console.error('Error fetching fabric variants:', err);
          setError('Failed to load fabric variants. Please try again.');
          setLoadingVariants(false);
        });
    } else {
      setFabricVariants([]);
    }
  }, [selectedFabricDefinition]);

  // Add a new empty detail row
  const addDetailRow = () => {
    setDetails([...details, { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
  };

  // Delete a detail row
  const removeDetailRow = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  // Handle change for each detail row field
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Check if any detail has a fabric variant selected
    const hasValidDetails = details.some(detail => detail.fabric_variant);
    if (!hasValidDetails) {
      setError('Please select at least one fabric variant for your cutting details.');
      return;
    }

    // Validate yard availability for each detail
    let yardValidationError = false;
    details.forEach(detail => {
      if (detail.fabric_variant) {
        const variant = fabricVariants.find(v => v.id === detail.fabric_variant);
        if (variant && parseFloat(detail.yard_usage) > (variant.available_yard || variant.total_yard)) {
          yardValidationError = true;
          setError(`Yard usage for ${variant.color_name || variant.color} exceeds available yards (${variant.available_yard || variant.total_yard} yards available).`);
        }
      }
    });

    if (yardValidationError) {
      setValidated(true);
      return;
    }

    setValidated(true);
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      fabric_definition: selectedFabricDefinition,
      cutting_date: cuttingDate,
      description: description,
      product_name: productName,
      details: details
    };

    try {
      await axios.post("http://localhost:8000/api/cutting/cutting-records/", payload);
      setSuccess('Cutting record created successfully!');
      // Reset form fields
      setSelectedFabricDefinition('');
      setCuttingDate('');
      setDescription('');
      setProductName('');
      setDetails([{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
      setValidated(false);
    } catch (err) {
      console.error('Error creating cutting record:', err);
      if (err.response && err.response.data) {
        // Display more specific error message if available
        const errorMessage = typeof err.response.data === 'string'
          ? err.response.data
          : 'Failed to create cutting record. Please check your inputs.';
        setError(errorMessage);
      } else {
        setError('Failed to create cutting record. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom option component that shows a color swatch + label
  const ColourOption = ({ data, innerRef, innerProps }) => (
    <div
      ref={innerRef}
      {...innerProps}
      style={{ display: 'flex', alignItems: 'center', padding: '4px' }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: data.color,
          marginRight: 8,
          border: '1px solid #ccc'
        }}
      />
      <span>{data.label}</span>
    </div>
  );

  // Calculate total quantities for all details
  const totalQuantities = details.reduce(
    (acc, detail) => {
      acc.xs += parseInt(detail.xs) || 0;
      acc.s += parseInt(detail.s) || 0;
      acc.m += parseInt(detail.m) || 0;
      acc.l += parseInt(detail.l) || 0;
      acc.xl += parseInt(detail.xl) || 0;
      acc.total += (parseInt(detail.xs) || 0) +
                  (parseInt(detail.s) || 0) +
                  (parseInt(detail.m) || 0) +
                  (parseInt(detail.l) || 0) +
                  (parseInt(detail.xl) || 0);
      acc.yard_usage += parseFloat(detail.yard_usage) || 0;
      return acc;
    },
    { xs: 0, s: 0, m: 0, l: 0, xl: 0, total: 0, yard_usage: 0 }
  );

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
          <BsScissors className="me-2" />
          Add Cutting Record
        </h2>

        {success && (
          <Alert variant="success" className="d-flex align-items-center">
            <BsCheck2Circle className="me-2" size={20} />
            {success}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <BsExclamationTriangle className="me-2" size={20} />
            {error}
          </Alert>
        )}

        <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
          <Card.Body>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Fabric Definition</strong></Form.Label>
                    {loadingDefinitions ? (
                      <div className="d-flex align-items-center">
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span>Loading fabrics...</span>
                      </div>
                    ) : (
                      <Form.Select
                        value={selectedFabricDefinition}
                        onChange={(e) => setSelectedFabricDefinition(e.target.value)}
                        required
                      >
                        <option value="">Select Fabric Group</option>
                        {fabricDefinitions.map((fd) => (
                          <option key={fd.id} value={fd.id}>
                            {fd.fabric_name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    <Form.Control.Feedback type="invalid">
                      Please select a fabric definition.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Product Name</strong></Form.Label>
                    <Form.Control
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name"
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a product name.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Cutting Date</strong></Form.Label>
                    <Form.Control
                      type="date"
                      value={cuttingDate}
                      onChange={(e) => setCuttingDate(e.target.value)}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      Please select a cutting date.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Description</strong></Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter details about this cutting record..."
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h4 className="mt-4 mb-3 border-bottom pb-2">Fabric Details</h4>

              {details.map((detail, index) => {
                // Find the selected variant object to set the value in React-Select
                const currentVariant = fabricVariants.find(v => v.id === detail.fabric_variant);
                const currentValue = currentVariant
                  ? {
                      value: currentVariant.id,
                      label: `${currentVariant.color_name || currentVariant.color} (${currentVariant.available_yard || currentVariant.total_yard} yards available)`,
                      color: currentVariant.color,
                      available_yard: currentVariant.available_yard || currentVariant.total_yard,
                      total_yard: currentVariant.total_yard
                    }
                  : null;

                // Prepare the variant options for React-Select
                const variantOptions = fabricVariants.map((variant) => ({
                  value: variant.id,
                  label: `${variant.color_name || variant.color} (${variant.available_yard || variant.total_yard} yards available)`,
                  color: variant.color,
                  available_yard: variant.available_yard || variant.total_yard,
                  total_yard: variant.total_yard
                }));

                return (
                  <Card key={index} className="mb-3 border">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                      <h5 className="mb-0">Detail #{index + 1}</h5>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeDetailRow(index)}
                        disabled={details.length === 1}
                      >
                        <BsTrash className="me-1" /> Remove
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label><strong>Fabric Variant (Color)</strong></Form.Label>
                            {loadingVariants ? (
                              <div className="d-flex align-items-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>Loading variants...</span>
                              </div>
                            ) : (
                              <>
                                <Select
                                  options={variantOptions}
                                  components={{ Option: ColourOption }}
                                  value={currentValue}
                                  onChange={(selectedOption) => {
                                    handleDetailChange(index, 'fabric_variant', selectedOption.value);
                                  }}
                                  placeholder="Select Variant"
                                  isDisabled={!selectedFabricDefinition}
                                  styles={{
                                    control: (provided) => ({
                                      ...provided,
                                      borderColor: '#ddd',
                                      boxShadow: 'none',
                                      height: '38px',
                                      '&:hover': {
                                        borderColor: '#aaa'
                                      }
                                    }),
                                    valueContainer: (provided) => ({
                                      ...provided,
                                      height: '38px',
                                      padding: '0 8px'
                                    })
                                  }}
                                />
                                {!detail.fabric_variant && validated && (
                                  <div className="text-danger small mt-1">
                                    Please select a fabric variant.
                                  </div>
                                )}
                              </>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <Form.Label className="mb-0"><strong>Yard Usage</strong></Form.Label>
                              {currentVariant && (
                                <span className={parseFloat(detail.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard) ? "text-danger small" : "text-success small"}>
                                  Available: {currentVariant.available_yard || currentVariant.total_yard} yards
                                </span>
                              )}
                            </div>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={detail.yard_usage}
                              onChange={(e) => handleDetailChange(index, 'yard_usage', e.target.value)}
                              required
                              placeholder="Enter yards used"
                              isInvalid={currentVariant && parseFloat(detail.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard)}
                              className={currentVariant && parseFloat(detail.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard) ? "border-danger" : ""}
                              style={{ height: '38px' }}
                            />
                            <Form.Control.Feedback type="invalid">
                              {currentVariant && parseFloat(detail.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard)
                                ? `Exceeds available yards (${currentVariant.available_yard || currentVariant.total_yard} yards available)`
                                : "Please enter valid yard usage."}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Label className="mt-2"><strong>Size Quantities</strong></Form.Label>
                      <Row>
                        {["XS", "S", "M", "L", "XL"].map((size, sizeIndex) => {
                          const sizeKey = size.toLowerCase();
                          return (
                            <Col key={sizeIndex} xs={6} sm={4} md={2} className="mb-3">
                              <Form.Group>
                                <Form.Label className="text-center d-block">{size}</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={detail[sizeKey]}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value || 0));
                                    handleDetailChange(index, sizeKey, val);
                                  }}
                                  className="text-center"
                                />
                              </Form.Group>
                            </Col>
                          );
                        })}
                        <Col xs={6} sm={4} md={2} className="mb-3">
                          <Form.Group>
                            <Form.Label className="text-center d-block">Total</Form.Label>
                            <div className="form-control text-center bg-light">
                              {parseInt(detail.xs || 0) +
                               parseInt(detail.s || 0) +
                               parseInt(detail.m || 0) +
                               parseInt(detail.l || 0) +
                               parseInt(detail.xl || 0)}
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                );
              })}

              <div className="d-flex justify-content-between mb-4">
                <Button
                  variant="outline-primary"
                  onClick={addDetailRow}
                  className="d-flex align-items-center"
                >
                  <BsPlus size={20} className="me-1" /> Add Another Detail
                </Button>

                <Card className="border-0" style={{ backgroundColor: "#e8f4fe" }}>
                  <Card.Body className="py-2">
                    <div className="d-flex flex-column">
                      <div className="d-flex align-items-center mb-2">
                        <strong className="me-2">Total Quantities:</strong>
                        <Badge bg="primary" className="me-1">XS: {totalQuantities.xs}</Badge>
                        <Badge bg="primary" className="me-1">S: {totalQuantities.s}</Badge>
                        <Badge bg="primary" className="me-1">M: {totalQuantities.m}</Badge>
                        <Badge bg="primary" className="me-1">L: {totalQuantities.l}</Badge>
                        <Badge bg="primary" className="me-1">XL: {totalQuantities.xl}</Badge>
                        <Badge bg="success" className="ms-2">Total: {totalQuantities.total}</Badge>
                      </div>
                      <div className="d-flex align-items-center">
                        <strong className="me-2">Total Yard Usage:</strong>
                        <Badge bg="info">{totalQuantities.yard_usage.toFixed(2)} yards</Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              <div className="d-flex justify-content-center mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="px-5"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Cutting Record'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default AddCuttingRecord;
