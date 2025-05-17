import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import {
  Container, Row, Col, Card, Table, Button,
  Form, InputGroup, Badge, Spinner, Alert, Modal
} from 'react-bootstrap';
import {
  FaSearch, FaSort, FaSortUp, FaSortDown,
  FaTshirt, FaCut, FaCalendarAlt, FaFilter,
  FaPlus, FaInfoCircle, FaEdit, FaTrash
} from 'react-icons/fa';

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'cutting_date', direction: 'desc' });
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

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

  // Handle edit cutting record
  const handleEditClick = (e) => {
    e.stopPropagation(); // Prevent row click event
    // Since we don't have a dedicated edit page yet, navigate to the add cutting page
    // The user can create a new cutting record based on the existing one
    navigate(`/addcutting`);
    // You can also show an alert to inform the user
    alert("Edit functionality is not yet implemented. You can create a new cutting record instead.");
  };

  // Handle delete confirmation
  const handleDeleteClick = (e, record) => {
    e.stopPropagation(); // Prevent row click event
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  // Handle actual deletion
  const handleDeleteConfirm = () => {
    if (!recordToDelete) return;

    setLoading(true);
    setError(""); // Clear any previous errors

    // Log the request for debugging
    console.log(`Attempting to delete cutting record with ID: ${recordToDelete.id}`);

    axios
      .delete(`http://localhost:8000/api/cutting/cutting-records/${recordToDelete.id}/`)
      .then((response) => {
        console.log("Delete response:", response);
        // Remove the deleted record from state
        const updatedRecords = cuttingRecords.filter(record => record.id !== recordToDelete.id);
        setCuttingRecords(updatedRecords);
        setFilteredRecords(updatedRecords);
        setShowDeleteModal(false);
        setRecordToDelete(null);
        setLoading(false);

        // Show success message
        setError(""); // Clear any previous errors
        alert("Cutting record deleted successfully!");
      })
      .catch((err) => {
        console.error("Error deleting cutting record:", err);
        let errorMessage = "Failed to delete cutting record.";

        // Check for specific error messages from the server
        if (err.response) {
          console.log("Error response:", err.response);
          if (err.response.data && typeof err.response.data === 'object') {
            errorMessage = JSON.stringify(err.response.data);
          } else if (err.response.data) {
            errorMessage = err.response.data;
          } else if (err.response.status === 403) {
            errorMessage = "You don't have permission to delete this record.";
          } else if (err.response.status === 409 || err.response.status === 400) {
            errorMessage = "This record cannot be deleted because it is referenced by other records.";
          }
        }

        setError(errorMessage);
        setShowDeleteModal(false);
        setRecordToDelete(null);
        setLoading(false);
      });
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
                            className="hover-row"
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
                              <div className="d-flex action-buttons gap-2">
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    navigate(`/cutting-record/${record.id}`);
                                  }}
                                >
                                  <FaInfoCircle className="me-1" /> Details
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => handleEditClick(e)}
                                >
                                  <FaEdit className="me-1" /> Edit
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => handleDeleteClick(e, record)}
                                >
                                  <FaTrash className="me-1" /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
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

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {recordToDelete && (
            <p>
              Are you sure you want to delete the cutting record for{" "}
              <strong>{recordToDelete.product_name || "Unnamed Product"}</strong> from{" "}
              <strong>{recordToDelete.cutting_date}</strong>?
            </p>
          )}
          <Alert variant="warning">
            <strong>Warning:</strong> This action cannot be undone. Deleting this record may affect related data.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewCutting;
