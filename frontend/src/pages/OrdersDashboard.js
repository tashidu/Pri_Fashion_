import React, { useState, useEffect } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { authGet } from "../utils/api";
import { FaFilter, FaSync, FaEye, FaBoxes, FaCalendarAlt, FaStore } from "react-icons/fa";
import { Badge, Modal, Button, Alert, Table, Card, Row, Col } from "react-bootstrap";

function OrdersDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Add resize event listener to update sidebar state
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch orders on component mount
    useEffect(() => {
        fetchOrders();
    }, []);

    // Fetch all orders
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authGet("orders/orders/create/");

            // Filter for draft orders (not submitted)
            const draftOrders = response.data.filter(order => order.status === 'draft');
            setOrders(draftOrders);
            setFilteredOrders(draftOrders);

        } catch (error) {
            console.error("Failed to fetch orders:", error);
            if (error.response && error.response.data) {
                setError(`${error.response.data.detail || 'Failed to load orders. Please try again later.'}`);
            } else if (error.code === 'ERR_NETWORK') {
                setError("Network error: Cannot connect to the server. Please make sure the backend server is running.");
            } else {
                setError("Failed to load orders. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    // View order details
    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setSelectedOrderItems(order.items || []);
        setShowOrderModal(true);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get badge class based on order status
    const getBadgeClass = (status) => {
        switch (status) {
            case 'draft': return 'bg-secondary';
            case 'submitted': return 'bg-primary';
            case 'approved': return 'bg-info';
            case 'invoiced': return 'bg-warning';
            case 'delivered': return 'bg-success';
            case 'paid': return 'bg-success';
            case 'partially_paid': return 'bg-warning';
            case 'payment_due': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    return (
        <>
            <RoleBasedNavBar />
            <div
                style={{
                    marginLeft: isSidebarOpen ? "240px" : "70px",
                    width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
                    transition: "all 0.3s ease",
                    padding: "20px"
                }}
            >
                <div className="container-fluid">
                    <div className="row mb-4">
                        <div className="col-12">
                            <h2 className="text-center fw-bold text-primary">Orders Dashboard</h2>
                            <p className="text-center text-muted">View not submitted orders</p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Not Submitted Orders Section */}
                    <div className="card shadow-sm mb-4" style={{ backgroundColor: "#D9EDFB" }}>
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Not Submitted Orders</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-10">
                                    <div className="input-group">
                                        <span className="input-group-text bg-light">
                                            <FaFilter className="text-secondary" />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by shop name..."
                                            onChange={(e) => {
                                                const searchTerm = e.target.value.toLowerCase();
                                                setFilteredOrders(
                                                    orders.filter(order =>
                                                        order.shop_name?.toLowerCase().includes(searchTerm) ||
                                                        String(order.id).includes(searchTerm)
                                                    )
                                                );
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-2">
                                    <button
                                        onClick={fetchOrders}
                                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                                    >
                                        <FaSync className="me-2" /> Refresh
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="d-flex justify-content-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : filteredOrders.length === 0 ? (
                                <div className="text-center py-4">
                                    <FaBoxes className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                    <h5 className="text-muted">No draft orders found</h5>
                                    <p className="text-muted mb-0">All orders have been submitted or no orders exist yet.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Shop</th>
                                                <th>Status</th>
                                                <th>Created Date</th>
                                                <th>Items</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="fw-medium">#{order.id}</td>
                                                    <td>
                                                        <FaStore className="me-1" />
                                                        {order.shop_name || order.shop}
                                                    </td>
                                                    <td>
                                                        <Badge bg={getBadgeClass(order.status).replace('bg-', '')}>
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <FaCalendarAlt className="me-1" />
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td>{order.items?.length || 0} items</td>
                                                    <td>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => viewOrderDetails(order)}
                                                        >
                                                            <FaEye className="me-1" /> View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            <Modal
                show={showOrderModal}
                onHide={() => setShowOrderModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Order #{selectedOrder?.id} - {selectedOrder?.shop_name}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Card className="h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                        <Card.Body>
                                            <h6 className="fw-bold mb-3">Order Information</h6>
                                            <p><strong>Shop:</strong> {selectedOrder.shop_name}</p>
                                            <p><strong>Created:</strong> {formatDate(selectedOrder.created_at)}</p>
                                            <p><strong>Status:</strong> <Badge bg={getBadgeClass(selectedOrder.status).replace('bg-', '')}>{selectedOrder.status.toUpperCase()}</Badge></p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <h6 className="fw-bold mb-3">Order Items</h6>
                            {selectedOrderItems.length > 0 ? (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th>6 Packs</th>
                                                <th>12 Packs</th>
                                                <th>Extra Items</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrderItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="fw-medium">{item.finished_product_name || 'Product #' + item.finished_product}</td>
                                                    <td>{item.quantity_6_packs || 0}</td>
                                                    <td>{item.quantity_12_packs || 0}</td>
                                                    <td>{item.quantity_extra_items || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            ) : (
                                <Alert variant="info">No items in this order.</Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default OrdersDashboard;
