import React, { useState, useEffect, useCallback, useRef } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Container, Row, Col, Card, Button, Badge, Tooltip, OverlayTrigger, Modal, Table, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardCard from "../components/DashboardCard";
import {
  FaTshirt,
  FaCut,
  FaBoxes,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaBuilding,
  FaInfoCircle,
  FaSearch,
  FaHistory,
  FaArrowDown,
  FaKeyboard,
  FaBell
} from 'react-icons/fa';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

function InventoryDashboard() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
    const [showShortcutModal, setShowShortcutModal] = useState(false);
    const [stats, setStats] = useState({
        fabricCount: 0,
        cuttingCount: 0,
        sewingCount: 0,
        packingCount: 0,
        supplierCount: 0,
        lowStockCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [chartData, setChartData] = useState([
        { name: 'Jan', fabricUsage: 650, cuttingRecords: 120 },
        { name: 'Feb', fabricUsage: 590, cuttingRecords: 115 },
        { name: 'Mar', fabricUsage: 800, cuttingRecords: 130 },
        { name: 'Apr', fabricUsage: 810, cuttingRecords: 125 },
        { name: 'May', fabricUsage: 760, cuttingRecords: 140 },
        { name: 'Jun', fabricUsage: 850, cuttingRecords: 135 }
    ]);
    const dashboardRef = useRef(null);

    // Add resize event listener to update sidebar state
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch dashboard statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);

                // Fetch dashboard statistics
                try {
                    const statsResponse = await axios.get('http://localhost:8000/api/reports/dashboard/stats/');
                    setStats({
                        fabricCount: statsResponse.data.fabric_count,
                        cuttingCount: statsResponse.data.cutting_count,
                        sewingCount: statsResponse.data.sewing_count,
                        packingCount: statsResponse.data.packing_count,
                        supplierCount: statsResponse.data.supplier_count,
                        lowStockCount: statsResponse.data.low_stock_count
                    });
                } catch (error) {
                    console.error('Error fetching dashboard stats:', error);
                    // Fallback to sample data if API fails
                    setStats({
                        fabricCount: 24,
                        cuttingCount: 12,
                        sewingCount: 18,
                        packingCount: 8,
                        supplierCount: 5,
                        lowStockCount: 3
                    });
                }

                // Fetch recent activity
                try {
                    const activityResponse = await axios.get('http://localhost:8000/api/reports/dashboard/recent-activity/');
                    setRecentActivity(activityResponse.data);
                } catch (error) {
                    console.error('Error fetching recent activity:', error);
                    // Fallback to sample data if API fails
                    setRecentActivity([
                        { id: 1, type: 'fabric', action: 'added', item: 'Cotton Blend', date: '2023-07-15', user: 'John' },
                        { id: 2, type: 'cutting', action: 'updated', item: 'Denim Jeans', date: '2023-07-14', user: 'Sarah' },
                        { id: 3, type: 'sewing', action: 'completed', item: 'T-Shirt Batch #45', date: '2023-07-13', user: 'Mike' },
                        { id: 4, type: 'packing', action: 'started', item: 'Summer Collection', date: '2023-07-12', user: 'Lisa' },
                        { id: 5, type: 'fabric', action: 'low stock', item: 'Silk', date: '2023-07-11', user: 'System' }
                    ]);
                }

                // Fetch low stock items
                try {
                    const lowStockResponse = await axios.get('http://localhost:8000/api/reports/dashboard/low-stock/');
                    setLowStockItems(lowStockResponse.data);
                } catch (error) {
                    console.error('Error fetching low stock items:', error);
                    // Fallback to sample data if API fails
                    setLowStockItems([
                        { id: 1, name: 'Black Cotton', type: 'fabric', current: 12, threshold: 20 },
                        { id: 2, name: 'Blue Denim', type: 'fabric', current: 8, threshold: 15 },
                        { id: 3, name: 'Red Polyester', type: 'fabric', current: 5, threshold: 10 }
                    ]);
                }

                // Fetch production trends for chart
                try {
                    const trendsResponse = await axios.get('http://localhost:8000/api/reports/dashboard/production-trends/');
                    setChartData(trendsResponse.data);
                } catch (error) {
                    console.error('Error fetching production trends:', error);
                    // Chart data remains as the default sample data
                }

                setLoading(false);
            } catch (error) {
                console.error('Error in dashboard data fetching:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Keyboard shortcut handler
    const handleKeyDown = useCallback((e) => {
        // Only process if no input elements are focused
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'SELECT') {
            return;
        }

        switch (e.key) {
            case 'f':
                if (e.ctrlKey) {
                    e.preventDefault();
                    navigate('/viewfabric');
                }
                break;
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    navigate('/viewcutting');
                }
                break;
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    navigate('/daily-sewing-history');
                }
                break;
            case 'p':
                if (e.ctrlKey) {
                    e.preventDefault();
                    navigate('/add-packing-session');
                }
                break;
            case 'u':
                if (e.ctrlKey) {
                    e.preventDefault();
                    navigate('/viewsuppliers');
                }
                break;
            case '?':
                e.preventDefault();
                setShowShortcutModal(true);
                break;
            default:
                break;
        }
    }, [navigate]);

    // Add keyboard shortcut listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // Chart data is now managed through the chartData state

    // Render activity icon based on type
    const getActivityIcon = (type) => {
        switch (type) {
            case 'fabric':
                return <FaTshirt className="text-primary" />;
            case 'cutting':
                return <FaCut className="text-success" />;
            case 'sewing':
                return <FaCalendarCheck className="text-info" />;
            case 'packing':
                return <FaBoxes className="text-warning" />;
            default:
                return <FaInfoCircle className="text-secondary" />;
        }
    };

    // Render activity badge based on action
    const getActionBadge = (action) => {
        switch (action) {
            case 'added':
                return <Badge bg="success">Added</Badge>;
            case 'updated':
                return <Badge bg="primary">Updated</Badge>;
            case 'completed':
                return <Badge bg="info">Completed</Badge>;
            case 'started':
                return <Badge bg="warning">Started</Badge>;
            case 'low stock':
                return <Badge bg="danger">Low Stock</Badge>;
            default:
                return <Badge bg="secondary">{action}</Badge>;
        }
    };

    // Tooltip for shortcut keys
    const renderTooltip = (props, shortcut, description) => (
        <Tooltip id="button-tooltip" {...props}>
            {description} <strong>({shortcut})</strong>
        </Tooltip>
    );

    return (
        <>
        <RoleBasedNavBar/>
        <div
            ref={dashboardRef}
            style={{
                marginLeft: isSidebarOpen ? "240px" : "70px",
                width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
                transition: "all 0.3s ease",
                padding: "20px"
            }}
        >
            <Container fluid>
                {/* Dashboard Header */}
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="mb-1">Inventory Dashboard</h1>
                                <p className="text-muted">
                                    Welcome, <span className="fw-bold">Inventory Manager</span>. Here's your inventory overview.
                                </p>
                            </div>
                            <div>
                                <OverlayTrigger
                                    placement="left"
                                    delay={{ show: 250, hide: 400 }}
                                    overlay={(props) => renderTooltip(props, '?', 'Keyboard Shortcuts')}
                                >
                                    <Button
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={() => setShowShortcutModal(true)}
                                    >
                                        <FaKeyboard />
                                    </Button>
                                </OverlayTrigger>
                                <Button variant="primary">
                                    <FaSearch className="me-2" />
                                    Quick Search
                                </Button>
                            </div>
                        </div>
                    </Col>
                </Row>

                {/* Welcome Card - Only shown on first visit */}
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow-sm border-0" style={{ backgroundColor: "#f8f9fa" }}>
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="me-4 p-3 rounded-circle" style={{ backgroundColor: "#D9EDFB" }}>
                                        <FaInfoCircle size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h5 className="mb-1">Quick Tips</h5>
                                        <p className="mb-0">
                                            Press <kbd>?</kbd> anytime to see keyboard shortcuts. Use the quick action buttons below for common tasks.
                                        </p>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="ms-auto"
                                        onClick={() => document.getElementById('quick-actions').scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Get Started
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Stats Cards */}
                <Row>
                    <Col md={4} lg={2} sm={6} className="mb-4">
                        <DashboardCard
                            title="Fabrics"
                            value={loading ? "..." : stats.fabricCount}
                            icon={<FaTshirt />}
                            linkTo="/viewfabric"
                        />
                    </Col>

                    <Col md={4} lg={2} sm={6} className="mb-4">
                        <DashboardCard
                            title="Cutting"
                            value={loading ? "..." : stats.cuttingCount}
                            icon={<FaCut />}
                            linkTo="/viewcutting"
                        />
                    </Col>

                    <Col md={4} lg={2} sm={6} className="mb-4">
                        <DashboardCard
                            title="Sewing"
                            value={loading ? "..." : stats.sewingCount}
                            icon={<FaCalendarCheck />}
                            linkTo="/daily-sewing-history"
                        />
                    </Col>

                    <Col md={4} lg={2} sm={6} className="mb-4">
                        <DashboardCard
                            title="Packing"
                            value={loading ? "..." : stats.packingCount}
                            icon={<FaBoxes />}
                            linkTo="/add-packing-session"
                        />
                    </Col>

                    <Col md={4} lg={2} sm={6} className="mb-4">
                        <DashboardCard
                            title="Suppliers"
                            value={loading ? "..." : stats.supplierCount}
                            icon={<FaBuilding />}
                            linkTo="/viewsuppliers"
                        />
                    </Col>

                    <Col md={4} lg={2} sm={6} className="mb-4">
                        <DashboardCard
                            title="Low Stock"
                            value={loading ? "..." : stats.lowStockCount}
                            icon={<FaExclamationTriangle />}
                            linkTo="#low-stock"
                            color="#FFECB3"
                        />
                    </Col>
                </Row>

                {/* Quick Actions */}
                <Row className="mb-4" id="quick-actions">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">Quick Actions</h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="d-flex flex-wrap gap-2">
                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={(props) => renderTooltip(props, 'Ctrl+F', 'View Fabrics')}
                                    >
                                        <Button variant="outline-primary" onClick={() => navigate('/viewfabric')}>
                                            <FaTshirt className="me-2" />
                                            View Fabrics
                                        </Button>
                                    </OverlayTrigger>

                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={(props) => renderTooltip(props, 'Ctrl+C', 'View Cutting')}
                                    >
                                        <Button variant="outline-success" onClick={() => navigate('/viewcutting')}>
                                            <FaCut className="me-2" />
                                            View Cutting
                                        </Button>
                                    </OverlayTrigger>

                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={(props) => renderTooltip(props, 'Ctrl+S', 'Sewing History')}
                                    >
                                        <Button variant="outline-info" onClick={() => navigate('/daily-sewing-history')}>
                                            <FaCalendarCheck className="me-2" />
                                            Sewing History
                                        </Button>
                                    </OverlayTrigger>

                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={(props) => renderTooltip(props, 'Ctrl+P', 'Add Packing')}
                                    >
                                        <Button variant="outline-warning" onClick={() => navigate('/add-packing-session')}>
                                            <FaBoxes className="me-2" />
                                            Add Packing
                                        </Button>
                                    </OverlayTrigger>

                                    <OverlayTrigger
                                        placement="top"
                                        delay={{ show: 250, hide: 400 }}
                                        overlay={(props) => renderTooltip(props, 'Ctrl+U', 'View Suppliers')}
                                    >
                                        <Button variant="outline-secondary" onClick={() => navigate('/viewsuppliers')}>
                                            <FaBuilding className="me-2" />
                                            View Suppliers
                                        </Button>
                                    </OverlayTrigger>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Main Content */}
                <Row>
                    {/* Chart Section */}
                    <Col lg={8} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Production Overview</h5>
                                <Button variant="link" size="sm" onClick={() => navigate('/reports')}>
                                    View Full Report
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ width: '100%', height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartData}
                                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="fabricUsage"
                                                name="Fabric Usage (yards)"
                                                stackId="1"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                fillOpacity={0.3}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="cuttingRecords"
                                                name="Cutting Records"
                                                stackId="2"
                                                stroke="#82ca9d"
                                                fill="#82ca9d"
                                                fillOpacity={0.3}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Recent Activity */}
                    <Col lg={4} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Recent Activity</h5>
                                <Button variant="link" size="sm">
                                    <FaHistory /> View All
                                </Button>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="activity-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {recentActivity.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="d-flex align-items-center p-3 border-bottom"
                                        >
                                            <div className="me-3">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-grow-1">
                                                <div className="d-flex justify-content-between">
                                                    <span className="fw-bold">{activity.item}</span>
                                                    <small className="text-muted">{activity.date}</small>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        {getActionBadge(activity.action)}
                                                        <small className="ms-2 text-muted">by {activity.user}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Low Stock Alert */}
                <Row id="low-stock">
                    <Col>
                        <Card className="shadow-sm mb-4">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <FaBell className="text-warning me-2" />
                                    Low Stock Alerts
                                </h5>
                                <Button variant="link" size="sm">
                                    <FaArrowDown /> Export
                                </Button>
                            </Card.Header>
                            <Card.Body>
                                {lowStockItems.length > 0 ? (
                                    <Table hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Type</th>
                                                <th>Current Stock</th>
                                                <th>Threshold</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.name}</td>
                                                    <td>{item.type}</td>
                                                    <td>{item.current}</td>
                                                    <td>{item.threshold}</td>
                                                    <td>
                                                        <Badge bg={item.current < item.threshold * 0.5 ? "danger" : "warning"}>
                                                            {item.current < item.threshold * 0.5 ? "Critical" : "Low"}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Button variant="outline-primary" size="sm">
                                                            Restock
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <Alert variant="success">
                                        <FaInfoCircle className="me-2" />
                                        All inventory items are above their minimum threshold levels.
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Keyboard Shortcuts Modal */}
            <Modal show={showShortcutModal} onHide={() => setShowShortcutModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Keyboard Shortcuts</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table striped bordered>
                        <thead>
                            <tr>
                                <th>Shortcut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>F</kbd></td>
                                <td>Go to View Fabrics</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>C</kbd></td>
                                <td>Go to View Cutting</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
                                <td>Go to Sewing History</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>P</kbd></td>
                                <td>Go to Add Packing Session</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>U</kbd></td>
                                <td>Go to View Suppliers</td>
                            </tr>
                            <tr>
                                <td><kbd>?</kbd></td>
                                <td>Show this shortcuts help</td>
                            </tr>
                        </tbody>
                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowShortcutModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
        </>
    );
}

export default InventoryDashboard;
