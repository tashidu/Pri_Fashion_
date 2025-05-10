import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { format } from "date-fns"; // Import date-fns for formatting
import { FaSearch, FaEdit, FaTrash, FaPlus, FaTshirt, FaExclamationTriangle, FaCheck } from "react-icons/fa";
import { Card, Row, Col, Badge, Button, Form, InputGroup, Spinner, Alert } from "react-bootstrap";

const ViewDailySewingHistory = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date"); // default sort by date
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'
  const [loading, setLoading] = useState(true); // Loading state
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Track sidebar state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Fetch records on component mount
    setLoading(true);
    axios
      .get("http://localhost:8000/api/sewing/history/daily/")
      .then((res) => {
        setRecords(res.data);
        setTotalItems(res.data.length);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching daily sewing history:", err);
        setError("Failed to load daily sewing history.");
        setLoading(false);
      });
  }, []);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter records based on search term (product_name search)
  const filteredRecords = records.filter((record) =>
    record.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort records based on sortField and sortOrder
  const sortedRecords = filteredRecords.sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // If sorting by date, convert to Date objects
    if (sortField === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    } else {
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate total pages
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);

  // Delete a record by ID
  const deleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`http://localhost:8000/api/sewing/daily-records/${id}/`);
        // Remove the record from state after successful deletion
        const updatedRecords = records.filter((record) => record.id !== id);
        setRecords(updatedRecords);
        setTotalItems(updatedRecords.length);
        setSuccessMessage("Record deleted successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } catch (err) {
        console.error("Error deleting record:", err);
        setError("Error deleting record. Please try again.");

        // Clear error message after 3 seconds
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    }
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        {/* Header Section with Cards */}
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB" }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="mb-0">Daily Sewing History</h2>
                    <p className="text-muted mb-0">
                      View and manage daily sewing production records
                    </p>
                  </div>
                  <div>
                    <Link to="/adddailysewing">
                      <Button variant="primary" className="d-flex align-items-center">
                        <FaPlus className="me-2" /> Add New Record
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Success and Error Messages */}
        {successMessage && (
          <Alert variant="success" className="mb-3 d-flex align-items-center">
            <FaCheck className="me-2" /> {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="mb-3 d-flex align-items-center">
            <FaExclamationTriangle className="me-2" /> {error}
          </Alert>
        )}

        {/* Action Buttons Row */}
        <Row className="mb-4">
          <Col md={6} className="mb-3 mb-md-0">
            <Link to="/viewproductlist">
              <Button variant="outline-primary" className="d-flex align-items-center">
                <FaTshirt className="me-2" /> View Product List
              </Button>
            </Link>
          </Col>
          <Col md={6} className="text-md-end">
            <Badge bg="info" className="p-2 me-2">
              Total Records: {filteredRecords.length}
            </Badge>
          </Col>
        </Row>

        {/* Search and Filter Card */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row>
              {/* Search Bar */}
              <Col md={6} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Search Products</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by Product Name..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              {/* Sorting Controls */}
              <Col md={3} className="mb-3 mb-md-0">
                <Form.Group>
                  <Form.Label>Sort by</Form.Label>
                  <Form.Select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                  >
                    <option value="date">Date</option>
                    <option value="product_name">Product Name</option>
                    <option value="color">Color</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Order</Form.Label>
                  <Form.Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading records...</p>
          </div>
        ) : (
          <>
            {/* Table of Records */}
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Product Name</th>
                        <th className="px-3 py-3">Color</th>
                        <th className="px-3 py-3">XS</th>
                        <th className="px-3 py-3">S</th>
                        <th className="px-3 py-3">M</th>
                        <th className="px-3 py-3">L</th>
                        <th className="px-3 py-3">XL</th>
                        <th className="px-3 py-3">Damage</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center py-4">
                            <FaSearch className="me-2 text-muted" size={20} />
                            <p className="mb-0 text-muted">No records found.</p>
                          </td>
                        </tr>
                      ) : (
                        currentRecords.map((record) => (
                          <tr key={record.id}>
                            <td className="px-3 py-3">{format(new Date(record.date), "dd/MM/yyyy")}</td>
                            <td className="px-3 py-3 fw-bold">{record.product_name}</td>
                            <td className="px-3 py-3">
                              <div className="d-flex align-items-center">
                                <div
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    backgroundColor: record.color,
                                    border: "1px solid #ccc",
                                    marginRight: "8px",
                                    borderRadius: "4px"
                                  }}
                                />
                                <span>{record.color}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3">{record.xs}</td>
                            <td className="px-3 py-3">{record.s}</td>
                            <td className="px-3 py-3">{record.m}</td>
                            <td className="px-3 py-3">{record.l}</td>
                            <td className="px-3 py-3">{record.xl}</td>
                            <td className="px-3 py-3">
                              {record.damage_count > 0 ? (
                                <Badge bg="warning" pill>
                                  {record.damage_count}
                                </Badge>
                              ) : (
                                <span>0</span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="d-flex gap-2">
                                <Link to={`/edit-daily-sewing-record/${record.id}`}>
                                  <Button variant="outline-primary" size="sm">
                                    <FaEdit /> Edit
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => deleteRecord(record.id)}
                                >
                                  <FaTrash /> Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <Button
                      variant="light"
                      className="page-link"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                  </li>

                  {[...Array(totalPages).keys()].map(number => (
                    <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                      <Button
                        variant={currentPage === number + 1 ? "primary" : "light"}
                        className="page-link"
                        onClick={() => paginate(number + 1)}
                      >
                        {number + 1}
                      </Button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <Button
                      variant="light"
                      className="page-link"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ViewDailySewingHistory;
