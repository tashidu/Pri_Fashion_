import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import {
  Container, Row, Col, Card, Table, Button,
  Form, InputGroup, Badge, Spinner, Alert,
  Modal
} from 'react-bootstrap';
import {
  FaSearch, FaSort, FaSortUp, FaSortDown,
  FaEye, FaEyeSlash, FaTshirt, FaCut,
  FaCalendarAlt, FaFilter, FaPlus, FaDownload,
  FaFilePdf, FaCheck, FaTimes, FaInfoCircle
} from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Add global CSS for hover effect
const addGlobalStyle = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .hover-row:hover {
      background-color: #f0f8ff !important;
    }
  `;
  document.head.appendChild(style);
};

// Add the global style once when component loads
addGlobalStyle();

const ViewCutting = () => {
  const navigate = useNavigate();
  const [cuttingRecords, setCuttingRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [expandedRows, setExpandedRows] = useState({}); // e.g., { recordId: true/false }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'cutting_date', direction: 'desc' });
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch cutting records on mount
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8000/api/cutting/cutting-records/")
      .then((res) => {
        console.log("Fetched cutting records:", res.data);
        setCuttingRecords(res.data);
        setFilteredRecords(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cutting records:", err);
        setError("Failed to fetch cutting records.");
        setLoading(false);
      });
  }, []);

  // Filter records based on search term and date range
  useEffect(() => {
    let results = cuttingRecords;

    // Apply search filter
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      results = results.filter(record =>
        (record.product_name && record.product_name.toLowerCase().includes(lowercasedSearch)) ||
        (record.fabric_definition_data?.fabric_name &&
         record.fabric_definition_data.fabric_name.toLowerCase().includes(lowercasedSearch))
      );
    }

    // Apply date filter
    if (dateFilter.startDate && dateFilter.endDate) {
      results = results.filter(record => {
        const recordDate = new Date(record.cutting_date);
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59); // Include the entire end date
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      results = [...results].sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'product_name') {
          aValue = a.product_name || '';
          bValue = b.product_name || '';
        } else if (sortConfig.key === 'fabric_name') {
          aValue = a.fabric_definition_data?.fabric_name || '';
          bValue = b.fabric_definition_data?.fabric_name || '';
        } else if (sortConfig.key === 'cutting_date') {
          aValue = new Date(a.cutting_date);
          bValue = new Date(b.cutting_date);
        } else if (sortConfig.key === 'total_quantity' || sortConfig.key === 'total_yard' || sortConfig.key === 'total_variants') {
          const aAggregates = getAggregates(a);
          const bAggregates = getAggregates(b);

          if (sortConfig.key === 'total_quantity') {
            aValue = aAggregates.totalQuantity;
            bValue = bAggregates.totalQuantity;
          } else if (sortConfig.key === 'total_yard') {
            aValue = aAggregates.totalYard;
            bValue = bAggregates.totalYard;
          } else {
            aValue = aAggregates.totalVariants;
            bValue = bAggregates.totalVariants;
          }
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredRecords(results);
  }, [cuttingRecords, searchTerm, dateFilter, sortConfig]);

  // Helper to calculate aggregates for each record
  const getAggregates = (record) => {
    let totalYard = 0;
    let totalQuantity = 0;
    const variantSet = new Set();

    if (record.details) {
      record.details.forEach((detail) => {
        totalYard += parseFloat(detail.yard_usage || 0);
        const sizesSum =
          (detail.xs || 0) +
          (detail.s || 0) +
          (detail.m || 0) +
          (detail.l || 0) +
          (detail.xl || 0);
        totalQuantity += sizesSum;
        // Use nested data if available, otherwise fallback to raw ID
        const variantId = detail.fabric_variant_data
          ? detail.fabric_variant_data.id
          : detail.fabric_variant;
        variantSet.add(variantId);
      });
    }

    return { totalYard, totalQuantity, totalVariants: variantSet.size };
  };

  // Toggle expanded rows
  const toggleRow = (recordId) => {
    setExpandedRows((prev) => ({ ...prev, [recordId]: !prev[recordId] }));
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="ms-1 text-muted" />;
    }
    return sortConfig.direction === 'asc' ?
      <FaSortUp className="ms-1 text-primary" /> :
      <FaSortDown className="ms-1 text-primary" />;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setSortConfig({ key: 'cutting_date', direction: 'desc' });
  };

  // Open PDF confirmation modal
  const openPdfModal = (record) => {
    setSelectedRecord(record);
    setShowPdfModal(true);
  };

  // Close PDF confirmation modal
  const closePdfModal = () => {
    setShowPdfModal(false);
    setSelectedRecord(null);
  };

  // Generate PDF report
  const generatePDF = () => {
    if (!selectedRecord) return;

    try {
      const { totalYard, totalQuantity, totalVariants } = getAggregates(selectedRecord);
      const productName = selectedRecord.product_name || "N/A";
      const fabricName = selectedRecord.fabric_definition_data?.fabric_name || "N/A";

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
        ["Cutting Date:", selectedRecord.cutting_date],
        ["Total Quantity:", totalQuantity.toString()],
        ["Total Yard Usage:", totalYard.toString()],
        ["Variants Used:", totalVariants.toString()]
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

      if (selectedRecord.details && selectedRecord.details.length > 0) {
        const colorDetails = selectedRecord.details.map(detail => [
          detail.fabric_variant_data?.color_name || detail.fabric_variant_data?.color || "N/A",
          detail.yard_usage,
          detail.xs || 0,
          detail.s || 0,
          detail.m || 0,
          detail.l || 0,
          detail.xl || 0
        ]);

        // Second table
        autoTable(doc, {
          startY: finalY + 5,
          head: [["Color", "Yard Usage", "XS", "S", "M", "L", "XL"]],
          body: colorDetails,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { fontSize: 10 }
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
      doc.save(`Cutting_Record_${selectedRecord.id}_${cleanProductName}.pdf`);

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <FaCut className="me-2 text-primary" />
            Cutting Records
          </h2>
          <Button
            variant="success"
            onClick={() => navigate('/addcutting')}
          >
            <FaPlus className="me-1" /> Add New Cutting
          </Button>
        </div>

        {error && <Alert variant="danger" className="text-center">{error}</Alert>}

        {/* Search and Filter Section */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={4}>
                <InputGroup className="mb-3 mb-md-0">
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by product or fabric name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={6}>
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3 mb-md-0">
                      <Form.Control
                        type="date"
                        placeholder="Start Date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3 mb-md-0">
                      <Form.Control
                        type="date"
                        placeholder="End Date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-center">
                    <FaCalendarAlt className="text-primary me-2" />
                    <span className="d-none d-md-inline">Date Range</span>
                  </Col>
                </Row>
              </Col>
              <Col md={2} className="d-flex justify-content-end">
                <Button
                  variant="outline-secondary"
                  onClick={resetFilters}
                  className="w-100"
                >
                  <FaFilter className="me-1" /> Reset Filters
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Results Count */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <Badge bg="info" className="p-2">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'} Found
            </Badge>
          </div>
          <div>
            <small className="text-muted">
              <FaInfoCircle className="me-1" /> Click on any row for detailed view
            </small>
          </div>
        </div>

        {/* Main Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading cutting records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-5">
                <FaCut className="text-muted mb-3" style={{ fontSize: '2rem' }} />
                <h5>No cutting records found</h5>
                <p className="text-muted">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="cursor-pointer" onClick={() => requestSort('product_name')}>
                        <div className="d-flex align-items-center">
                          Product Name {getSortIcon('product_name')}
                        </div>
                      </th>
                      <th className="cursor-pointer" onClick={() => requestSort('fabric_name')}>
                        <div className="d-flex align-items-center">
                          Fabric Name {getSortIcon('fabric_name')}
                        </div>
                      </th>
                      <th className="cursor-pointer" onClick={() => requestSort('cutting_date')}>
                        <div className="d-flex align-items-center">
                          Cutting Date {getSortIcon('cutting_date')}
                        </div>
                      </th>
                      <th className="cursor-pointer" onClick={() => requestSort('total_quantity')}>
                        <div className="d-flex align-items-center">
                          Total Quantity {getSortIcon('total_quantity')}
                        </div>
                      </th>
                      <th className="cursor-pointer" onClick={() => requestSort('total_yard')}>
                        <div className="d-flex align-items-center">
                          Yard Usage {getSortIcon('total_yard')}
                        </div>
                      </th>
                      <th className="cursor-pointer" onClick={() => requestSort('total_variants')}>
                        <div className="d-flex align-items-center">
                          Variants Used {getSortIcon('total_variants')}
                        </div>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => {
                      const { totalYard, totalQuantity, totalVariants } = getAggregates(record);
                      // Get product name; fallback to fabric name if product_name is empty
                      const productName = record.product_name || "N/A";
                      const fabricName = record.fabric_definition_data?.fabric_name || "N/A";

                      return (
                        <React.Fragment key={record.id}>
                          <tr
                            className={`${expandedRows[record.id] ? "bg-light" : ""} hover-row`}
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              // Prevent navigation if clicking on the action buttons
                              if (e.target.closest('.action-buttons')) return;
                              navigate(`/cutting-record/${record.id}`);
                            }}
                          >
                            <td>{productName}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FaTshirt className="text-primary me-2" />
                                {fabricName}
                              </div>
                            </td>
                            <td>
                              <Badge bg="light" text="dark" className="p-2">
                                <FaCalendarAlt className="me-1" />
                                {record.cutting_date}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="info" className="p-2">
                                {totalQuantity}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="warning" text="dark" className="p-2">
                                {totalYard} yards
                              </Badge>
                            </td>
                            <td>
                              <Badge bg="secondary" className="p-2">
                                {totalVariants}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex action-buttons">
                                <Button
                                  variant={expandedRows[record.id] ? "outline-danger" : "outline-primary"}
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    toggleRow(record.id);
                                  }}
                                  className="me-2"
                                >
                                  {expandedRows[record.id] ? (
                                    <><FaEyeSlash className="me-1" /> Hide</>
                                  ) : (
                                    <><FaEye className="me-1" /> View</>
                                  )}
                                </Button>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    navigate(`/cutting-record/${record.id}`);
                                  }}
                                  className="me-2"
                                >
                                  <FaInfoCircle className="me-1" /> Details
                                </Button>
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    openPdfModal(record);
                                  }}
                                >
                                  <FaDownload className="me-1" /> PDF
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {expandedRows[record.id] && (
                            <tr>
                              <td colSpan={7} className="p-0">
                                <div className="p-3 bg-light border-top">
                                  <Card className="mb-0 shadow-sm">
                                    <Card.Header className="bg-white">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">
                                          <FaTshirt className="text-primary me-2" />
                                          Color Usage Details
                                        </h5>
                                        <small className="text-muted">
                                          <FaInfoCircle className="me-1" /> Click on a row for detailed view
                                        </small>
                                      </div>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                      <div className="table-responsive">
                                        <Table hover className="mb-0">
                                          <thead className="bg-light">
                                            <tr>
                                              <th>Variant</th>
                                              <th>Yard Usage</th>
                                              <th>XS</th>
                                              <th>S</th>
                                              <th>M</th>
                                              <th>L</th>
                                              <th>XL</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {record.details?.map((detail, idx) => (
                                              <tr
                                                key={idx}
                                                onClick={() => navigate(`/cutting-record/${record.id}`)}
                                                style={{ cursor: 'pointer' }}
                                                className="hover-row"
                                              >
                                                <td>
                                                  <div className="d-flex align-items-center">
                                                    <div
                                                      className="rounded-circle me-2"
                                                      style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        backgroundColor:
                                                          detail.fabric_variant_data?.color || "#fff",
                                                        border: "1px solid #ccc",
                                                      }}
                                                    />
                                                    <span>
                                                      {detail.fabric_variant_data?.color_name ||
                                                        detail.fabric_variant_data?.color ||
                                                        detail.fabric_variant ||
                                                        "N/A"}
                                                    </span>
                                                  </div>
                                                </td>
                                                <td>
                                                  <Badge bg="warning" text="dark" className="p-2">
                                                    {detail.yard_usage} yards
                                                  </Badge>
                                                </td>
                                                <td>
                                                  {detail.xs > 0 ? (
                                                    <Badge bg="success" className="p-2">{detail.xs}</Badge>
                                                  ) : (
                                                    <span className="text-muted">0</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {detail.s > 0 ? (
                                                    <Badge bg="success" className="p-2">{detail.s}</Badge>
                                                  ) : (
                                                    <span className="text-muted">0</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {detail.m > 0 ? (
                                                    <Badge bg="success" className="p-2">{detail.m}</Badge>
                                                  ) : (
                                                    <span className="text-muted">0</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {detail.l > 0 ? (
                                                    <Badge bg="success" className="p-2">{detail.l}</Badge>
                                                  ) : (
                                                    <span className="text-muted">0</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {detail.xl > 0 ? (
                                                    <Badge bg="success" className="p-2">{detail.xl}</Badge>
                                                  ) : (
                                                    <span className="text-muted">0</span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </Table>
                                      </div>
                                    </Card.Body>
                                  </Card>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
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
          {selectedRecord && (
            <div className="bg-light p-3 rounded">
              <p className="mb-1"><strong>Product:</strong> {selectedRecord.product_name || "N/A"}</p>
              <p className="mb-1"><strong>Fabric:</strong> {selectedRecord.fabric_definition_data?.fabric_name || "N/A"}</p>
              <p className="mb-0"><strong>Date:</strong> {selectedRecord.cutting_date}</p>
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

export default ViewCutting;
