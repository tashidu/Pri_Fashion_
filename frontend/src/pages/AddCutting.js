import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Card, Form, Button, Row, Col, Spinner, Alert, Container, Badge, Modal } from 'react-bootstrap';
import { BsScissors, BsPlus, BsTrash, BsCheck2Circle, BsExclamationTriangle, BsFilePdf } from 'react-icons/bs';
import jsPDF from 'jspdf';

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
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

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
      const response = await axios.post("http://localhost:8000/api/cutting/cutting-records/", payload);
      setSuccess('Cutting record created successfully!');

      // Store the submitted record for PDF generation
      const recordData = {
        ...response.data,
        fabric_name: fabricDefinitions.find(fd => fd.id === parseInt(selectedFabricDefinition))?.fabric_name || 'Unknown Fabric',
        details: response.data.details.map(detail => {
          const variant = fabricVariants.find(v => v.id === detail.fabric_variant);
          return {
            ...detail,
            color: variant?.color || 'Unknown',
            color_name: variant?.color_name || variant?.color || 'Unknown'
          };
        }),
        totalQuantities: totalQuantities
      };

      setSubmittedRecord(recordData);

      // Show the PDF generation modal
      setShowPdfModal(true);
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

  // Function to generate PDF directly without using html2canvas
  const generatePDF = () => {
    if (!submittedRecord) return;

    try {
      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font sizes and styles
      const titleFontSize = 18;
      const headingFontSize = 14;
      const normalFontSize = 10;
      const smallFontSize = 8;

      // Add title
      pdf.setFontSize(titleFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cutting Record', 105, 20, { align: 'center' });

      // Add general information section
      pdf.setFontSize(headingFontSize);
      pdf.text('General Information', 20, 35);

      pdf.setFontSize(normalFontSize);
      pdf.setFont('helvetica', 'normal');

      // Draw table for general info
      pdf.line(20, 40, 190, 40); // Top horizontal line

      const generalInfoData = [
        ['Record ID', submittedRecord.id.toString()],
        ['Product Name', submittedRecord.product_name],
        ['Fabric', submittedRecord.fabric_name],
        ['Cutting Date', new Date(submittedRecord.cutting_date).toLocaleDateString()],
        ['Description', submittedRecord.description || 'N/A']
      ];

      let yPos = 45;
      generalInfoData.forEach((row, index) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(row[0], 25, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(row[1], 80, yPos);
        yPos += 8;
        pdf.line(20, yPos - 3, 190, yPos - 3); // Horizontal line after each row
      });

      // Add fabric details section
      pdf.setFontSize(headingFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Fabric Details', 20, yPos + 10);

      // Table headers for fabric details
      const headers = ['Color', 'Yard Usage', 'XS', 'S', 'M', 'L', 'XL', 'Total'];
      const colWidths = [50, 25, 15, 15, 15, 15, 15, 20];

      // Calculate starting positions for each column
      const colPositions = [];
      let currentPos = 20;
      colWidths.forEach(width => {
        colPositions.push(currentPos);
        currentPos += width;
      });

      // Draw table header
      yPos += 15;
      pdf.setFontSize(normalFontSize);
      pdf.setFont('helvetica', 'bold');

      // Draw header background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPos - 5, 170, 8, 'F');

      // Draw header text
      headers.forEach((header, index) => {
        pdf.text(header, colPositions[index] + 2, yPos);
      });

      // Draw horizontal line after header
      yPos += 3;
      pdf.line(20, yPos, 190, yPos);

      // Draw table rows
      pdf.setFont('helvetica', 'normal');
      submittedRecord.details.forEach((detail, index) => {
        yPos += 8;

        // Calculate total for this row
        const total = parseInt(detail.xs || 0) +
                      parseInt(detail.s || 0) +
                      parseInt(detail.m || 0) +
                      parseInt(detail.l || 0) +
                      parseInt(detail.xl || 0);

        // Draw row data
        pdf.text(detail.color_name || detail.color, colPositions[0] + 2, yPos);
        pdf.text(`${detail.yard_usage} yards`, colPositions[1] + 2, yPos);
        pdf.text(detail.xs?.toString() || '0', colPositions[2] + 2, yPos);
        pdf.text(detail.s?.toString() || '0', colPositions[3] + 2, yPos);
        pdf.text(detail.m?.toString() || '0', colPositions[4] + 2, yPos);
        pdf.text(detail.l?.toString() || '0', colPositions[5] + 2, yPos);
        pdf.text(detail.xl?.toString() || '0', colPositions[6] + 2, yPos);
        pdf.text(total.toString(), colPositions[7] + 2, yPos);

        // Draw horizontal line after row
        yPos += 3;
        pdf.line(20, yPos, 190, yPos);
      });

      // Draw totals row
      yPos += 8;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPos - 5, 170, 8, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.text('Total', colPositions[0] + 2, yPos);
      pdf.text(`${submittedRecord.totalQuantities.yard_usage.toFixed(2)} yards`, colPositions[1] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.xs.toString(), colPositions[2] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.s.toString(), colPositions[3] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.m.toString(), colPositions[4] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.l.toString(), colPositions[5] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.xl.toString(), colPositions[6] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.total.toString(), colPositions[7] + 2, yPos);

      // Add footer
      pdf.setFontSize(smallFontSize);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      pdf.text('Fashion Garment Management System', 105, 285, { align: 'center' });

      // Save the PDF
      pdf.save(`Cutting_Record_${submittedRecord.id}_${submittedRecord.product_name}.pdf`);

      // Reset form after PDF generation
      setShowPdfModal(false);
      setSelectedFabricDefinition('');
      setCuttingDate('');
      setDescription('');
      setProductName('');
      setDetails([{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
      setValidated(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF. Please try again.');
      setShowPdfModal(false);
    }
  };

  // Function to handle modal close without generating PDF
  const handleCloseModal = () => {
    setShowPdfModal(false);
    // Reset form
    setSelectedFabricDefinition('');
    setCuttingDate('');
    setDescription('');
    setProductName('');
    setDetails([{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
    setValidated(false);
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

      {/* PDF Generation Modal */}
      <Modal show={showPdfModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Generate Cutting Record PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Would you like to generate a PDF for this cutting record?</p>

          {submittedRecord && (
            <div className="mb-3">
              <p>The PDF will include the following information:</p>
              <ul>
                <li><strong>Product Name:</strong> {submittedRecord.product_name}</li>
                <li><strong>Fabric:</strong> {submittedRecord.fabric_name}</li>
                <li><strong>Cutting Date:</strong> {new Date(submittedRecord.cutting_date).toLocaleDateString()}</li>
                <li><strong>Total Quantities:</strong> XS: {submittedRecord.totalQuantities.xs},
                  S: {submittedRecord.totalQuantities.s},
                  M: {submittedRecord.totalQuantities.m},
                  L: {submittedRecord.totalQuantities.l},
                  XL: {submittedRecord.totalQuantities.xl}</li>
                <li><strong>Total Items:</strong> {submittedRecord.totalQuantities.total}</li>
                <li><strong>Total Yard Usage:</strong> {submittedRecord.totalQuantities.yard_usage.toFixed(2)} yards</li>
              </ul>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            No, Skip
          </Button>
          <Button variant="primary" onClick={generatePDF}>
            <BsFilePdf className="me-2" /> Generate PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddCuttingRecord;
