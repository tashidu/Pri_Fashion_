import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { useNavigate } from 'react-router-dom';
import { getUserRole, hasRole } from '../utils/auth';
import {
  Container, Row, Col, Card, Form, InputGroup,
  Button, Badge, Dropdown, DropdownButton,
  Spinner, Alert, Table, Modal
} from 'react-bootstrap';
import {
  FaSearch, FaSort, FaSortUp, FaSortDown,
  FaEye, FaTshirt, FaCalendarAlt,
  FaUserTie, FaPalette, FaEdit, FaTrash
} from 'react-icons/fa';

const ViewFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [filteredFabrics, setFilteredFabrics] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(getUserRole());
  const [isInventoryManager, setIsInventoryManager] = useState(hasRole('Inventory Manager'));
  const navigate = useNavigate();

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fabricToDelete, setFabricToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasDependencies, setHasDependencies] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date_added');
  const [sortOrder, setSortOrder] = useState('desc');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [minColorCount, setMinColorCount] = useState('');
  const [maxColorCount, setMaxColorCount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  // Add resize event listener to update sidebar state
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
        setIsInventoryManager(newRole === 'Inventory Manager');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [userRole]);

  // Fetch fabric definitions from your API
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8000/api/fabric-definitions/")
      .then((response) => {
        const fabricData = response.data;
        setFabrics(fabricData);
        setFilteredFabrics(fabricData);

        // Extract unique suppliers for filter dropdown
        const uniqueSuppliers = [...new Set(fabricData.map(fabric => fabric.supplier_name))];
        setSuppliers(uniqueSuppliers);

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching fabrics:", error);
        setMessage("Error loading fabrics.");
        setLoading(false);
      });
  }, []);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let result = [...fabrics];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        fabric =>
          fabric.fabric_name.toLowerCase().includes(term) ||
          fabric.supplier_name.toLowerCase().includes(term)
      );
    }

    // Apply supplier filter
    if (supplierFilter) {
      result = result.filter(fabric => fabric.supplier_name === supplierFilter);
    }

    // Apply color count range filter
    if (minColorCount !== '') {
      result = result.filter(fabric => fabric.variant_count >= parseInt(minColorCount));
    }
    if (maxColorCount !== '') {
      result = result.filter(fabric => fabric.variant_count <= parseInt(maxColorCount));
    }

    // Apply date range filter
    if (startDate) {
      result = result.filter(fabric => new Date(fabric.date_added) >= new Date(startDate));
    }
    if (endDate) {
      result = result.filter(fabric => new Date(fabric.date_added) <= new Date(endDate));
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle date sorting
      if (sortField === 'date_added') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      // Handle numeric sorting
      else if (sortField === 'variant_count' || sortField === 'id') {
        aVal = parseInt(aVal);
        bVal = parseInt(bVal);
      }
      // Handle string sorting
      else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredFabrics(result);
  }, [fabrics, searchTerm, sortField, sortOrder, supplierFilter, minColorCount, maxColorCount, startDate, endDate]);

  // Handler to navigate to the fabric variants page
  const handleViewVariants = (fabricId) => {
    navigate(`/fabric-definitions/${fabricId}`);
  };

  // Handler for sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Get sort icon based on current sort state
  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSupplierFilter('');
    setMinColorCount('');
    setMaxColorCount('');
    setStartDate('');
    setEndDate('');
    setSortField('date_added');
    setSortOrder('desc');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle edit fabric
  const handleEditFabric = (fabricId) => {
    navigate(`/edit-fabric/${fabricId}`);
  };

  // Check if fabric has any cutting records associated with it
  const checkFabricDependencies = async (fabricId) => {
    try {
      console.log(`Checking dependencies for fabric definition ${fabricId}`);

      // Direct check for cutting records that use this fabric definition
      const cuttingResponse = await axios.get(`http://localhost:8000/api/cutting/cutting-records/`);
      console.log("All cutting records:", cuttingResponse.data);

      // Check if any cutting record directly references this fabric definition
      const hasCuttingRecords = cuttingResponse.data.some(
        record => record.fabric_definition === fabricId || record.fabric_definition === parseInt(fabricId)
      );

      if (hasCuttingRecords) {
        console.log(`Fabric definition ${fabricId} is directly used in cutting records`);
        return true;
      }

      // Check for cutting records at the variant level
      try {
        // First, get all variants for this fabric definition
        const variantsResponse = await axios.get(`http://localhost:8000/api/fabric-definitions/${fabricId}/variants/`);
        const variants = variantsResponse.data;
        console.log(`Found ${variants.length} variants for fabric definition ${fabricId}:`, variants);

        // Check if any cutting record details reference any of these variants
        for (const record of cuttingResponse.data) {
          if (record.details && record.details.length > 0) {
            for (const variant of variants) {
              // Check if any detail uses this variant
              const usesVariant = record.details.some(
                detail => detail.fabric_variant === variant.id || detail.fabric_variant === parseInt(variant.id)
              );

              if (usesVariant) {
                console.log(`Variant ${variant.id} is used in cutting record ${record.id}`);
                return true;
              }
            }
          }
        }

        // Fallback to checking each variant's history if needed
        for (const variant of variants) {
          try {
            console.log(`Checking cutting history for variant ${variant.id}`);
            const variantHistoryResponse = await axios.get(`http://localhost:8000/api/cutting/fabric-variant/${variant.id}/history/`);
            console.log(`Variant ${variant.id} history:`, variantHistoryResponse.data);

            if (variantHistoryResponse.data &&
                variantHistoryResponse.data.cutting_history &&
                variantHistoryResponse.data.cutting_history.length > 0) {
              console.log(`Variant ${variant.id} has ${variantHistoryResponse.data.cutting_history.length} cutting records`);
              return true; // Found cutting records for this variant
            }
          } catch (error) {
            console.error(`Error checking cutting history for variant ${variant.id}:`, error);

            // If it's a 404 error, it means the endpoint doesn't exist or the variant doesn't exist
            // In this case, we can continue checking other variants
            if (error.response && error.response.status === 404) {
              console.log(`Variant ${variant.id} not found or endpoint not available`);
              continue;
            }

            // For other errors, log more details but continue checking other variants
            console.error("Error details:", error.response ? error.response.data : "No response data");
          }
        }
      } catch (error) {
        console.error(`Error fetching variants for fabric definition ${fabricId}:`, error);
        console.error("Error details:", error.response ? error.response.data : "No response data");

        // If we can't check variants, assume there might be dependencies
        return true;
      }

      // No cutting records found - fabric can be safely deleted
      console.log(`No cutting records found for fabric definition ${fabricId} or its variants`);
      return false;
    } catch (error) {
      console.error("Error checking fabric dependencies:", error);
      console.error("Error details:", error.response ? error.response.data : "No response data");

      // If there's an error, assume there might be dependencies to prevent accidental deletion
      return true;
    }
  };

  // Handle delete button click
  const handleDeleteClick = async (fabric) => {
    setFabricToDelete(fabric);
    setIsDeleting(false);

    // Check for dependencies
    const hasDeps = await checkFabricDependencies(fabric.id);
    setHasDependencies(hasDeps);

    // Show the confirmation modal
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (hasDependencies) {
      return; // Don't allow deletion if there are dependencies
    }

    setIsDeleting(true);

    try {
      console.log(`Attempting to delete fabric definition with ID: ${fabricToDelete.id}`);

      // Try to delete all variants first if there are any issues
      try {
        // Get all variants for this fabric definition
        const variantsResponse = await axios.get(`http://localhost:8000/api/fabric-definitions/${fabricToDelete.id}/variants/`);
        const variants = variantsResponse.data;
        console.log(`Found ${variants.length} variants to delete for fabric definition ${fabricToDelete.id}`);

        // Try to delete each variant individually
        for (const variant of variants) {
          try {
            console.log(`Attempting to delete variant ${variant.id}`);

            // First try to update the variant to have 0 yards
            await axios.put(`http://localhost:8000/api/fabric-variants/${variant.id}/`, {
              fabric_definition: fabricToDelete.id,
              color: variant.color,
              color_name: variant.color_name || variant.color,
              total_yard: 0,
              available_yard: 0,
              price_per_yard: 0
            });

            // Then try to delete it
            await axios.delete(`http://localhost:8000/api/fabric-variants/${variant.id}/`);
            console.log(`Successfully deleted variant ${variant.id}`);
          } catch (variantError) {
            console.error(`Error deleting variant ${variant.id}:`, variantError);
            // Continue with other variants even if one fails
          }
        }
      } catch (variantsError) {
        console.error("Error handling variants:", variantsError);
        // Continue with fabric definition deletion even if variants handling fails
      }

      // Now try to delete the fabric definition
      const response = await axios.delete(`http://localhost:8000/api/fabric-definitions/${fabricToDelete.id}/`);
      console.log("Delete response:", response);

      // Remove the deleted fabric from the lists
      const updatedFabrics = fabrics.filter(f => f.id !== fabricToDelete.id);
      setFabrics(updatedFabrics);
      setFilteredFabrics(filteredFabrics.filter(f => f.id !== fabricToDelete.id));

      // Close the modal and show success message
      setShowDeleteModal(false);
      setSuccess(`Fabric "${fabricToDelete.fabric_name}" and all its variants deleted successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting fabric:", error);

      // Log detailed error information
      console.error("Error details:", error.response ? error.response.data : "No response data");
      console.error("Error status:", error.response ? error.response.status : "No status");

      // Provide more specific error messages based on the error
      let errorMessage = "Failed to delete fabric. Please try again.";

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.detail || "Bad request. The fabric may be referenced by other records.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to delete this fabric.";
        } else if (error.response.status === 404) {
          errorMessage = "Fabric not found. It may have been already deleted.";
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
    setFabricToDelete(null);
    setHasDependencies(false);
  };

  // Render enhanced table view
  const renderTableView = () => {
    return (
      <div className="table-responsive">
        <Table hover bordered className="align-middle shadow-sm">
          <thead className="bg-light">
            <tr>
              <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', width: '5%' }} className="text-center">
                ID {getSortIcon('id')}
              </th>
              <th onClick={() => handleSort('fabric_name')} style={{ cursor: 'pointer', width: '25%' }}>
                Fabric Name {getSortIcon('fabric_name')}
              </th>
              <th onClick={() => handleSort('supplier_name')} style={{ cursor: 'pointer', width: '20%' }}>
                Supplier {getSortIcon('supplier_name')}
              </th>
              <th onClick={() => handleSort('date_added')} style={{ cursor: 'pointer', width: '15%' }}>
                Date Added {getSortIcon('date_added')}
              </th>
              <th onClick={() => handleSort('variant_count')} style={{ cursor: 'pointer', width: '15%' }} className="text-center">
                Colors {getSortIcon('variant_count')}
              </th>
              <th style={{ width: '25%' }} className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFabrics.map((fabric) => (
              <tr key={fabric.id} className="align-middle">
                <td className="text-center">{fabric.id}</td>
                <td>
                  <div className="d-flex align-items-center">
                    <FaTshirt className="me-2 text-primary" />
                    <span
                      style={{ cursor: 'pointer', fontWeight: 'bold' }}
                      onClick={() => handleViewVariants(fabric.id)}
                    >
                      {fabric.fabric_name}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <FaUserTie className="me-2 text-secondary" />
                    {fabric.supplier_name}
                  </div>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <FaCalendarAlt className="me-2 text-secondary" />
                    {formatDate(fabric.date_added)}
                  </div>
                </td>
                <td className="text-center">
                  <Badge
                    bg="primary"
                    pill
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                  >
                    <FaPalette className="me-1" /> {fabric.variant_count}
                  </Badge>
                </td>
                <td className="text-center">
                  <div className="d-flex justify-content-center gap-2">
                    <Button
                      variant="info"
                      className="btn-sm"
                      onClick={() => handleViewVariants(fabric.id)}
                    >
                      <FaEye className="me-1" /> View
                    </Button>

                    {isInventoryManager && (
                      <>
                        <Button
                          variant="warning"
                          className="btn-sm"
                          onClick={() => handleEditFabric(fabric.id)}
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="btn-sm"
                          onClick={() => handleDeleteClick(fabric)}
                        >
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
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
            <FaTshirt className="me-2 text-primary" />
            Fabric Inventory
          </h2>
          {isInventoryManager && (
            <Button
              variant="success"
              onClick={() => navigate('/addfabric')}
            >
              Add New Fabric
            </Button>
          )}
        </div>

        {message && <Alert variant="success" className="text-center">{message}</Alert>}
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {fabricToDelete && (
              <>
                <p>Are you sure you want to delete this fabric?</p>
                <Table bordered size="sm" className="mt-3">
                  <tbody>
                    <tr>
                      <td><strong>Fabric Name:</strong></td>
                      <td>{fabricToDelete.fabric_name}</td>
                    </tr>
                    <tr>
                      <td><strong>Supplier:</strong></td>
                      <td>{fabricToDelete.supplier_name}</td>
                    </tr>
                    <tr>
                      <td><strong>Date Added:</strong></td>
                      <td>{formatDate(fabricToDelete.date_added)}</td>
                    </tr>
                    <tr>
                      <td><strong>Color Variants:</strong></td>
                      <td>{fabricToDelete.variant_count}</td>
                    </tr>
                  </tbody>
                </Table>

                {hasDependencies && (
                  <Alert variant="warning" className="mt-3">
                    <strong>Warning:</strong> This fabric cannot be deleted because it or one of its color variants is being used in cutting records.
                    <div className="mt-2">
                      <small>
                        To delete this fabric, you must first delete all cutting records that use it or any of its color variants. You can view these records by clicking "View" to see the variants, then "View Inventory" for each variant to check its cutting history.
                      </small>
                    </div>
                  </Alert>
                )}

                {!hasDependencies && (
                  <Alert variant="success" className="mt-3">
                    <strong>Good news!</strong> This fabric and all its variants have no cutting records and can be safely deleted.
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
              disabled={isDeleting || hasDependencies}
            >
              {isDeleting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Deleting...
                </>
              ) : (
                'Delete Fabric'
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Search and Filter Section */}
        <Card className="mb-4 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
          <Card.Body>
            <Row className="g-3">
              {/* Search Bar */}
              <Col lg={4} md={6} sm={12}>
                <InputGroup>
                  <InputGroup.Text className="bg-white">
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by fabric name or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0"
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Col>

              {/* Supplier Filter */}
              <Col lg={3} md={6} sm={12}>
                <DropdownButton
                  id="supplier-filter"
                  title={supplierFilter || "Filter by Supplier"}
                  variant="outline-primary"
                  className="w-100"
                >
                  <Dropdown.Item onClick={() => setSupplierFilter('')}>All Suppliers</Dropdown.Item>
                  <Dropdown.Divider />
                  {suppliers.map((supplier, index) => (
                    <Dropdown.Item
                      key={index}
                      onClick={() => setSupplierFilter(supplier)}
                      active={supplierFilter === supplier}
                    >
                      {supplier}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </Col>

              {/* Date Range Filter */}
              <Col lg={3} md={6} sm={12}>
                <InputGroup>
                  <InputGroup.Text className="bg-white">
                    <FaCalendarAlt />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    placeholder="From"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-start-0"
                  />
                  <Form.Control
                    type="date"
                    placeholder="To"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </InputGroup>
              </Col>

              {/* Color Count Range */}
              <Col lg={2} md={6} sm={12}>
                <InputGroup>
                  <InputGroup.Text className="bg-white">
                    <FaPalette />
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={minColorCount}
                    onChange={(e) => setMinColorCount(e.target.value)}
                    className="border-start-0"
                  />
                  <Form.Control
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={maxColorCount}
                    onChange={(e) => setMaxColorCount(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            <div className="d-flex justify-content-between mt-3">
              <div>
                <Badge bg="primary" className="me-2 p-2">
                  {filteredFabrics.length} fabrics found
                </Badge>
                {(searchTerm || supplierFilter || minColorCount || maxColorCount || startDate || endDate) && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
              <div>
                <Form.Select
                  size="sm"
                  style={{ width: 'auto', display: 'inline-block' }}
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="border-primary"
                >
                  <option value="date_added-desc">Newest First</option>
                  <option value="date_added-asc">Oldest First</option>
                  <option value="fabric_name-asc">Name (A-Z)</option>
                  <option value="fabric_name-desc">Name (Z-A)</option>
                  <option value="supplier_name-asc">Supplier (A-Z)</option>
                  <option value="supplier_name-desc">Supplier (Z-A)</option>
                  <option value="variant_count-desc">Most Colors</option>
                  <option value="variant_count-asc">Fewest Colors</option>
                </Form.Select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading fabrics...</p>
          </div>
        ) : filteredFabrics.length === 0 ? (
          <Alert variant="info" className="text-center">
            No fabrics found matching your filters. Try adjusting your search criteria.
          </Alert>
        ) : (
          renderTableView()
        )}
      </Container>
    </>
  );
};

export default ViewFabrics;
