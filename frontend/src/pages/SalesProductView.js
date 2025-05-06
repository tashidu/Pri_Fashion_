import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, InputGroup, Button, Badge, Spinner, Image, Table } from 'react-bootstrap';
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaEye, FaEyeSlash, FaImage, FaMoneyBillWave, FaBoxes } from 'react-icons/fa';
import SalesTeamNavBar from '../components/SalesTeamNavBar';
import 'bootstrap/dist/css/bootstrap.min.css';

const SalesProductView = () => {
    const [products, setProducts] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortField, setSortField] = useState("product_name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? "card" : "table");
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // Effect to handle sidebar state based on window size
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
            setViewMode(window.innerWidth < 768 ? "card" : "table");
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch products data
    useEffect(() => {
        setLoading(true);
        axios
            .get("http://localhost:8000/api/finished_product/sales-products/")
            .then((res) => {
                console.log("API Response:", res.data);
                setProducts(res.data);
                setLoading(false);

                // If no products are returned, set a more specific error message
                if (res.data.length === 0) {
                    setError("No products found. This could be because no products have been assigned a selling price yet.");
                }
            })
            .catch((err) => {
                console.error("Error fetching product list:", err);
                setError("Failed to fetch product list. Please try again later.");
                setLoading(false);
            });
    }, []);

    // Toggle expanded row
    const toggleRow = (productId) => {
        setExpandedRows((prev) => ({ ...prev, [productId]: !prev[productId] }));
    };

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Handle status filter
    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    };

    // Render sort indicator
    const renderSortIndicator = (field) => {
        if (sortField !== field) return null;
        return sortDirection === "asc" ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />;
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "N/A";
        return `Rs. ${parseFloat(amount).toFixed(2)}`;
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "completed":
                return "bg-success";
            case "in_progress":
                return "bg-warning";
            case "pending":
                return "bg-info";
            default:
                return "bg-secondary";
        }
    };

    // Get color code
    const getColorCode = (color) => {
        return color || "#CCCCCC";
    };

    // Filter and sort products
    const filteredAndSortedProducts = products
        .filter((product) => {
            // Apply search filter
            const searchMatch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());

            // Apply status filter
            let statusMatch = true;
            const stockLevel = product.packing_inventory?.total_quantity || product.available_quantity;
            if (statusFilter === "in_stock") {
                statusMatch = stockLevel > 0;
            } else if (statusFilter === "out_of_stock") {
                statusMatch = stockLevel <= 0;
            }

            return searchMatch && statusMatch;
        })
        .sort((a, b) => {
            // Apply sorting
            if (sortField === "product_name") {
                return sortDirection === "asc"
                    ? a.product_name.localeCompare(b.product_name)
                    : b.product_name.localeCompare(a.product_name);
            } else if (sortField === "selling_price") {
                const priceA = a.selling_price || 0;
                const priceB = b.selling_price || 0;
                return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
            } else if (sortField === "available_quantity") {
                return sortDirection === "asc"
                    ? a.available_quantity - b.available_quantity
                    : b.available_quantity - a.available_quantity;
            }
            return 0;
        });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAndSortedProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Render table view
    const renderTableView = () => (
        <div className="table-responsive">
            <Table hover className="align-middle">
                <thead className="table-light">
                    <tr>
                        <th className="cursor-pointer" onClick={() => handleSort("product_name")}>
                            <div className="d-flex align-items-center">
                                Product Name {renderSortIndicator("product_name")}
                            </div>
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("selling_price")}>
                            <div className="d-flex align-items-center">
                                Selling Price {renderSortIndicator("selling_price")}
                            </div>
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("available_quantity")}>
                            <div className="d-flex align-items-center">
                                Stock Level {renderSortIndicator("available_quantity")}
                            </div>
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={4} className="text-center py-4">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-2">Loading products...</p>
                            </td>
                        </tr>
                    ) : currentItems.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center py-4">
                                No products found.
                            </td>
                        </tr>
                    ) : (
                        currentItems.map((product) => (
                            <React.Fragment key={product.id}>
                                <tr className={expandedRows[product.id] ? "expanded-row" : ""}>
                                    <td className="fw-medium">{product.product_name}</td>
                                    <td>{formatCurrency(product.selling_price)}</td>
                                    <td>
                                        <Badge bg={(product.packing_inventory?.total_quantity || product.available_quantity) > 0 ? "success" : "danger"}>
                                            {product.packing_inventory?.total_quantity || product.available_quantity} items
                                        </Badge>
                                    </td>
                                    <td>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => toggleRow(product.id)}
                                        >
                                            {expandedRows[product.id] ? (
                                                <><FaEyeSlash className="me-1" /> Hide</>
                                            ) : (
                                                <><FaEye className="me-1" /> View</>
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                                {expandedRows[product.id] && (
                                    <tr className="expanded-details">
                                        <td colSpan={4}>
                                            <Card className="border-0 shadow-sm">
                                                <Card.Body>
                                                    <Row>
                                                        <Col md={4} className="text-center mb-3 mb-md-0">
                                                            {product.product_image ? (
                                                                <Image
                                                                    src={product.product_image}
                                                                    alt={product.product_name}
                                                                    fluid
                                                                    className="product-image"
                                                                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                                                                />
                                                            ) : (
                                                                <div className="no-image-placeholder d-flex flex-column align-items-center justify-content-center p-4 bg-light rounded" style={{ height: '200px' }}>
                                                                    <FaImage size={40} className="text-secondary mb-2" />
                                                                    <p className="text-muted">No image available</p>
                                                                </div>
                                                            )}
                                                        </Col>
                                                        <Col md={8}>
                                                            <h5 className="mb-3"><FaBoxes className="me-2 text-primary" />Packing Inventory</h5>
                                                            <Table bordered size="sm" className="mb-4">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th>6-Packs</th>
                                                                        <th>12-Packs</th>
                                                                        <th>Extra Items</th>
                                                                        <th>Total Items</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>{product.packing_inventory?.number_of_6_packs || 0}</td>
                                                                        <td>{product.packing_inventory?.number_of_12_packs || 0}</td>
                                                                        <td>{product.packing_inventory?.extra_items || 0}</td>
                                                                        <td className="fw-bold">{product.packing_inventory?.total_quantity || product.available_quantity}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>

                                                            <h5 className="mb-3"><FaMoneyBillWave className="me-2 text-primary" />Pricing Information</h5>
                                                            <Table bordered size="sm">
                                                                <tbody>
                                                                    <tr>
                                                                        <td className="fw-medium">Selling Price:</td>
                                                                        <td>{formatCurrency(product.selling_price)}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </Table>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>
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
                    <h2 className="mb-4">Product Catalog</h2>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Search and filter controls */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Row>
                                <Col md={6} className="mb-3 mb-md-0">
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FaSearch />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search products..."
                                            value={searchTerm}
                                            onChange={handleSearch}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={3} className="mb-3 mb-md-0">
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FaFilter />
                                        </InputGroup.Text>
                                        <Form.Select value={statusFilter} onChange={handleStatusFilter}>
                                            <option value="all">All Products</option>
                                            <option value="in_stock">In Stock</option>
                                            <option value="out_of_stock">Out of Stock</option>
                                        </Form.Select>
                                    </InputGroup>
                                </Col>
                                <Col md={3} className="d-flex justify-content-end">
                                    <div className="btn-group">
                                        <Button
                                            variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
                                            onClick={() => setViewMode('table')}
                                            title="Table View"
                                        >
                                            <i className="bi bi-table"></i>
                                        </Button>
                                        <Button
                                            variant={viewMode === 'card' ? 'primary' : 'outline-primary'}
                                            onClick={() => setViewMode('card')}
                                            title="Card View"
                                        >
                                            <i className="bi bi-grid"></i>
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Products list */}
                    <Card className="shadow-sm">
                        <Card.Body className="p-0 p-md-3">
                            {renderTableView()}
                        </Card.Body>
                    </Card>

                    {/* Pagination */}
                    {filteredAndSortedProducts.length > 0 && (
                        <nav className="mt-4" aria-label="Product pagination">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <Button variant="outline-primary" className="page-link" onClick={prevPage}>
                                        Previous
                                    </Button>
                                </li>
                                <li className="page-item">
                                    <span className="page-link">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                </li>
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <Button variant="outline-primary" className="page-link" onClick={nextPage}>
                                        Next
                                    </Button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </Container>
            </div>
        </>
    );
};

export default SalesProductView;
