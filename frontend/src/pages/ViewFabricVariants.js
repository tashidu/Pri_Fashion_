import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { getUserRole, hasRole } from '../utils/auth';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Alert, Spinner, ListGroup, ProgressBar, Modal
} from 'react-bootstrap';
import {
  FaTshirt, FaArrowLeft, FaPalette,
  FaRulerHorizontal, FaMoneyBillWave, FaUserTie,
  FaCalendarAlt, FaInfoCircle, FaTrash, FaEdit
} from 'react-icons/fa';

const ViewFabricVariants = () => {
  const { id } = useParams(); // FabricDefinition ID from URL
  const [fabricDetail, setFabricDetail] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isInventoryManager, setIsInventoryManager] = useState(hasRole('Inventory Manager'));
  const navigate = useNavigate();

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasDependencies, setHasDependencies] = useState(false);

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

  // Check if variant has any cutting records associated with it
  const checkVariantDependencies = async (variantId) => {
    try {
      // Direct check for cutting records that use this fabric variant
      // This is more reliable than using the history endpoint
      const response = await axios.get(`http://localhost:8000/api/cutting/cutting-records/`);
      console.log("All cutting records:", response.data);

      // Check if any cutting record details reference this variant
      let hasReferences = false;

      for (const record of response.data) {
        if (record.details && record.details.length > 0) {
          // Check if any detail uses this variant
          const usesVariant = record.details.some(detail => detail.fabric_variant === variantId);

          if (usesVariant) {
            console.log(`Variant ${variantId} is used in cutting record ${record.id}`);
            hasReferences = true;
            break;
          }
        }
      }

      if (hasReferences) {
        return true;
      }

      // Fallback to the history endpoint if needed
      try {
        const historyResponse = await axios.get(`http://localhost:8000/api/cutting/fabric-variant/${variantId}/history/`);
        console.log("Variant dependency check response:", historyResponse.data);

        // If there are cutting records in the history, the variant has dependencies
        if (historyResponse.data &&
            historyResponse.data.cutting_history &&
            historyResponse.data.cutting_history.length > 0) {
          console.log(`Variant ${variantId} has ${historyResponse.data.cutting_history.length} cutting records`);
          return true;
        }
      } catch (historyError) {
        console.error("Error checking variant history:", historyError);
        // Continue with the main function even if history check fails
      }

      // No cutting records found - variant can be safely deleted
      console.log(`Variant ${variantId} has no cutting records`);
      return false;
    } catch (error) {
      console.error("Error checking variant dependencies:", error);

      // If it's a 404 error, it means the endpoint doesn't exist or the variant doesn't exist
      // In this case, we can assume there are no dependencies
      if (error.response && error.response.status === 404) {
        console.log(`Variant ${variantId} not found or endpoint not available`);
        return false;
      }

      // For other errors, log more details to help with debugging
      console.error("Error details:", error.response ? error.response.data : "No response data");

      // If there's an error, assume there might be dependencies to prevent accidental deletion
      return true;
    }
  };

  // Handle delete button click
  const handleDeleteClick = async (variant) => {
    setVariantToDelete(variant);
    setIsDeleting(false);
    setHasDependencies(false); // Default to no dependencies

    try {
      // Check if this is the last variant
      if (fabricDetail.variants.length <= 1) {
        setError("Cannot delete the last variant of a fabric. Please delete the entire fabric definition instead.");
        return;
      }

      // Check for dependencies
      const hasDeps = await checkVariantDependencies(variant.id);
      setHasDependencies(hasDeps);

      // Show the confirmation modal
      setShowDeleteModal(true);
    } catch (error) {
      console.error("Error in handleDeleteClick:", error);
      setError("An error occurred while checking if this variant can be deleted. Please try again.");
    }
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (hasDependencies) {
      return; // Don't allow deletion if there are dependencies
    }

    setIsDeleting(true);

    try {
      console.log(`Attempting to delete variant with ID: ${variantToDelete.id}`);

      // Double-check if this is the last variant
      if (fabricDetail.variants.length <= 1) {
        setError("Cannot delete the last variant of a fabric. Please delete the entire fabric definition instead.");
        setIsDeleting(false);
        return;
      }

      // Force a direct delete without checking dependencies again
      try {
        const response = await axios.delete(`http://localhost:8000/api/fabric-variants/${variantToDelete.id}/`);
        console.log("Delete response:", response);

        // Update the fabric detail by removing the deleted variant
        const updatedVariants = fabricDetail.variants.filter(v => v.id !== variantToDelete.id);
        setFabricDetail({
          ...fabricDetail,
          variants: updatedVariants
        });

        // Close the modal and show success message
        setShowDeleteModal(false);
        setSuccess(`Fabric variant "${variantToDelete.color_name || variantToDelete.color}" deleted successfully!`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (deleteError) {
        console.error("Error in direct delete attempt:", deleteError);

        // If the direct delete fails, try a workaround for variants with no cutting records
        if (deleteError.response && (deleteError.response.status === 400 || deleteError.response.status === 500)) {
          console.log("Attempting alternative delete method...");

          try {
            // Update the variant with minimal data before deleting
            await axios.put(`http://localhost:8000/api/fabric-variants/${variantToDelete.id}/`, {
              fabric_definition: variantToDelete.fabric_definition,
              color: variantToDelete.color,
              color_name: variantToDelete.color_name || variantToDelete.color,
              total_yard: 0,
              available_yard: 0,
              price_per_yard: 0
            });

            // Try deleting again
            await axios.delete(`http://localhost:8000/api/fabric-variants/${variantToDelete.id}/`);

            // Update the fabric detail by removing the deleted variant
            const updatedVariants = fabricDetail.variants.filter(v => v.id !== variantToDelete.id);
            setFabricDetail({
              ...fabricDetail,
              variants: updatedVariants
            });

            // Close the modal and show success message
            setShowDeleteModal(false);
            setSuccess(`Fabric variant "${variantToDelete.color_name || variantToDelete.color}" deleted successfully!`);

            // Clear success message after 3 seconds
            setTimeout(() => {
              setSuccess("");
            }, 3000);
          } catch (alternativeError) {
            console.error("Alternative delete method failed:", alternativeError);
            throw alternativeError; // Re-throw to be caught by the outer catch block
          }
        } else {
          throw deleteError; // Re-throw to be caught by the outer catch block
        }
      }
    } catch (error) {
      console.error("Error deleting fabric variant:", error);

      // Log detailed error information
      console.error("Error details:", error.response ? error.response.data : "No response data");
      console.error("Error status:", error.response ? error.response.status : "No status");

      // Provide more specific error messages based on the error
      let errorMessage = "Failed to delete fabric variant. Please try again.";

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.detail || "Bad request. The variant may be referenced by other records.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to delete this variant.";
        } else if (error.response.status === 404) {
          errorMessage = "Variant not found. It may have been already deleted.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please contact the administrator.";
        }
      }

      setError(error.response?.data?.message || errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Close the delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVariantToDelete(null);
    setHasDependencies(false);
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
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}

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
                      <th style={{ width: '15%' }}>Color</th>
                      <th style={{ width: '30%' }} className="text-center">Yard Information</th>
                      <th style={{ width: '20%' }} className="text-center">Price per Yard</th>
                      <th style={{ width: '20%' }} className="text-center">Total Price</th>
                      {isInventoryManager && (
                        <th style={{ width: '15%' }} className="text-center">Actions</th>
                      )}
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
                        <td className="text-center">
                          <div className="mb-1">
                            <strong>Total:</strong> {variant.total_yard} yards
                          </div>
                          <div className="mb-2">
                            <strong>Current Stock:</strong>{' '}
                            <span className={variant.available_yard < 10 ? 'text-danger fw-bold' : ''}>
                              {variant.available_yard !== null ? `${variant.available_yard} yards` : 'N/A'}
                            </span>
                            {variant.available_yard !== null && variant.total_yard > 0 && (
                              <div className="mt-1">
                                <ProgressBar
                                  now={Math.min(100, (variant.available_yard / variant.total_yard) * 100)}
                                  variant={
                                    variant.available_yard < 0.1 * variant.total_yard ? 'danger' :
                                    variant.available_yard < 0.3 * variant.total_yard ? 'warning' : 'success'
                                  }
                                  style={{ height: '8px' }}
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => navigate(`/fabric-inventory/${variant.id}`)}
                            >
                              View Inventory
                            </Button>
                          </div>
                        </td>
                        <td className="text-center">Rs. {variant.price_per_yard}/yard</td>
                        <td className="text-center fw-bold">
                          Rs. {(variant.total_yard * variant.price_per_yard).toFixed(2)}
                        </td>
                        {isInventoryManager && (
                          <td className="text-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteClick(variant)}
                              disabled={fabricDetail.variants.length <= 1}
                              title={fabricDetail.variants.length <= 1 ? "Cannot delete the last variant" : "Delete variant"}
                            >
                              <FaTrash className="me-1" /> Delete
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-light">
                    <tr>
                      <td colSpan="2" className="text-end fw-bold">Total:</td>
                      <td className="text-center">{fabricDetail.variants.length} variants</td>
                      <td className="text-center fw-bold text-success" colSpan={isInventoryManager ? 2 : 1}>
                        Rs. {calculateTotalValue()}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {variantToDelete && (
            <>
              <p>Are you sure you want to delete this fabric variant?</p>
              <Table bordered size="sm" className="mt-3">
                <tbody>
                  <tr>
                    <td><strong>Color:</strong></td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: variantToDelete.color,
                            borderRadius: '4px',
                            border: '1px solid #dee2e6',
                            marginRight: '10px'
                          }}
                        />
                        {variantToDelete.color_name || variantToDelete.color}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Total Yard:</strong></td>
                    <td>{variantToDelete.total_yard} yards</td>
                  </tr>
                  <tr>
                    <td><strong>Available Yard:</strong></td>
                    <td>{variantToDelete.available_yard} yards</td>
                  </tr>
                  <tr>
                    <td><strong>Price per Yard:</strong></td>
                    <td>Rs. {variantToDelete.price_per_yard}/yard</td>
                  </tr>
                </tbody>
              </Table>

              {hasDependencies && (
                <Alert variant="warning" className="mt-3">
                  <strong>Warning:</strong> This fabric variant cannot be deleted because it is being used in cutting records.
                  <div className="mt-2">
                    <small>
                      To delete this variant, you must first delete all cutting records that use it. You can view these records by clicking "View Inventory" and checking the cutting history.
                    </small>
                  </div>
                </Alert>
              )}

              {!hasDependencies && fabricDetail && fabricDetail.variants && fabricDetail.variants.length > 1 && (
                <Alert variant="success" className="mt-3">
                  <strong>Good news!</strong> This fabric variant has no cutting records and can be safely deleted.
                </Alert>
              )}

              {fabricDetail && fabricDetail.variants && fabricDetail.variants.length <= 1 && (
                <Alert variant="warning" className="mt-3">
                  <strong>Warning:</strong> Cannot delete the last variant of a fabric. If you want to remove this fabric completely, please delete the entire fabric definition from the fabric list.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={isDeleting || hasDependencies || (fabricDetail && fabricDetail.variants && fabricDetail.variants.length <= 1)}
          >
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Variant'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewFabricVariants;
