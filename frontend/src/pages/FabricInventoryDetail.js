import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import {
  Container, Row, Col, Card, Table, Badge, Spinner,
  Alert, Button, ProgressBar
} from 'react-bootstrap';
import {
  FaTshirt, FaCalendarAlt, FaArrowLeft, FaCut,
  FaBoxes, FaInfoCircle, FaHistory
} from 'react-icons/fa';

const FabricInventoryDetail = () => {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const [fabricData, setFabricData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch fabric variant data with cutting history
  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8000/api/cutting/fabric-variant/${variantId}/history/`)
      .then((response) => {
        setFabricData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching fabric inventory details:", error);
        setError("Failed to load fabric inventory details.");
        setLoading(false);
      });
  }, [variantId]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate usage percentage
  const calculateUsagePercentage = () => {
    if (!fabricData) return 0;
    const used = fabricData.total_yard - fabricData.available_yard;
    return Math.round((used / fabricData.total_yard) * 100);
  };

  // Get progress bar variant based on percentage
  const getProgressVariant = (percentage) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'success';
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
          onClick={() => navigate('/viewfabric')}
        >
          <FaArrowLeft className="me-2" /> Back to Fabric List
        </Button>

        {error && <Alert variant="danger" className="text-center">{error}</Alert>}

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading fabric inventory details...</p>
          </div>
        ) : fabricData && (
          <>
            {/* Fabric Details Card */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">
                  <FaTshirt className="me-2" />
                  Real-Time Fabric Inventory
                </h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h5 className="mb-3">{fabricData.fabric_definition.fabric_name}</h5>
                    <p className="mb-2">
                      <strong>Color:</strong>{' '}
                      <Badge
                        style={{
                          backgroundColor: fabricData.color,
                          color: fabricData.color === '#FFFFFF' ? '#000' : '#fff',
                          padding: '5px 10px'
                        }}
                      >
                        {fabricData.color_name}
                      </Badge>
                    </p>
                    <p className="mb-2">
                      <strong>Date Added:</strong>{' '}
                      <span className="text-muted">
                        <FaCalendarAlt className="me-1" />
                        {formatDate(fabricData.fabric_definition.date_added)}
                      </span>
                    </p>
                    <p className="mb-2">
                      <strong>Price per Yard:</strong>{' '}
                      <span>Rs. {fabricData.price_per_yard.toFixed(2)}</span>
                    </p>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 bg-light">
                      <Card.Body>
                        <h5 className="mb-3">Inventory Status</h5>
                        <p className="mb-2">
                          <strong>Total Yard:</strong>{' '}
                          <span>{fabricData.total_yard.toFixed(2)}</span>
                        </p>
                        <p className="mb-2">
                          <strong>Available Yard:</strong>{' '}
                          <span className={fabricData.available_yard < 5 ? 'text-danger' : ''}>
                            {fabricData.available_yard.toFixed(2)}
                          </span>
                        </p>
                        <p className="mb-2">
                          <strong>Used Yard:</strong>{' '}
                          <span>{(fabricData.total_yard - fabricData.available_yard).toFixed(2)}</span>
                        </p>
                        <div className="mt-3">
                          <label className="d-flex justify-content-between">
                            <span>Usage</span>
                            <span>{calculateUsagePercentage()}%</span>
                          </label>
                          <ProgressBar
                            variant={getProgressVariant(calculateUsagePercentage())}
                            now={calculateUsagePercentage()}
                            className="mt-1"
                          />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Cutting History Card */}
            <Card className="shadow-sm">
              <Card.Header className="bg-info text-white">
                <h4 className="mb-0">
                  <FaHistory className="me-2" />
                  Fabric Cutting History
                </h4>
              </Card.Header>
              <Card.Body className="p-0">
                {fabricData.cutting_history.length === 0 ? (
                  <Alert variant="info" className="m-3">
                    No cutting history found for this fabric.
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Yard Usage</th>
                          <th>Sizes</th>
                          <th>Total Pieces</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fabricData.cutting_history.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <FaCalendarAlt className="me-1 text-secondary" />
                              {formatDate(record.cutting_date)}
                            </td>
                            <td>
                              <FaCut className="me-1 text-primary" />
                              {record.product_name}
                            </td>
                            <td>
                              <Badge bg="info" pill>
                                {record.yard_usage.toFixed(2)} yards
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {record.sizes.xs > 0 && (
                                  <Badge bg="secondary" pill>XS: {record.sizes.xs}</Badge>
                                )}
                                {record.sizes.s > 0 && (
                                  <Badge bg="secondary" pill>S: {record.sizes.s}</Badge>
                                )}
                                {record.sizes.m > 0 && (
                                  <Badge bg="secondary" pill>M: {record.sizes.m}</Badge>
                                )}
                                {record.sizes.l > 0 && (
                                  <Badge bg="secondary" pill>L: {record.sizes.l}</Badge>
                                )}
                                {record.sizes.xl > 0 && (
                                  <Badge bg="secondary" pill>XL: {record.sizes.xl}</Badge>
                                )}
                              </div>
                            </td>
                            <td>
                              <Badge bg="success" pill>
                                <FaBoxes className="me-1" />
                                {record.total_pieces} pcs
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
    </>
  );
};

export default FabricInventoryDetail;
