import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from 'react-bootstrap';
import SalesTeamNavBar from "../components/SalesTeamNavBar";
import { FaChartLine, FaShoppingCart, FaStore, FaTshirt } from "react-icons/fa";

function SalesDashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    // Effect to handle sidebar state based on window size
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
                    <h2 className="mb-4">Sales Dashboard</h2>

                    <Row>
                        <Col md={6} lg={3} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-primary p-3 me-3">
                                            <FaTshirt className="text-white" size={24} />
                                        </div>
                                        <h5 className="mb-0">Products</h5>
                                    </div>
                                    <p className="text-muted">View product catalog with real-time stock levels and pricing information.</p>
                                    <div className="mt-auto">
                                        <a href="/sales-products" className="btn btn-outline-primary">View Products</a>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={3} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-success p-3 me-3">
                                            <FaShoppingCart className="text-white" size={24} />
                                        </div>
                                        <h5 className="mb-0">Orders</h5>
                                    </div>
                                    <p className="text-muted">Create and manage customer orders with real-time inventory tracking.</p>
                                    <div className="mt-auto">
                                        <a href="/order-list" className="btn btn-outline-success">Manage Orders</a>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={3} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-info p-3 me-3">
                                            <FaStore className="text-white" size={24} />
                                        </div>
                                        <h5 className="mb-0">Shops</h5>
                                    </div>
                                    <p className="text-muted">View and manage shop information and locations.</p>
                                    <div className="mt-auto">
                                        <a href="/viewshops" className="btn btn-outline-info">View Shops</a>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={6} lg={3} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="rounded-circle bg-warning p-3 me-3">
                                            <FaChartLine className="text-white" size={24} />
                                        </div>
                                        <h5 className="mb-0">Reports</h5>
                                    </div>
                                    <p className="text-muted">Access sales reports and analytics to track performance.</p>
                                    <div className="mt-auto">
                                        <a href="/sales-report" className="btn btn-outline-warning">View Reports</a>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

export default SalesDashboard;
