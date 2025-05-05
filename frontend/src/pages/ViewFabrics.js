import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, Form, InputGroup,
  Button, Badge, Dropdown, DropdownButton,
  Spinner, Alert, Table
} from 'react-bootstrap';
import {
  FaSearch, FaSort, FaSortUp, FaSortDown,
  FaEye, FaTshirt, FaCalendarAlt,
  FaUserTie, FaPalette
} from 'react-icons/fa';

const ViewFabrics = () => {
  const [fabrics, setFabrics] = useState([]);
  const [filteredFabrics, setFilteredFabrics] = useState([]);
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
              <th style={{ width: '20%' }} className="text-center">Actions</th>
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
                  <Button
                    variant="info"
                    className="btn-sm"
                    onClick={() => handleViewVariants(fabric.id)}
                  >
                    <FaEye className="me-1" /> View Variants
                  </Button>
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
          <Button
            variant="success"
            onClick={() => navigate('/addfabric')}
          >
            Add New Fabric
          </Button>
        </div>

        {message && <Alert variant="danger" className="text-center">{message}</Alert>}

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
