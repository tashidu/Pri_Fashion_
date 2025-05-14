import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup } from "react-bootstrap";
import { FaSearch, FaBoxOpen, FaBoxes, FaEye, FaShoppingCart } from "react-icons/fa";
import SalesTeamNavBar from "../components/SalesTeamNavBar";
import { authGet } from "../utils/api";
import { Link } from "react-router-dom";

const ViewPackingInventorySales = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [expandedRows, setExpandedRows] = useState({});

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        const response = await authGet("packing/inventory/");
        if (response.status === 200) {
          // Filter out items with zero total quantity
          const availableInventory = response.data.filter(item => item.total_quantity > 0);
          setInventory(availableInventory);
        } else {
          setError("Failed to fetch inventory data");
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        setError("An error occurred while fetching inventory data");
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  // Toggle expanded row
  const toggleRow = (productId) => {
    setExpandedRows((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${parseFloat(amount).toFixed(2)}`;
  };

  // Render table view
  const renderTableView = () => {
    return (
      <div className="table-responsive">
        <Table striped bordered hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Product</th>
              <th>6-Packs</th>
              <th>12-Packs</th>
              <th>Extra Items</th>
              <th>Total Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading inventory data...</p>
                </td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No inventory items found.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className={expandedRows[item.product_id] ? "table-active" : ""}>
                    <td className="fw-medium">{item.product_name}</td>
                    <td>{item.number_of_6_packs}</td>
                    <td>{item.number_of_12_packs}</td>
                    <td>{item.extra_items}</td>
                    <td>
                      <Badge bg="success" pill>
                        {item.total_quantity} items
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => toggleRow(item.product_id)}
                        >
                          <FaEye className="me-1" /> Details
                        </Button>
                        <Link to={`/sell-product?productId=${item.product_id}`}>
                          <Button variant="success" size="sm">
                            <FaShoppingCart className="me-1" /> Sell
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[item.product_id] && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="p-3 bg-light">
                          <Row>
                            <Col md={6}>
                              <h6 className="mb-3">Inventory Details</h6>
                              <ul className="list-group">
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                  6-Packs
                                  <span className="badge bg-primary rounded-pill">{item.number_of_6_packs}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                  12-Packs
                                  <span className="badge bg-primary rounded-pill">{item.number_of_12_packs}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                  Extra Items
                                  <span className="badge bg-primary rounded-pill">{item.extra_items}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between align-items-center">
                                  Total Units
                                  <span className="badge bg-success rounded-pill">{item.total_quantity}</span>
                                </li>
                              </ul>
                            </Col>
                            <Col md={6} className="d-flex justify-content-end align-items-center">
                              <Link to={`/sell-product?productId=${item.product_id}`} className="btn btn-primary">
                                <FaShoppingCart className="me-2" /> Sell This Product
                              </Link>
                            </Col>
                          </Row>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </Table>
      </div>
    );
  };

  // Render card view
  const renderCardView = () => {
    return (
      <Row xs={1} md={2} lg={3} className="g-4">
        {loading ? (
          <Col className="d-flex justify-content-center py-5">
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading inventory data...</p>
            </div>
          </Col>
        ) : filteredInventory.length === 0 ? (
          <Col className="d-flex justify-content-center py-5">
            <Alert variant="info">No inventory items found.</Alert>
          </Col>
        ) : (
          filteredInventory.map((item) => (
            <Col key={item.id}>
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{item.product_name}</h6>
                  <Badge bg="success" pill>
                    {item.total_quantity} in stock
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>6-Packs:</span>
                      <Badge bg="primary">{item.number_of_6_packs}</Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>12-Packs:</span>
                      <Badge bg="primary">{item.number_of_12_packs}</Badge>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Extra Items:</span>
                      <Badge bg="primary">{item.extra_items}</Badge>
                    </div>
                  </div>
                  <div className="d-grid gap-2">
                    <Link to={`/sell-product?productId=${item.product_id}`} className="btn btn-success">
                      <FaShoppingCart className="me-2" /> Sell This Product
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    );
  };

  return (
    <>
      <SalesTeamNavBar />
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <Container fluid>
          <Row className="mb-4">
            <Col>
              <h2 className="text-primary fw-bold">Packing Inventory</h2>
              <p className="text-muted">View available products in packing inventory</p>
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Row className="mb-4">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="d-flex justify-content-end">
              <div className="btn-group">
                <Button
                  variant={viewMode === "table" ? "primary" : "outline-primary"}
                  onClick={() => setViewMode("table")}
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === "card" ? "primary" : "outline-primary"}
                  onClick={() => setViewMode("card")}
                >
                  Card View
                </Button>
              </div>
            </Col>
          </Row>

          <Card className="shadow-sm">
            <Card.Body>
              {viewMode === "table" ? renderTableView() : renderCardView()}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default ViewPackingInventorySales;
