import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Card, Form, Button, Row, Col, Spinner, Alert, Container, Badge, Modal } from 'react-bootstrap';
import { BsScissors, BsPlus, BsTrash, BsCheck2Circle, BsExclamationTriangle, BsArrowLeft } from 'react-icons/bs';

const EditCutting = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Overall cutting record fields
  const [allFabricVariants, setAllFabricVariants] = useState([]);
  const [cuttingDate, setCuttingDate] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');

  // Cutting detail rows
  const [details, setDetails] = useState([
    { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }
  ]);

  // Original yard usage for each variant (to calculate available yards)
  const [originalYardUsage, setOriginalYardUsage] = useState({});

  // Validation errors for each detail row
  const [detailErrors, setDetailErrors] = useState([]);

  // Loading, error, success states
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [loadingRecord, setLoadingRecord] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [validated, setValidated] = useState(false);
  const [originalRecord, setOriginalRecord] = useState(null);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Fetch the cutting record to edit
  useEffect(() => {
    setLoadingRecord(true);
    console.log(`Fetching cutting record with ID: ${id}`);

    axios.get(`http://localhost:8000/api/cutting/cutting-records/${id}/`)
      .then((res) => {
        const record = res.data;
        console.log('Cutting record fetched successfully:', record);
        setOriginalRecord(record);

        // Set form fields with record data
        setCuttingDate(record.cutting_date);
        setDescription(record.description || '');
        setProductName(record.product_name || '');

        // Set details and store original yard usage
        if (record.details && record.details.length > 0) {
          console.log('Setting details from record:', record.details);

          // Create a map of original yard usage by variant ID
          const yardUsageMap = {};
          record.details.forEach(detail => {
            yardUsageMap[detail.fabric_variant] = parseFloat(detail.yard_usage);
          });
          console.log('Original yard usage map:', yardUsageMap);
          setOriginalYardUsage(yardUsageMap);

          // Initialize detail errors array with empty strings
          setDetailErrors(Array(record.details.length).fill(''));

          // Set details
          setDetails(record.details.map(detail => ({
            id: detail.id, // Keep the original ID for updating
            fabric_variant: detail.fabric_variant,
            yard_usage: detail.yard_usage,
            xs: detail.xs || 0,
            s: detail.s || 0,
            m: detail.m || 0,
            l: detail.l || 0,
            xl: detail.xl || 0
          })));
        }

        setLoadingRecord(false);
      })
      .catch((err) => {
        console.error('Error fetching cutting record:', err);
        setError('Failed to load cutting record. Please try again.');
        setLoadingRecord(false);
      });
  }, [id]);

  // 2. Fetch all fabric variants on mount
  useEffect(() => {
    setLoadingVariants(true);
    axios.get("http://localhost:8000/api/fabric-variants/")
      .then((res) => {
        console.log('Fabric variants fetched successfully:', res.data);
        setAllFabricVariants(res.data);
        setLoadingVariants(false);
      })
      .catch((err) => {
        console.error('Error fetching fabric variants:', err);
        setError('Failed to load fabric variants. Please try again.');
        setLoadingVariants(false);
      });
  }, []);



  // 3. Validate yard usage when variants or details change
  useEffect(() => {
    if (allFabricVariants.length > 0 && details.length > 0) {
      // Create a new array for detail errors
      const newDetailErrors = [...detailErrors];

      // Validate each detail
      details.forEach((detail, index) => {
        if (detail.fabric_variant && detail.yard_usage) {
          const variantId = detail.fabric_variant;

          // Find the variant in the allFabricVariants array
          const variant = allFabricVariants.find(v => v.id === parseInt(variantId));
          if (!variant) return;

          // Get the original yard usage for this variant (or 0 if it's a new detail)
          const original = originalYardUsage[variantId] || 0;

          // Calculate the maximum allowed yard usage
          const maxAllowed = parseFloat(variant.available_yard) + original;

          // Check if the yard usage exceeds the maximum allowed
          if (parseFloat(detail.yard_usage) > maxAllowed) {
            newDetailErrors[index] = `Exceeds available yards. Maximum allowed: ${maxAllowed.toFixed(2)} yards`;
          } else if (parseFloat(detail.yard_usage) <= 0) {
            newDetailErrors[index] = 'Yard usage must be greater than 0';
          } else {
            newDetailErrors[index] = '';
          }
        }
      });

      // Update detail errors state
      setDetailErrors(newDetailErrors);
    }
  }, [allFabricVariants, details, originalYardUsage]);

  // Add a new empty detail row
  const addDetailRow = () => {
    setDetails([...details, { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
    setDetailErrors([...detailErrors, '']); // Add an empty error for the new row
  };

  // Delete a detail row
  const removeDetailRow = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);

    // Also remove the corresponding error
    const newDetailErrors = detailErrors.filter((_, i) => i !== index);
    setDetailErrors(newDetailErrors);
  };

  // Handle change for each detail row field
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);

    // Validate yard usage if that's the field being changed
    if (field === 'yard_usage') {
      validateYardUsage(index, value);
    }
  };

  // Validate yard usage against available yards
  const validateYardUsage = (index, newYardUsage) => {
    const newDetailErrors = [...detailErrors];
    const detail = details[index];
    const variantId = detail.fabric_variant;

    // Skip validation if no variant is selected
    if (!variantId) {
      newDetailErrors[index] = '';
      setDetailErrors(newDetailErrors);
      return;
    }

    // Find the variant in the allFabricVariants array
    const variant = allFabricVariants.find(v => v.id === parseInt(variantId));
    if (!variant) {
      newDetailErrors[index] = '';
      setDetailErrors(newDetailErrors);
      return;
    }

    // Get the original yard usage for this variant (or 0 if it's a new detail)
    const original = originalYardUsage[variantId] || 0;

    // Calculate the maximum allowed yard usage
    // This is the current available yards plus the original yard usage
    const maxAllowed = parseFloat(variant.available_yard) + original;

    // Check if the new yard usage exceeds the maximum allowed
    if (parseFloat(newYardUsage) > maxAllowed) {
      newDetailErrors[index] = `Exceeds available yards. Maximum allowed: ${maxAllowed.toFixed(2)} yards`;
    } else if (parseFloat(newYardUsage) <= 0) {
      newDetailErrors[index] = 'Yard usage must be greater than 0';
    } else {
      newDetailErrors[index] = '';
    }

    setDetailErrors(newDetailErrors);
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

    // Validate all yard usage values
    let hasYardUsageErrors = false;
    details.forEach((detail, index) => {
      validateYardUsage(index, detail.yard_usage);
      if (detailErrors[index]) {
        hasYardUsageErrors = true;
      }
    });

    // Check if there are any yard usage validation errors
    if (hasYardUsageErrors) {
      setError('Please fix the yard usage errors before submitting.');
      return;
    }

    setValidated(true);
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      cutting_date: cuttingDate,
      description: description,
      product_name: productName,
      details: details
    };

    try {
      const response = await axios.put(`http://localhost:8000/api/cutting/cutting-records/${id}/`, payload);
      setSuccess('Cutting record updated successfully!');

      // Redirect back to the cutting records list after a short delay
      setTimeout(() => {
        navigate('/viewcutting');
      }, 2000);
    } catch (err) {
      console.error('Error updating cutting record:', err);
      if (err.response && err.response.data) {
        // Display more specific error message if available
        const errorMessage = typeof err.response.data === 'string'
          ? err.response.data
          : 'Failed to update cutting record. Please check your inputs.';
        setError(errorMessage);
      } else {
        setError('Failed to update cutting record. Please try again.');
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

  if (loadingRecord) {
    return (
      <>
        <RoleBasedNavBar />
        <Container fluid
          style={{
            marginLeft: isSidebarOpen ? "240px" : "70px",
            width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
            transition: "all 0.3s ease",
            padding: "20px"
          }}
        >
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading cutting record...</p>
          </div>
        </Container>
      </>
    );
  }

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
        <div className="d-flex align-items-center mb-4">
          <Button
            variant="outline-secondary"
            className="me-3"
            onClick={() => navigate('/viewcutting')}
          >
            <BsArrowLeft className="me-1" /> Back
          </Button>
          <h2 className="mb-0">
            <BsScissors className="me-2" />
            Edit Cutting Record
          </h2>
        </div>

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

              <div className="d-flex justify-content-between align-items-center mt-4 mb-3 border-bottom pb-2">
                <h4 className="mb-0">Fabric Details</h4>
                <Button
                  variant="success"
                  size="sm"
                  onClick={addDetailRow}
                  disabled={isSubmitting}
                >
                  <BsPlus className="me-1" /> Add Fabric Variant
                </Button>
              </div>

              {details.map((detail, index) => {
                // Find the selected variant object to set the value in React-Select
                const currentVariant = allFabricVariants.find(v => v.id === detail.fabric_variant);

                return (
                  <Card key={index} className="mb-3 border-light">
                    <Card.Body>
                      <Row className="align-items-end">
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label><strong>Fabric Variant (Color)</strong></Form.Label>
                            {loadingVariants ? (
                              <div className="d-flex align-items-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>Loading variants...</span>
                              </div>
                            ) : allFabricVariants.length === 0 ? (
                              <div>
                                <Form.Select disabled>
                                  <option>No variants available</option>
                                </Form.Select>
                                <small className="text-danger">
                                  No fabric variants found.
                                </small>
                              </div>
                            ) : (
                              <Form.Select
                                value={detail.fabric_variant}
                                onChange={(e) => handleDetailChange(index, 'fabric_variant', e.target.value)}
                                required
                                disabled={isSubmitting}
                              >
                                <option value="">Select Fabric Variant</option>
                                {allFabricVariants.map((variant) => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.fabric_definition_data?.fabric_name || 'Unknown'} - {variant.color_name || variant.color} - {variant.available_yard} yards available
                                  </option>
                                ))}
                              </Form.Select>
                            )}
                            <Form.Control.Feedback type="invalid">
                              Please select a fabric variant.
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={2}>
                          <Form.Group className="mb-3">
                            <Form.Label><strong>Yard Usage</strong></Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={detail.yard_usage}
                              onChange={(e) => handleDetailChange(index, 'yard_usage', e.target.value)}
                              required
                              disabled={isSubmitting}
                              isInvalid={!!detailErrors[index]}
                              className={detailErrors[index] ? 'border-danger' : ''}
                            />
                            <Form.Control.Feedback type="invalid">
                              {detailErrors[index] || 'Please enter valid yard usage.'}
                            </Form.Control.Feedback>
                            {currentVariant && (
                              <small className="text-muted">
                                Available: {parseFloat(currentVariant.available_yard) + (originalYardUsage[detail.fabric_variant] || 0)} yards
                                (Original: {originalYardUsage[detail.fabric_variant] || 0} yards + Current: {currentVariant.available_yard} yards)
                              </small>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={5}>
                          <Row>
                            <Col>
                              <Form.Group className="mb-3">
                                <Form.Label><strong>XS</strong></Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={detail.xs}
                                  onChange={(e) => handleDetailChange(index, 'xs', e.target.value)}
                                  disabled={isSubmitting}
                                />
                              </Form.Group>
                            </Col>
                            <Col>
                              <Form.Group className="mb-3">
                                <Form.Label><strong>S</strong></Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={detail.s}
                                  onChange={(e) => handleDetailChange(index, 's', e.target.value)}
                                  disabled={isSubmitting}
                                />
                              </Form.Group>
                            </Col>
                            <Col>
                              <Form.Group className="mb-3">
                                <Form.Label><strong>M</strong></Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={detail.m}
                                  onChange={(e) => handleDetailChange(index, 'm', e.target.value)}
                                  disabled={isSubmitting}
                                />
                              </Form.Group>
                            </Col>
                            <Col>
                              <Form.Group className="mb-3">
                                <Form.Label><strong>L</strong></Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={detail.l}
                                  onChange={(e) => handleDetailChange(index, 'l', e.target.value)}
                                  disabled={isSubmitting}
                                />
                              </Form.Group>
                            </Col>
                            <Col>
                              <Form.Group className="mb-3">
                                <Form.Label><strong>XL</strong></Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  value={detail.xl}
                                  onChange={(e) => handleDetailChange(index, 'xl', e.target.value)}
                                  disabled={isSubmitting}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Col>
                        <Col md={1} className="d-flex align-items-center justify-content-end">
                          <Button
                            variant="outline-danger"
                            onClick={() => removeDetailRow(index)}
                            disabled={details.length === 1 || isSubmitting}
                            className="mt-2"
                          >
                            <BsTrash />
                          </Button>
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
                  disabled={isSubmitting}
                >
                  <BsPlus className="me-1" /> Add Another Variant
                </Button>
                <div>
                  <Badge bg="info" className="me-2 p-2">
                    Total Pieces: {totalQuantities.total}
                  </Badge>
                  <Badge bg="warning" text="dark" className="p-2">
                    Total Yard Usage: {totalQuantities.yard_usage.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  className="me-2"
                  onClick={() => navigate('/viewcutting')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Cutting Record'
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

export default EditCutting;
