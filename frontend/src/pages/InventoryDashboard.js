import React, { useState, useEffect, useCallback, useRef } from "react";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Container, Row, Col, Card, Button, Badge, Tooltip, OverlayTrigger, Modal, Table, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardCard from "../components/DashboardCard";
import {
  FaTshirt,
  FaCut,
  FaBoxes,
  FaCalendarCheck,
  FaBuilding,
  FaInfoCircle,
  FaSearch,
  FaKeyboard,
  FaSync
} from 'react-icons/fa';
// No chart imports needed

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
    const [remainingFabrics, setRemainingFabrics] = useState([]);
    const [topFabricColors, setTopFabricColors] = useState([]);
    const dashboardRef = useRef(null);

    // New state variables for activity refresh
    const [refreshingActivity, setRefreshingActivity] = useState(false);
    const [lastActivityUpdate, setLastActivityUpdate] = useState(null);
    const refreshIntervalRef = useRef(null);

    // Add resize event listener to update sidebar state
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Function to fetch only recent activity data
    const fetchRecentActivity = async (isInitialLoad = false) => {
        try {
            if (!isInitialLoad) {
                setRefreshingActivity(true);
            }

            const activityResponse = await axios.get('http://localhost:8000/api/reports/dashboard/recent-activity/');
            setRecentActivity(activityResponse.data);

            // Update last refresh time
            setLastActivityUpdate(new Date());
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            // Only set empty array on initial load to avoid clearing existing data on refresh errors
            if (isInitialLoad) {
                setRecentActivity([]);
            }
        } finally {
            setRefreshingActivity(false);
        }
    };

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
                    // Set empty stats if API fails
                    setStats({
                        fabricCount: 0,
                        cuttingCount: 0,
                        sewingCount: 0,
                        packingCount: 0,
                        supplierCount: 0,
                        lowStockCount: 0
                    });
                }

                // Fetch recent activity (initial load)
                await fetchRecentActivity(true);

                // Fetch remaining fabric stock
                try {
                    const fabricStockResponse = await axios.get('http://localhost:8000/api/reports/dashboard/fabric-stock/');
                    setRemainingFabrics(fabricStockResponse.data);
                } catch (error) {
                    console.error('Error fetching fabric stock:', error);
                    // Set empty array if API fails
                    setRemainingFabrics([]);
                }

                // Fetch top fabric colors for analysis
                try {
                    const colorAnalysisResponse = await axios.get('http://localhost:8000/api/reports/dashboard/color-analysis/');
                    setTopFabricColors(colorAnalysisResponse.data);
                } catch (error) {
                    console.error('Error fetching color analysis:', error);
                    // Set empty array if API fails
                    setTopFabricColors([]);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error in dashboard data fetching:', error);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Set up polling interval for recent activity
    useEffect(() => {
        // Set up interval to refresh activity data every 30 seconds
        refreshIntervalRef.current = setInterval(() => {
            fetchRecentActivity();
        }, 30000); // 30 seconds

        // Clean up interval on component unmount
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // Keyboard shortcut handler
    const handleKeyDown = useCallback((e) => {
        // Only process if no input elements are focused
        if (document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.tagName === 'SELECT') {
            return;
        }

        // View shortcuts
        if (e.ctrlKey) {
            switch (e.key) {
                case 'f':
                    e.preventDefault();
                    navigate('/viewfabric');
                    break;
                case 'c':
                    e.preventDefault();
                    navigate('/viewcutting');
                    break;
                case 's':
                    e.preventDefault();
                    navigate('/daily-sewing-history');
                    break;
                case 'u':
                    e.preventDefault();
                    navigate('/viewsuppliers');
                    break;
                default:
                    break;
            }
        }

        // Add shortcuts (Alt key combinations)
        if (e.altKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    navigate('/addsupplier');
                    break;
                case 'f':
                    e.preventDefault();
                    navigate('/addfabric');
                    break;
                case 'c':
                    e.preventDefault();
                    navigate('/addcutting');
                    break;
                case 'd':
                    e.preventDefault();
                    navigate('/adddailysewing');
                    break;
                case 'p':
                    e.preventDefault();
                    navigate('/add-packing-session');
                    break;
                default:
                    break;
            }
        }

        // Help shortcut
        if (e.key === '?') {
            e.preventDefault();
            setShowShortcutModal(true);
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
            case 'created':
                return <Badge bg="success">Created</Badge>;
            case 'packed':
                return <Badge bg="warning">Packed</Badge>;
            case 'low stock':
                return <Badge bg="danger">Low Stock</Badge>;
            default:
                return <Badge bg="secondary">{action}</Badge>;
        }
    };

    // Get detailed activity description based on type and action
    const getActivityDetails = (activity) => {
        switch (activity.type) {
            case 'fabric':
                return `New fabric variant added to inventory`;
            case 'cutting':
                return `Cut pieces: XS: ${activity.xs || 0}, S: ${activity.s || 0}, M: ${activity.m || 0}, L: ${activity.l || 0}, XL: ${activity.xl || 0}`;
            case 'sewing':
                return `Sewn pieces: XS: ${activity.xs || 0}, S: ${activity.s || 0}, M: ${activity.m || 0}, L: ${activity.l || 0}, XL: ${activity.xl || 0}${activity.damage_count ? `, Damaged: ${activity.damage_count}` : ''}`;
            case 'packing':
                return `Packed: ${activity.number_of_6_packs || 0} 6-packs, ${activity.number_of_12_packs || 0} 12-packs, ${activity.extra_items || 0} extra items`;
            default:
                return activity.details || '';
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
                            title="Fabric Value"
                            value={loading ? "..." : `Rs. ${remainingFabrics.length > 0 ? remainingFabrics.reduce((sum, fabric) => sum + (fabric.availableYards * fabric.pricePerYard), 0).toFixed(2) : '0.00'}`}
                            icon={<FaTshirt />}
                            linkTo="#fabric-stock"
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
                                <div>
                                    <h6 className="mb-3">View Pages</h6>
                                    <div className="d-flex flex-wrap gap-2 mb-4">
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
                                            <Button variant="outline-primary" onClick={() => navigate('/viewcutting')}>
                                                <FaCut className="me-2" />
                                                View Cutting
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Ctrl+S', 'Sewing History')}
                                        >
                                            <Button variant="outline-primary" onClick={() => navigate('/daily-sewing-history')}>
                                                <FaCalendarCheck className="me-2" />
                                                Sewing History
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Ctrl+U', 'View Suppliers')}
                                        >
                                            <Button variant="outline-primary" onClick={() => navigate('/viewsuppliers')}>
                                                <FaBuilding className="me-2" />
                                                View Suppliers
                                            </Button>
                                        </OverlayTrigger>
                                    </div>

                                    <h6 className="mb-3">Add New Items</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Alt+S', 'Add Supplier')}
                                        >
                                            <Button variant="outline-success" onClick={() => navigate('/addsupplier')}>
                                                <FaBuilding className="me-2" />
                                                Add Supplier
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Alt+F', 'Add Fabric')}
                                        >
                                            <Button variant="outline-success" onClick={() => navigate('/addfabric')}>
                                                <FaTshirt className="me-2" />
                                                Add Fabric
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Alt+C', 'Add Cutting')}
                                        >
                                            <Button variant="outline-success" onClick={() => navigate('/addcutting')}>
                                                <FaCut className="me-2" />
                                                Add Cutting
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Alt+D', 'Add Daily Sewing')}
                                        >
                                            <Button variant="outline-success" onClick={() => navigate('/adddailysewing')}>
                                                <FaCalendarCheck className="me-2" />
                                                Add Daily Sewing
                                            </Button>
                                        </OverlayTrigger>

                                        <OverlayTrigger
                                            placement="top"
                                            delay={{ show: 250, hide: 400 }}
                                            overlay={(props) => renderTooltip(props, 'Alt+P', 'Add Packing Session')}
                                        >
                                            <Button variant="outline-success" onClick={() => navigate('/add-packing-session')}>
                                                <FaBoxes className="me-2" />
                                                Add Packing
                                            </Button>
                                        </OverlayTrigger>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Main Content */}
                <Row>
                    {/* Recent Activity */}
                    <Col lg={12} className="mb-4">
                        <Card className="shadow-sm">
                            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Recent Activity</h5>
                                <div className="d-flex align-items-center">
                                    {lastActivityUpdate && (
                                        <small className="text-muted me-2">
                                            Last updated: {lastActivityUpdate.toLocaleTimeString()}
                                        </small>
                                    )}
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => fetchRecentActivity()}
                                        disabled={refreshingActivity}
                                    >
                                        <FaSync className={refreshingActivity ? "fa-spin" : ""} />
                                        {refreshingActivity ? ' Refreshing...' : ' Refresh'}
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="activity-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {refreshingActivity && recentActivity.length === 0 ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" role="status" size="sm" className="me-2" />
                                            <span>Loading activity data...</span>
                                        </div>
                                    ) : recentActivity.length > 0 ? (
                                        recentActivity.map((activity) => (
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
                                                            {activity.user && activity.user.toLowerCase() !== 'system' && (
                                                                <small className="ms-2 text-muted">by {activity.user}</small>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-1">
                                                        <small className="text-muted">{getActivityDetails(activity)}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center p-4">
                                            <p className="text-muted">No recent activity to display</p>
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Fabric Color Analysis */}
                <Row className="mb-4">
                    <Col lg={6}>
                        <Card className="shadow-sm h-100">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">
                                    <FaTshirt className="text-primary me-2" />
                                    Most Used Fabric Colors
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                <div className="color-analysis">
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {topFabricColors.length > 0 ? (
                                                <>
                                                    <div className="d-flex mb-4">
                                                        {topFabricColors.map((color, index) => (
                                                            <div key={index} className="text-center me-4">
                                                                <div
                                                                    className="color-circle mb-2"
                                                                    style={{
                                                                        backgroundColor: color.colorCode,
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        borderRadius: '50%',
                                                                        border: '2px solid #fff',
                                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                        margin: '0 auto'
                                                                    }}
                                                                ></div>
                                                                <div className="small fw-bold">{color.colorName}</div>
                                                                <div className="small text-muted">{color.count} cuts</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <Table hover size="sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Color</th>
                                                                <th>Total Cuts</th>
                                                                <th>Yard Usage</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {topFabricColors.map((color, index) => (
                                                                <tr key={index}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div
                                                                                style={{
                                                                                    width: '20px',
                                                                                    height: '20px',
                                                                                    backgroundColor: color.colorCode,
                                                                                    borderRadius: '4px',
                                                                                    marginRight: '8px'
                                                                                }}
                                                                            ></div>
                                                                            {color.colorName}
                                                                        </div>
                                                                    </td>
                                                                    <td>{color.count}</td>
                                                                    <td>{color.yardUsage} yards</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <p className="text-muted">No fabric color data available</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Remaining Fabric Stock */}
                    <Col lg={6} id="fabric-stock">
                        <Card className="shadow-sm h-100">
                            <Card.Header className="bg-white">
                                <h5 className="mb-0">
                                    <FaTshirt className="text-success me-2" />
                                    Top 5 Unused Fabrics
                                </h5>
                            </Card.Header>
                            <Card.Body>
                                {loading ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-success" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    remainingFabrics.length > 0 ? (
                                        <Table hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Fabric</th>
                                                    <th>Available Yards</th>
                                                    <th>Cost</th>
                                                    <th>Total Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Display only top 5 unused fabrics */}
                                                {remainingFabrics.slice(0, 5).map((fabric) => (
                                                    <tr key={fabric.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    style={{
                                                                        width: '20px',
                                                                        height: '20px',
                                                                        backgroundColor: fabric.colorCode,
                                                                        borderRadius: '4px',
                                                                        marginRight: '8px'
                                                                    }}
                                                                ></div>
                                                                {fabric.name}
                                                            </div>
                                                        </td>
                                                        <td>{fabric.availableYards} yards</td>
                                                        <td>Rs. {fabric.pricePerYard.toFixed(2)}/yard</td>
                                                        <td>Rs. {(fabric.availableYards * fabric.pricePerYard).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-center p-4">
                                            <p className="text-muted">No fabric stock data available</p>
                                        </div>
                                    )
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
                            <tr className="table-primary">
                                <td colSpan="2" className="fw-bold">View Pages (Ctrl + Key)</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>F</kbd></td>
                                <td>View Fabrics</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>C</kbd></td>
                                <td>View Cutting</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
                                <td>Sewing History</td>
                            </tr>
                            <tr>
                                <td><kbd>Ctrl</kbd> + <kbd>U</kbd></td>
                                <td>View Suppliers</td>
                            </tr>

                            <tr className="table-success">
                                <td colSpan="2" className="fw-bold">Add Pages (Alt + Key)</td>
                            </tr>
                            <tr>
                                <td><kbd>Alt</kbd> + <kbd>S</kbd></td>
                                <td>Add Supplier</td>
                            </tr>
                            <tr>
                                <td><kbd>Alt</kbd> + <kbd>F</kbd></td>
                                <td>Add Fabric</td>
                            </tr>
                            <tr>
                                <td><kbd>Alt</kbd> + <kbd>C</kbd></td>
                                <td>Add Cutting</td>
                            </tr>
                            <tr>
                                <td><kbd>Alt</kbd> + <kbd>D</kbd></td>
                                <td>Add Daily Sewing</td>
                            </tr>
                            <tr>
                                <td><kbd>Alt</kbd> + <kbd>P</kbd></td>
                                <td>Add Packing Session</td>
                            </tr>

                            <tr className="table-info">
                                <td colSpan="2" className="fw-bold">Other Shortcuts</td>
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
