import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { Table, Container, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaBuilding, FaUser, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewSuppliers = () => {
  // State variables
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Effect to handle sidebar state based on window size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch suppliers from API
  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:8000/api/suppliers/')
      .then(response => {
        setSuppliers(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching suppliers:', error);
        setError('Failed to load suppliers. Please try again later.');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <RoleBasedNavBar />
      <div className="main-content" style={{
        marginLeft: isSidebarOpen ? '250px' : '0',
        transition: 'margin-left 0.3s ease-in-out'
      }}>
        <Container className="py-4">
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Row className="align-items-center mb-4">
                <Col>
                  <h2 className="mb-0">
                    <FaBuilding className="me-2" />
                    Supplier List
                  </h2>
                </Col>
              </Row>

              {error && (
                <Alert variant="danger" className="d-flex align-items-center">
                  {error}
                </Alert>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading suppliers...</p>
                </div>
              ) : suppliers.length === 0 ? (
                <Alert variant="info">
                  No suppliers found. Please add suppliers first.
                </Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped hover className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Telephone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map(supplier => (
                        <tr key={supplier.supplier_id}>
                          <td>{supplier.supplier_id}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaUser className="me-2 text-primary" />
                              {supplier.name}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaMapMarkerAlt className="me-2 text-secondary" />
                              {supplier.address}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaPhone className="me-2 text-info" />
                              {supplier.tel_no}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default ViewSuppliers;
