import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import {
  Container, Row, Col, Card, Table, Badge, Spinner,
  Alert, Button, ListGroup, Modal
} from 'react-bootstrap';
import {
  FaArrowLeft, FaCalendarAlt, FaCut, FaTshirt,
  FaInfoCircle, FaRulerHorizontal, FaClipboardList,
  FaMoneyBillWave, FaDownload, FaFilePdf, FaCheck, FaTimes
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CuttingRecordDetail = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [cuttingRecord, setCuttingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [returnPath, setReturnPath] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get the return path from localStorage if available
  useEffect(() => {
    const savedReturnPath = localStorage.getItem('cuttingRecordReturnPath');
    if (savedReturnPath) {
      setReturnPath(savedReturnPath);
    } else {
      // Default to the cutting records list
      setReturnPath('/viewcutting');
    }

    // Clean up the localStorage when component unmounts
    return () => {
      localStorage.removeItem('cuttingRecordReturnPath');
    };
  }, []);

  // Fetch cutting record data
  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8000/api/cutting/records/${recordId}/`)
      .then((response) => {
        setCuttingRecord(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching cutting record details:", error);
        setError("Failed to load cutting record details.");
        setLoading(false);
      });
  }, [recordId]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total pieces for a detail
  const calculateTotalPieces = (detail) => {
    return detail.xs + detail.s + detail.m + detail.l + detail.xl;
  };

  // Calculate total pieces for all details
  const calculateTotalAllPieces = () => {
    if (!cuttingRecord || !cuttingRecord.details) return 0;
    return cuttingRecord.details.reduce((total, detail) => {
      return total + calculateTotalPieces(detail);
    }, 0);
  };

  // Calculate total yard usage
  const calculateTotalYardUsage = () => {
    if (!cuttingRecord || !cuttingRecord.details) return 0;
    return cuttingRecord.details.reduce((total, detail) => {
      return total + parseFloat(detail.yard_usage);
    }, 0).toFixed(2);
  };

  // Calculate fabric cutting value (cost)
  const calculateCuttingValue = (detail) => {
    if (!detail || !detail.fabric_variant_data) return 0;
    const yardUsage = parseFloat(detail.yard_usage);
    const pricePerYard = parseFloat(detail.fabric_variant_data.price_per_yard);
    return (yardUsage * pricePerYard).toFixed(2);
  };

  // Calculate total cutting value
  const calculateTotalCuttingValue = () => {
    if (!cuttingRecord || !cuttingRecord.details) return 0;
    return cuttingRecord.details.reduce((total, detail) => {
      if (!detail.fabric_variant_data) return total;
      const value = parseFloat(detail.yard_usage) * parseFloat(detail.fabric_variant_data.price_per_yard);
      return total + value;
    }, 0).toFixed(2);
  };

  // Handle back button click
  const handleBack = () => {
    navigate(returnPath);
  };

  // Open PDF confirmation modal
  const openPdfModal = () => {
    setShowPdfModal(true);
  };

  // Close PDF confirmation modal
  const closePdfModal = () => {
    setShowPdfModal(false);
  };

  // Generate PDF report
  const generatePDF = () => {
    if (!cuttingRecord) return;

    try {
      const productName = cuttingRecord.product_name || "N/A";
      const fabricName = cuttingRecord.fabric_definition_data?.fabric_name || "N/A";

      // Create PDF document with orientation and unit specifications
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title and company info
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text("Cutting Record Report", 105, 15, { align: 'center' });

      doc.setFontSize(12);
      doc.text("Fashion Garment Management System", 105, 25, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

      // Add cutting record details
      doc.setFontSize(14);
      doc.text("Cutting Record Details", 14, 40);

      doc.setFontSize(10);
      const details = [
        ["Product Name:", productName],
        ["Fabric Name:", fabricName],
        ["Cutting Date:", cuttingRecord.cutting_date],
        ["Total Quantity:", calculateTotalAllPieces().toString()],
        ["Total Yard Usage:", calculateTotalYardUsage().toString()],
        ["Color Variants Used:", cuttingRecord.details?.length.toString() || "0"],
        ["Total Fabric Cost:", `Rs. ${calculateTotalCuttingValue()}`]
      ];

      // First table
      let finalY = 45;
      autoTable(doc, {
        startY: finalY,
        head: [["Property", "Value"]],
        body: details,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10 }
      });

      // Get the final Y position after the first table
      finalY = (doc.lastAutoTable || doc.previousAutoTable).finalY + 10;

      // Add color usage details
      doc.setFontSize(14);
      doc.text("Color Usage Details", 14, finalY);

      if (cuttingRecord.details && cuttingRecord.details.length > 0) {
        const colorDetails = cuttingRecord.details.map(detail => [
          detail.fabric_variant_data?.color_name || detail.fabric_variant_data?.color || "N/A",
          `${parseFloat(detail.yard_usage).toFixed(2)} yards`,
          `Rs. ${detail.fabric_variant_data?.price_per_yard.toFixed(2)}`,
          `Rs. ${calculateCuttingValue(detail)}`,
          detail.xs || 0,
          detail.s || 0,
          detail.m || 0,
          detail.l || 0,
          detail.xl || 0,
          calculateTotalPieces(detail)
        ]);

        // Second table
        autoTable(doc, {
          startY: finalY + 5,
          head: [["Color", "Yard Usage", "Price/Yard", "Fabric Cost", "XS", "S", "M", "L", "XL", "Total"]],
          body: colorDetails,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
          }
        });
      } else {
        doc.text("No color details available", 14, finalY + 5);
      }

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount} - Fashion Garment Management System`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF with a clean filename
      const cleanProductName = productName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Cutting_Record_${cuttingRecord.id}_${cleanProductName}.pdf`);

      // Close the modal
      closePdfModal();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again: " + error.message);
      closePdfModal();
    }
  };

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
        {/* Back button and PDF button */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <Button
            variant="outline-secondary"
            onClick={handleBack}
          >
            <FaArrowLeft className="me-2" /> Back
          </Button>
          {!loading && cuttingRecord && (
            <Button
              variant="outline-success"
              onClick={openPdfModal}
            >
              <FaDownload className="me-2" /> Download PDF
            </Button>
          )}
        </div>

        {error && <Alert variant="danger" className="text-center">{error}</Alert>}

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading cutting record details...</p>
          </div>
        ) : cuttingRecord && (
          <>
            {/* Cutting Record Header */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">
                  <FaCut className="me-2" />
                  Cutting Record Details
                </h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h5 className="mb-3">
                      {cuttingRecord.product_name || "Unnamed Cutting Record"}
                    </h5>
                    <p className="mb-2">
                      <strong>Fabric:</strong>{' '}
                      <span className="text-primary">
                        {cuttingRecord.fabric_definition_data?.fabric_name}
                      </span>
                    </p>
                    <p className="mb-2">
                      <strong>Cutting Date:</strong>{' '}
                      <span>
                        <FaCalendarAlt className="me-1 text-secondary" />
                        {formatDate(cuttingRecord.cutting_date)}
                      </span>
                    </p>
                    {cuttingRecord.description && (
                      <p className="mb-2">
                        <strong>Description:</strong>{' '}
                        <span>{cuttingRecord.description}</span>
                      </p>
                    )}
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 bg-light">
                      <Card.Body>
                        <h5 className="mb-3">Summary</h5>
                        <ListGroup variant="flush">
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaRulerHorizontal className="me-2 text-secondary" />
                              Total Yard Usage
                            </div>
                            <Badge bg="info" pill>
                              {calculateTotalYardUsage()} yards
                            </Badge>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaTshirt className="me-2 text-secondary" />
                              Total Pieces
                            </div>
                            <Badge bg="success" pill>
                              {calculateTotalAllPieces()} pcs
                            </Badge>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaClipboardList className="me-2 text-secondary" />
                              Color Variants Used
                            </div>
                            <Badge bg="primary" pill>
                              {cuttingRecord.details?.length || 0}
                            </Badge>
                          </ListGroup.Item>
                          <ListGroup.Item className="d-flex justify-content-between align-items-center">
                            <div>
                              <FaMoneyBillWave className="me-2 text-secondary" />
                              Total Fabric Cost
                            </div>
                            <Badge bg="warning" text="dark" pill>
                              Rs. {calculateTotalCuttingValue()}
                            </Badge>
                          </ListGroup.Item>
                        </ListGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Cutting Details Table */}
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h4 className="mb-0">
                  <FaInfoCircle className="me-2" />
                  Cutting Details
                </h4>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Color</th>
                      <th>Yard Usage</th>
                      <th>Price per Yard</th>
                      <th>Fabric Cost</th>
                      <th>XS</th>
                      <th>S</th>
                      <th>M</th>
                      <th>L</th>
                      <th>XL</th>
                      <th>Total Pieces</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuttingRecord.details.map((detail) => (
                      <tr key={detail.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: detail.fabric_variant_data?.color || '#ccc',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6',
                                marginRight: '10px'
                              }}
                            />
                            <span>{detail.fabric_variant_data?.color_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <Badge bg="info" pill>
                            {parseFloat(detail.yard_usage).toFixed(2)} yards
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="secondary" pill>
                            Rs. {detail.fabric_variant_data?.price_per_yard.toFixed(2)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="warning" text="dark" pill>
                            Rs. {calculateCuttingValue(detail)}
                          </Badge>
                        </td>
                        <td>{detail.xs > 0 ? detail.xs : '-'}</td>
                        <td>{detail.s > 0 ? detail.s : '-'}</td>
                        <td>{detail.m > 0 ? detail.m : '-'}</td>
                        <td>{detail.l > 0 ? detail.l : '-'}</td>
                        <td>{detail.xl > 0 ? detail.xl : '-'}</td>
                        <td>
                          <Badge bg="success" pill>
                            {calculateTotalPieces(detail)} pcs
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-light">
                    <tr>
                      <td className="fw-bold">Total</td>
                      <td className="fw-bold">{calculateTotalYardUsage()} yards</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold">Rs. {calculateTotalCuttingValue()}</td>
                      <td className="fw-bold">
                        {cuttingRecord.details.reduce((sum, detail) => sum + detail.xs, 0)}
                      </td>
                      <td className="fw-bold">
                        {cuttingRecord.details.reduce((sum, detail) => sum + detail.s, 0)}
                      </td>
                      <td className="fw-bold">
                        {cuttingRecord.details.reduce((sum, detail) => sum + detail.m, 0)}
                      </td>
                      <td className="fw-bold">
                        {cuttingRecord.details.reduce((sum, detail) => sum + detail.l, 0)}
                      </td>
                      <td className="fw-bold">
                        {cuttingRecord.details.reduce((sum, detail) => sum + detail.xl, 0)}
                      </td>
                      <td className="fw-bold">{calculateTotalAllPieces()} pcs</td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}
      </Container>

      {/* PDF Confirmation Modal */}
      <Modal show={showPdfModal} onHide={closePdfModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFilePdf className="text-danger me-2" />
            Generate PDF Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to generate a PDF report for this cutting record?</p>
          {cuttingRecord && (
            <div className="bg-light p-3 rounded">
              <p className="mb-1"><strong>Product:</strong> {cuttingRecord.product_name || "N/A"}</p>
              <p className="mb-1"><strong>Fabric:</strong> {cuttingRecord.fabric_definition_data?.fabric_name || "N/A"}</p>
              <p className="mb-1"><strong>Date:</strong> {cuttingRecord.cutting_date}</p>
              <p className="mb-0"><strong>Total Cost:</strong> Rs. {calculateTotalCuttingValue()}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePdfModal}>
            <FaTimes className="me-1" /> Cancel
          </Button>
          <Button variant="success" onClick={generatePDF}>
            <FaCheck className="me-1" /> Generate PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CuttingRecordDetail;
