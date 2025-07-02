import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Card, Form, Button, Row, Col, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { BsScissors, BsPlus, BsTrash, BsCheck2Circle, BsExclamationTriangle, BsFilePdf } from 'react-icons/bs';
import jsPDF from 'jspdf';

const AddCuttingRecord = () => {
  // Overall cutting record fields
  const [fabricDefinitions, setFabricDefinitions] = useState([]);
  const [allFabricVariants, setAllFabricVariants] = useState([]);
  const [cuttingDate, setCuttingDate] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');

  // Fabric definition groups - each group has a fabric definition and its variants
  const [fabricGroups, setFabricGroups] = useState([
    {
      id: Date.now(),
      fabric_definition: '',
      variants: [{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]
    }
  ]);

  // Loading, error, success states
  const [loadingVariants, setLoadingVariants] = useState(true);
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

  // Fetch fabric definitions and variants on mount
  useEffect(() => {
    setLoadingVariants(true);

    // Fetch fabric definitions
    const fetchDefinitions = axios.get("http://localhost:8000/api/fabric-definitions/");
    // Fetch all fabric variants
    const fetchVariants = axios.get("http://localhost:8000/api/fabric-variants/");

    Promise.all([fetchDefinitions, fetchVariants])
      .then(([definitionsRes, variantsRes]) => {
        setFabricDefinitions(definitionsRes.data);
        setAllFabricVariants(variantsRes.data);
        setLoadingVariants(false);
      })
      .catch((err) => {
        console.error('Error fetching fabric data:', err);
        setError('Failed to load fabric data. Please try again.');
        setLoadingVariants(false);
      });
  }, []);

  // Add a new fabric definition group
  const addFabricGroup = () => {
    setFabricGroups([...fabricGroups, {
      id: Date.now(),
      fabric_definition: '',
      variants: [{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]
    }]);
  };

  // Remove a fabric definition group
  const removeFabricGroup = (groupIndex) => {
    if (fabricGroups.length > 1) {
      const newGroups = fabricGroups.filter((_, i) => i !== groupIndex);
      setFabricGroups(newGroups);
    }
  };

  // Add a new variant row to a specific fabric group
  const addVariantToGroup = (groupIndex) => {
    const newGroups = [...fabricGroups];
    newGroups[groupIndex].variants.push({ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 });
    setFabricGroups(newGroups);
  };

  // Remove a variant from a specific fabric group
  const removeVariantFromGroup = (groupIndex, variantIndex) => {
    const newGroups = [...fabricGroups];
    if (newGroups[groupIndex].variants.length > 1) {
      newGroups[groupIndex].variants = newGroups[groupIndex].variants.filter((_, i) => i !== variantIndex);
      setFabricGroups(newGroups);
    }
  };

  // Handle fabric definition change for a group
  const handleFabricDefinitionChange = (groupIndex, fabricDefinitionId) => {
    const newGroups = [...fabricGroups];
    newGroups[groupIndex].fabric_definition = fabricDefinitionId;
    // Reset variants when fabric definition changes
    newGroups[groupIndex].variants = [{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }];
    setFabricGroups(newGroups);
  };

  // Handle variant field change
  const handleVariantChange = (groupIndex, variantIndex, field, value) => {
    const newGroups = [...fabricGroups];

    // If changing fabric variant, check for duplicates within the same group
    if (field === 'fabric_variant') {
      if (isDuplicateFabricVariant(groupIndex, value, variantIndex)) {
        setError(`This fabric variant is already selected in this fabric group. Please select a different variant.`);
        return;
      } else {
        setError('');
      }
    }

    newGroups[groupIndex].variants[variantIndex][field] = value;
    setFabricGroups(newGroups);
  };

  // Check if a fabric variant is already selected in the same group
  const isDuplicateFabricVariant = (groupIndex, variantId, currentVariantIndex) => {
    return fabricGroups[groupIndex].variants.some((variant, idx) =>
      idx !== currentVariantIndex && variant.fabric_variant === variantId && variantId !== ''
    );
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

    // Check if any fabric group has valid data
    const hasValidGroups = fabricGroups.some(group =>
      group.fabric_definition && group.variants.some(variant => variant.fabric_variant)
    );
    if (!hasValidGroups) {
      setError('Please select at least one fabric definition and one fabric variant.');
      return;
    }

    // Validate each fabric group
    let validationError = false;
    for (let groupIndex = 0; groupIndex < fabricGroups.length; groupIndex++) {
      const group = fabricGroups[groupIndex];

      if (group.fabric_definition && group.variants.some(variant => variant.fabric_variant)) {
        // Check for duplicates within the group
        const selectedVariants = group.variants.map(variant => variant.fabric_variant).filter(Boolean);
        const uniqueVariants = [...new Set(selectedVariants)];
        if (selectedVariants.length !== uniqueVariants.length) {
          setError(`Duplicate fabric variants detected in fabric group ${groupIndex + 1}. Please ensure each variant is selected only once per group.`);
          validationError = true;
          break;
        }

        // Validate yard availability for each variant
        for (let variant of group.variants) {
          if (variant.fabric_variant) {
            const variantData = allFabricVariants.find(v => v.id === variant.fabric_variant);
            if (variantData && parseFloat(variant.yard_usage) > (variantData.available_yard || variantData.total_yard)) {
              setError(`Yard usage for ${variantData.color_name || variantData.color} exceeds available yards (${variantData.available_yard || variantData.total_yard} yards available).`);
              validationError = true;
              break;
            }
          }
        }
      }
    }

    if (validationError) {
      setValidated(true);
      return;
    }

    setValidated(true);
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Flatten fabric groups into details array
    const details = [];
    fabricGroups.forEach(group => {
      if (group.fabric_definition) {
        group.variants.forEach(variant => {
          if (variant.fabric_variant) {
            details.push(variant);
          }
        });
      }
    });

    const payload = {
      cutting_date: cuttingDate,
      description: description,
      product_name: productName,
      details: details
    };

    try {
      const response = await axios.post("http://localhost:8000/api/cutting/cutting-records/", payload);
      setSuccess('Cutting record created successfully!');

      // Store the submitted record for PDF generation
      const fabricNames = new Set();
      const recordData = {
        ...response.data,
        details: response.data.details.map(detail => {
          const variant = allFabricVariants.find(v => v.id === detail.fabric_variant);
          if (variant?.fabric_definition_data?.fabric_name) {
            fabricNames.add(variant.fabric_definition_data.fabric_name);
          }
          return {
            ...detail,
            color: variant?.color || 'Unknown',
            color_name: variant?.color_name || variant?.color || 'Unknown',
            fabric_name: variant?.fabric_definition_data?.fabric_name || 'Unknown'
          };
        }),
        fabric_names: Array.from(fabricNames).join(', ') || 'Unknown',
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
        ['Fabrics Used', submittedRecord.fabric_names],
        ['Cutting Date', new Date(submittedRecord.cutting_date).toLocaleDateString()],
        ['Description', submittedRecord.description || 'N/A']
      ];

      let yPos = 45;
      generalInfoData.forEach((row) => {
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
      const headers = ['Fabric', 'Color', 'Yard Usage', 'XS', 'S', 'M', 'L', 'XL', 'Total'];
      const colWidths = [35, 35, 20, 12, 12, 12, 12, 12, 15];

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
      submittedRecord.details.forEach((detail) => {
        yPos += 8;

        // Calculate total for this row
        const total = parseInt(detail.xs || 0) +
                      parseInt(detail.s || 0) +
                      parseInt(detail.m || 0) +
                      parseInt(detail.l || 0) +
                      parseInt(detail.xl || 0);

        // Draw row data
        pdf.text(detail.fabric_name || 'Unknown', colPositions[0] + 2, yPos);
        pdf.text(detail.color_name || detail.color, colPositions[1] + 2, yPos);
        pdf.text(`${detail.yard_usage} yards`, colPositions[2] + 2, yPos);
        pdf.text(detail.xs?.toString() || '0', colPositions[3] + 2, yPos);
        pdf.text(detail.s?.toString() || '0', colPositions[4] + 2, yPos);
        pdf.text(detail.m?.toString() || '0', colPositions[5] + 2, yPos);
        pdf.text(detail.l?.toString() || '0', colPositions[6] + 2, yPos);
        pdf.text(detail.xl?.toString() || '0', colPositions[7] + 2, yPos);
        pdf.text(total.toString(), colPositions[8] + 2, yPos);

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
      pdf.text('', colPositions[1] + 2, yPos);
      pdf.text(`${submittedRecord.totalQuantities.yard_usage.toFixed(2)} yards`, colPositions[2] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.xs.toString(), colPositions[3] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.s.toString(), colPositions[4] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.m.toString(), colPositions[5] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.l.toString(), colPositions[6] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.xl.toString(), colPositions[7] + 2, yPos);
      pdf.text(submittedRecord.totalQuantities.total.toString(), colPositions[8] + 2, yPos);

      // Add footer
      pdf.setFontSize(smallFontSize);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      pdf.text('Fashion Garment Management System', 105, 285, { align: 'center' });

      // Save the PDF
      pdf.save(`Cutting_Record_${submittedRecord.id}_${submittedRecord.product_name}.pdf`);

      // Reset form after PDF generation
      setShowPdfModal(false);
      setCuttingDate('');
      setDescription('');
      setProductName('');
      setFabricGroups([{
        id: Date.now(),
        fabric_definition: '',
        variants: [{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]
      }]);
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
    setCuttingDate('');
    setDescription('');
    setProductName('');
    setFabricGroups([{
      id: Date.now(),
      fabric_definition: '',
      variants: [{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]
    }]);
    setValidated(false);
  };



  // Calculate total quantities for all fabric groups
  const totalQuantities = fabricGroups.reduce((acc, group) => {
    group.variants.forEach(variant => {
      if (variant.fabric_variant) {
        acc.xs += parseInt(variant.xs) || 0;
        acc.s += parseInt(variant.s) || 0;
        acc.m += parseInt(variant.m) || 0;
        acc.l += parseInt(variant.l) || 0;
        acc.xl += parseInt(variant.xl) || 0;
        acc.total += (parseInt(variant.xs) || 0) +
                    (parseInt(variant.s) || 0) +
                    (parseInt(variant.m) || 0) +
                    (parseInt(variant.l) || 0) +
                    (parseInt(variant.xl) || 0);
        acc.yard_usage += parseFloat(variant.yard_usage) || 0;
      }
    });
    return acc;
  }, { xs: 0, s: 0, m: 0, l: 0, xl: 0, total: 0, yard_usage: 0 });

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
                  onClick={addFabricGroup}
                  disabled={isSubmitting}
                >
                  <BsPlus className="me-1" /> Add Fabric Definition
                </Button>
              </div>

              {fabricGroups.map((group, groupIndex) => {
                // Get fabric variants for the selected fabric definition
                const groupVariants = group.fabric_definition
                  ? allFabricVariants.filter(v => v.fabric_definition === parseInt(group.fabric_definition))
                  : [];

                return (
                  <Card key={group.id} className="mb-4 border">
                    <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
                      <h5 className="mb-0">Fabric Definition #{groupIndex + 1}</h5>
                      <Button
                        variant="outline-light"
                        size="sm"
                        onClick={() => removeFabricGroup(groupIndex)}
                        disabled={fabricGroups.length === 1}
                      >
                        <BsTrash className="me-1" /> Remove
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      {/* Fabric Definition Selection */}
                      <Row className="mb-3">
                        <Col md={12}>
                          <Form.Group>
                            <Form.Label><strong>Select Fabric Definition</strong></Form.Label>
                            {loadingVariants ? (
                              <div className="d-flex align-items-center">
                                <Spinner animation="border" size="sm" className="me-2" />
                                <span>Loading fabric definitions...</span>
                              </div>
                            ) : (
                              <Form.Select
                                value={group.fabric_definition}
                                onChange={(e) => handleFabricDefinitionChange(groupIndex, e.target.value)}
                                required
                              >
                                <option value="">Select Fabric Definition</option>
                                {fabricDefinitions.map((fd) => (
                                  <option key={fd.id} value={fd.id}>
                                    {fd.fabric_name} - {fd.supplier_name || 'Unknown Supplier'}
                                  </option>
                                ))}
                              </Form.Select>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Fabric Variants Section */}
                      {group.fabric_definition && (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Fabric Variants</h6>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => addVariantToGroup(groupIndex)}
                              disabled={isSubmitting}
                            >
                              <BsPlus className="me-1" /> Add Variant
                            </Button>
                          </div>

                          {group.variants.map((variant, variantIndex) => {
                            const currentVariant = allFabricVariants.find(v => v.id === variant.fabric_variant);

                            return (
                              <Card key={variantIndex} className="mb-3 border-light">
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="d-flex align-items-center">
                                      <h6 className="mb-0 me-2">Variant #{variantIndex + 1}</h6>
                                      {currentVariant && (
                                        <div className="d-flex align-items-center">
                                          <div
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              backgroundColor: currentVariant.color,
                                              border: '1px solid #ccc',
                                              borderRadius: '3px',
                                              marginRight: '6px'
                                            }}
                                            title={`Color: ${currentVariant.color}`}
                                          />
                                          <small className="text-muted">
                                            {currentVariant.color_name || currentVariant.color}
                                          </small>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeVariantFromGroup(groupIndex, variantIndex)}
                                      disabled={group.variants.length === 1}
                                    >
                                      <BsTrash className="me-1" /> Remove
                                    </Button>
                                  </div>

                                  <Row>
                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label><strong>Fabric Variant (Color)</strong></Form.Label>
                                        <div className="position-relative">
                                          <Form.Select
                                            value={variant.fabric_variant}
                                            onChange={(e) => handleVariantChange(groupIndex, variantIndex, 'fabric_variant', e.target.value)}
                                            required
                                          >
                                            <option value="">Select Color Variant</option>
                                            {groupVariants.map((gv) => {
                                              const isAlreadySelected = isDuplicateFabricVariant(groupIndex, gv.id, variantIndex);
                                              return (
                                                <option
                                                  key={gv.id}
                                                  value={gv.id}
                                                  disabled={isAlreadySelected}
                                                >
                                                  {gv.color_name || gv.color} - {gv.available_yard} yards available
                                                  {isAlreadySelected ? ' (Already Selected)' : ''}
                                                </option>
                                              );
                                            })}
                                          </Form.Select>
                                          {currentVariant && (
                                            <div
                                              className="position-absolute"
                                              style={{
                                                right: '35px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '20px',
                                                height: '20px',
                                                backgroundColor: currentVariant.color,
                                                border: '1px solid #ccc',
                                                borderRadius: '3px',
                                                pointerEvents: 'none'
                                              }}
                                              title={`Color: ${currentVariant.color}`}
                                            />
                                          )}
                                        </div>
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <Form.Label className="mb-0"><strong>Yard Usage</strong></Form.Label>
                                          {currentVariant && (
                                            <div className="d-flex align-items-center">
                                              <div
                                                style={{
                                                  width: '16px',
                                                  height: '16px',
                                                  backgroundColor: currentVariant.color,
                                                  border: '1px solid #ccc',
                                                  borderRadius: '3px',
                                                  marginRight: '8px'
                                                }}
                                                title={`Color: ${currentVariant.color_name || currentVariant.color}`}
                                              />
                                              <span className={parseFloat(variant.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard) ? "text-danger small" : "text-success small"}>
                                                {currentVariant.color_name || currentVariant.color} - Available: {currentVariant.available_yard || currentVariant.total_yard} yards
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <Form.Control
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={variant.yard_usage}
                                          onChange={(e) => handleVariantChange(groupIndex, variantIndex, 'yard_usage', e.target.value)}
                                          required
                                          placeholder="Enter yards used"
                                          isInvalid={currentVariant && parseFloat(variant.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard)}
                                          className={currentVariant && parseFloat(variant.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard) ? "border-danger" : ""}
                                          style={{ height: '38px' }}
                                        />
                                        <Form.Control.Feedback type="invalid">
                                          {currentVariant && parseFloat(variant.yard_usage) > (currentVariant.available_yard || currentVariant.total_yard)
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
                                              value={variant[sizeKey]}
                                              onChange={(e) => {
                                                const val = Math.max(0, parseInt(e.target.value || 0));
                                                handleVariantChange(groupIndex, variantIndex, sizeKey, val);
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
                                          {parseInt(variant.xs || 0) +
                                           parseInt(variant.s || 0) +
                                           parseInt(variant.m || 0) +
                                           parseInt(variant.l || 0) +
                                           parseInt(variant.xl || 0)}
                                        </div>
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                </Card.Body>
                              </Card>
                            );
                          })}
                        </>
                      )}
                    </Card.Body>
                  </Card>
                );
              })}

              <div className="d-flex justify-content-end mb-4">
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
