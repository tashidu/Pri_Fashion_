import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import {
  Container, Row, Col, Card, Table, Badge, Spinner,
  Alert, Button, ListGroup
} from 'react-bootstrap';
import {
  FaArrowLeft, FaCalendarAlt, FaCut, FaTshirt,
  FaInfoCircle, FaRulerHorizontal, FaClipboardList,
  FaMoneyBillWave
} from 'react-icons/fa';

const CuttingRecordDetail = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [cuttingRecord, setCuttingRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [returnPath, setReturnPath] = useState('');

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
      setReturnPath('/viewcutting');
    }
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
        {/* Back button */}
        <Button
          variant="outline-secondary"
          className="mb-3"
          onClick={handleBack}
        >
          <FaArrowLeft className="me-2" /> Back
        </Button>

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
    </>
  );
};

export default CuttingRecordDetail;
