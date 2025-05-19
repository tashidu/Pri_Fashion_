import React, { useState, useEffect } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { authGet } from "../utils/api";
import { FaFilter, FaSync, FaEye, FaBoxes, FaCalendarAlt, FaStore, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { Badge, Modal, Button, Alert, Table, Card, Row, Col, Spinner } from "react-bootstrap";

function OrdersDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [packingInventory, setPackingInventory] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [packingRequirements, setPackingRequirements] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

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
        fetchPackingInventory();
    }, []);

    // Fetch all orders
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authGet("orders/orders/create/");
            // Store all orders for packing requirements calculation
            setAllOrders(response.data);

            // Filter for draft orders (not submitted)
            const draftOrders = response.data.filter(order => order.status === 'draft');
            setOrders(draftOrders);
            setFilteredOrders(draftOrders);

            // Calculate packing requirements after getting all orders
            calculatePackingRequirements(response.data, packingInventory);
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

    // Fetch packing inventory
    const fetchPackingInventory = async () => {
        setLoadingInventory(true);
        try {
            const response = await authGet("packing/inventory/");
            setPackingInventory(response.data);

            // If we already have orders, calculate packing requirements
            if (allOrders.length > 0) {
                calculatePackingRequirements(allOrders, response.data);
            }
        } catch (error) {
            console.error("Failed to fetch packing inventory:", error);
        } finally {
            setLoadingInventory(false);
        }
    };

    // Calculate total packing requirements for all orders
    const calculatePackingRequirements = (orders, inventory) => {
        // Create a map to store requirements by product
        const requirementsByProduct = {};

        // Process all orders with status that's not 'delivered' or 'paid'
        const relevantOrders = orders.filter(order =>
            !['delivered', 'paid'].includes(order.status)
        );

        // Calculate requirements for each order item
        relevantOrders.forEach(order => {
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const productId = item.finished_product;

                    if (!requirementsByProduct[productId]) {
                        // Find product in inventory
                        const productInventory = inventory.find(inv => inv.product_id === productId);

                        requirementsByProduct[productId] = {
                            productId,
                            productName: item.finished_product_name || (productInventory ? productInventory.product_name : `Product #${productId}`),
                            required6Packs: 0,
                            required12Packs: 0,
                            requiredExtraItems: 0,
                            available6Packs: productInventory ? productInventory.number_of_6_packs : 0,
                            available12Packs: productInventory ? productInventory.number_of_12_packs : 0,
                            availableExtraItems: productInventory ? productInventory.extra_items : 0,
                        };
                    }

                    // Add requirements
                    requirementsByProduct[productId].required6Packs += item.quantity_6_packs || 0;
                    requirementsByProduct[productId].required12Packs += item.quantity_12_packs || 0;
                    requirementsByProduct[productId].requiredExtraItems += item.quantity_extra_items || 0;
                });
            }
        });

        // Convert to array and calculate if sufficient
        const requirementsArray = Object.values(requirementsByProduct).map(req => ({
            ...req,
            sufficient6Packs: req.available6Packs >= req.required6Packs,
            sufficient12Packs: req.available12Packs >= req.required12Packs,
            sufficientExtraItems: req.availableExtraItems >= req.requiredExtraItems,
            sufficient:
                req.available6Packs >= req.required6Packs &&
                req.available12Packs >= req.required12Packs &&
                req.availableExtraItems >= req.requiredExtraItems
        }));

        setPackingRequirements(requirementsArray);
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

    // Calculate packing requirements for an order item
    const getPackingRequirements = (item) => {
        const inventory = packingInventory.find(inv => inv.product_id === item.finished_product);

        return {
            required6Packs: item.quantity_6_packs || 0,
            required12Packs: item.quantity_12_packs || 0,
            requiredExtraItems: item.quantity_extra_items || 0,
            available6Packs: inventory ? inventory.number_of_6_packs : 0,
            available12Packs: inventory ? inventory.number_of_12_packs : 0,
            availableExtraItems: inventory ? inventory.extra_items : 0,
            productName: inventory ? inventory.product_name : 'Unknown Product',
            sufficient: inventory ?
                (inventory.number_of_6_packs >= item.quantity_6_packs &&
                inventory.number_of_12_packs >= item.quantity_12_packs &&
                inventory.extra_items >= item.quantity_extra_items) : false
        };
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
                            <p className="text-center text-muted">View not submitted orders and packing requirements</p>
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

                    {/* Packing Requirements Section */}
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">Packing Requirements for All Orders</h5>
                        </div>
                        <div className="card-body">
                            {loadingInventory ? (
                                <div className="d-flex justify-content-center py-4">
                                    <Spinner animation="border" role="status" className="text-primary" />
                                    <span className="ms-2">Loading packing requirements...</span>
                                </div>
                            ) : packingRequirements.length === 0 ? (
                                <div className="text-center py-4">
                                    <FaBoxes className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                    <h5 className="text-muted">No packing requirements found</h5>
                                    <p className="text-muted mb-0">There are no active orders requiring packing.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th>6 Packs (Required/Available)</th>
                                                <th>12 Packs (Required/Available)</th>
                                                <th>Extra Items (Required/Available)</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {packingRequirements.map((req) => (
                                                <tr key={req.productId}>
                                                    <td className="fw-medium">{req.productName}</td>
                                                    <td>
                                                        {req.required6Packs} / {req.available6Packs}
                                                        {!req.sufficient6Packs && req.required6Packs > 0 && (
                                                            <Badge bg="danger" className="ms-2">Insufficient</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {req.required12Packs} / {req.available12Packs}
                                                        {!req.sufficient12Packs && req.required12Packs > 0 && (
                                                            <Badge bg="danger" className="ms-2">Insufficient</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {req.requiredExtraItems} / {req.availableExtraItems}
                                                        {!req.sufficientExtraItems && req.requiredExtraItems > 0 && (
                                                            <Badge bg="danger" className="ms-2">Insufficient</Badge>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {req.sufficient ? (
                                                            <div className="d-flex align-items-center">
                                                                <FaCheckCircle className="text-success me-2" />
                                                                <span>Ready to Pack</span>
                                                            </div>
                                                        ) : (
                                                            <div className="d-flex align-items-center">
                                                                <FaExclamationTriangle className="text-warning me-2" />
                                                                <span>Need More Inventory</span>
                                                            </div>
                                                        )}
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

                            <h6 className="fw-bold mb-3">Order Items & Packing Requirements</h6>
                            {selectedOrderItems.length > 0 ? (
                                <div className="table-responsive">
                                    <Table striped bordered hover>
                                        <thead className="table-light">
                                            <tr>
                                                <th>Product</th>
                                                <th>6 Packs (Required/Available)</th>
                                                <th>12 Packs (Required/Available)</th>
                                                <th>Extra Items (Required/Available)</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrderItems.map((item, index) => {
                                                const packingReq = getPackingRequirements(item);
                                                return (
                                                    <tr key={index}>
                                                        <td className="fw-medium">{item.finished_product_name || packingReq.productName}</td>
                                                        <td>
                                                            {item.quantity_6_packs} / {packingReq.available6Packs}
                                                            {packingReq.required6Packs > packingReq.available6Packs &&
                                                                <Badge bg="danger" className="ms-2">Insufficient</Badge>
                                                            }
                                                        </td>
                                                        <td>
                                                            {item.quantity_12_packs} / {packingReq.available12Packs}
                                                            {packingReq.required12Packs > packingReq.available12Packs &&
                                                                <Badge bg="danger" className="ms-2">Insufficient</Badge>
                                                            }
                                                        </td>
                                                        <td>
                                                            {item.quantity_extra_items} / {packingReq.availableExtraItems}
                                                            {packingReq.requiredExtraItems > packingReq.availableExtraItems &&
                                                                <Badge bg="danger" className="ms-2">Insufficient</Badge>
                                                            }
                                                        </td>
                                                        <td>
                                                            {packingReq.sufficient ? (
                                                                <Badge bg="success">Ready to Pack</Badge>
                                                            ) : (
                                                                <Badge bg="warning">Need More Inventory</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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
