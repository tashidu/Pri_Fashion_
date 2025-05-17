import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { Table, Container, Alert, Card, Row, Col, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { FaBuilding, FaUser, FaMapMarkerAlt, FaPhone, FaEdit, FaTrash, FaLock } from 'react-icons/fa';
import { getUserRole } from '../utils/auth';
import 'bootstrap/dist/css/bootstrap.min.css';

const ViewSuppliers = () => {
  // State variables
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [userRole, setUserRole] = useState(getUserRole());
  const isInventoryManager = userRole === 'Inventory Manager';

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    tel_no: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to handle sidebar state based on window size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effect to update user role if it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newRole = getUserRole();
      if (newRole !== userRole) {
        setUserRole(newRole);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userRole]);

  // Fetch suppliers from API
  const fetchSuppliers = () => {
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
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handle opening edit modal
  const handleEditClick = (supplier) => {
    // Only allow Inventory Managers to edit suppliers
    if (!isInventoryManager) {
      setError('Only Inventory Managers can edit suppliers.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedSupplier(supplier);
    setEditFormData({
      name: supplier.name,
      address: supplier.address,
      tel_no: supplier.tel_no
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only allow Inventory Managers to update suppliers
    if (!isInventoryManager) {
      setError('Only Inventory Managers can update suppliers.');
      setTimeout(() => setError(''), 3000);
      setShowEditModal(false);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await axios.put(
        `http://localhost:8000/api/suppliers/${selectedSupplier.supplier_id}/`,
        editFormData
      );

      if (response.status === 200) {
        // Update the suppliers list with the edited supplier
        const updatedSuppliers = suppliers.map(supplier =>
          supplier.supplier_id === selectedSupplier.supplier_id ? response.data : supplier
        );
        setSuppliers(updatedSuppliers);

        // Close modal and show success message
        setShowEditModal(false);
        setMessage('Supplier updated successfully!');

        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      setError(error.response?.data?.message || 'Failed to update supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if supplier has associated fabrics
  const checkSupplierHasFabrics = async (supplierId) => {
    try {
      // Get all fabric definitions
      const response = await axios.get('http://localhost:8000/api/fabric-definitions/');
      // Check if any fabric definition has this supplier
      const hasFabrics = response.data.some(fabric => fabric.supplier === supplierId);
      return hasFabrics;
    } catch (error) {
      console.error('Error checking supplier fabrics:', error);
      // If there's an error, assume there might be fabrics to prevent accidental deletion
      return true;
    }
  };

  // Handle delete supplier
  const handleDelete = async (supplierId) => {
    try {
      // Only allow Inventory Managers to delete suppliers
      if (!isInventoryManager) {
        setError('Only Inventory Managers can delete suppliers.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // First check if supplier has associated fabrics
      const hasFabrics = await checkSupplierHasFabrics(supplierId);

      if (hasFabrics) {
        setError('Cannot delete this supplier because they have associated fabrics. Remove all fabrics from this supplier first.');

        // Clear error message after 5 seconds
        setTimeout(() => {
          setError('');
        }, 5000);
        return;
      }

      // If no fabrics, proceed with confirmation and deletion
      if (window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
        try {
          await axios.delete(`http://localhost:8000/api/suppliers/${supplierId}/`);

          // Remove the deleted supplier from the list
          const updatedSuppliers = suppliers.filter(
            supplier => supplier.supplier_id !== supplierId
          );
          setSuppliers(updatedSuppliers);

          // Show success message
          setMessage('Supplier deleted successfully!');

          // Clear message after 3 seconds
          setTimeout(() => {
            setMessage('');
          }, 3000);
        } catch (error) {
          console.error('Error deleting supplier:', error);
          if (error.response && error.response.status === 400) {
            setError('Cannot delete this supplier because they have associated fabrics.');
          } else {
            setError(error.response?.data?.message || 'Failed to delete supplier. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error in delete process:', error);
      setError('An error occurred while trying to delete the supplier.');
    }
  };

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

              {message && (
                <Alert variant="success" className="d-flex align-items-center">
                  {message}
                </Alert>
              )}

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
                        <th>Actions</th>
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
                          <td>
                            {isInventoryManager ? (
                              <div className="d-flex">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEditClick(supplier)}
                                >
                                  <FaEdit /> Edit
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDelete(supplier.supplier_id)}
                                >
                                  <FaTrash /> Delete
                                </Button>
                              </div>
                            ) : (
                              <div className="text-muted d-flex align-items-center">
                                <FaLock className="me-2" />
                                <small>Inventory Manager only</small>
                              </div>
                            )}
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

      {/* Edit Supplier Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="address"
                value={editFormData.address}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Telephone</Form.Label>
              <Form.Control
                type="text"
                name="tel_no"
                value={editFormData.tel_no}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ViewSuppliers;
