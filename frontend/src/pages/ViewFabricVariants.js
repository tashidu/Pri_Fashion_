import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Alert, Spinner, ListGroup
} from 'react-bootstrap';
import {
  FaTshirt, FaArrowLeft, FaPalette,
  FaRulerHorizontal, FaMoneyBillWave, FaUserTie,
  FaCalendarAlt, FaInfoCircle
} from 'react-icons/fa';

const ViewFabricVariants = () => {
  const { id } = useParams(); // FabricDefinition ID from URL
  const [fabricDetail, setFabricDetail] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8000/api/fabric-definitions/${id}/`)
      .then((response) => {
        setFabricDetail(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching fabric definition:", error);
        setMessage("Error loading fabric details.");
        setLoading(false);
      });
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total inventory value
  const calculateTotalValue = () => {
    if (!fabricDetail || !fabricDetail.variants) return 0;
    return fabricDetail.variants.reduce((total, variant) => {
      return total + (variant.total_yard * variant.price_per_yard);
    }, 0).toFixed(2);
  };

  // Calculate total yards
  const calculateTotalYards = () => {
    if (!fabricDetail || !fabricDetail.variants) return 0;
    return fabricDetail.variants.reduce((total, variant) => {
      return total + parseFloat(variant.total_yard);
    }, 0).toFixed(2);
  };

  if (loading) {
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
            <p className="mt-2">Loading fabric details...</p>
          </div>
        </Container>
      </>
    );
  }

  if (!fabricDetail) {
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
          <Alert variant="danger" className="text-center">
            {message || "Error loading fabric details."}
          </Alert>
          <div className="text-center mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <FaArrowLeft className="me-2" /> Back to Fabrics
            </Button>
          </div>
        </Container>
      </>
    );
  }

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
          <Button
            variant="outline-secondary"
            onClick={() => navigate(-1)}
            className="me-2"
          >
            <FaArrowLeft className="me-2" /> Back
          </Button>
          <h2 className="mb-0 text-center flex-grow-1">
            <FaTshirt className="me-2 text-primary" />
            {fabricDetail.fabric_name}
          </h2>
          <div style={{ width: '85px' }}></div> {/* Empty div for balance */}
        </div>

        {message && <Alert variant="danger" className="text-center">{message}</Alert>}

        <Row className="mb-4">
          <Col lg={4} md={12}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FaInfoCircle className="me-2" />
                  Fabric Information
                </h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaUserTie className="me-2 text-secondary" />
                      Supplier
                    </div>
                    <Badge bg="info" pill>{fabricDetail.supplier_name}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaCalendarAlt className="me-2 text-secondary" />
                      Date Added
                    </div>
                    <span>{formatDate(fabricDetail.date_added)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaPalette className="me-2 text-secondary" />
                      Color Variants
                    </div>
                    <Badge bg="primary" pill>{fabricDetail.variants.length}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaRulerHorizontal className="me-2 text-secondary" />
                      Total Yards
                    </div>
                    <span>{calculateTotalYards()} yards</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaMoneyBillWave className="me-2 text-secondary" />
                      Total Value
                    </div>
                    <span className="text-success fw-bold">Rs. {calculateTotalValue()}</span>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FaPalette className="me-2" />
                  Color Variants
                </h5>
              </Card.Header>
              <Card.Body>
                <Table hover bordered responsive className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '25%' }}>Color</th>
                      <th style={{ width: '25%' }} className="text-center">Total Yard</th>
                      <th style={{ width: '25%' }} className="text-center">Price per Yard</th>
                      <th style={{ width: '25%' }} className="text-center">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fabricDetail.variants.map((variant) => (
                      <tr key={variant.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: variant.color,
                                borderRadius: '4px',
                                border: '1px solid #dee2e6',
                                marginRight: '10px'
                              }}
                            />
                            <span>{variant.color}</span>
                          </div>
                        </td>
                        <td className="text-center">{variant.total_yard} yards</td>
                        <td className="text-center">Rs. {variant.price_per_yard}/yard</td>
                        <td className="text-center fw-bold">
                          Rs. {(variant.total_yard * variant.price_per_yard).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-light">
                    <tr>
                      <td colSpan="2" className="text-end fw-bold">Total:</td>
                      <td className="text-center">{fabricDetail.variants.length} variants</td>
                      <td className="text-center fw-bold text-success">Rs. {calculateTotalValue()}</td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ViewFabricVariants;
