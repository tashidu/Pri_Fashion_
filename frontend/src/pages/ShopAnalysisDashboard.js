import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaStore, FaChartPie, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import ShopDistrictAnalysis from '../components/ShopDistrictAnalysis';

const ShopAnalysisDashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth >= 768);

    // Effect to handle sidebar state based on window size
    React.useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
                <Container fluid>
                    <Row className="mb-4">
                        <Col>
                            <h2 className="mb-0">
                                <FaStore className="me-2 text-primary" />
                                Shop Analysis Dashboard
                            </h2>
                            <p className="text-muted">
                                View and analyze shop distribution by district for better business insights
                            </p>
                        </Col>
                        <Col xs="auto" className="d-flex align-items-center">
                            <Link to="/addshop">
                                <Button variant="primary">
                                    <FaPlus className="me-2" /> Add New Shop
                                </Button>
                            </Link>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg={12}>
                            <ShopDistrictAnalysis />
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col md={6} lg={4} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body>
                                    <Card.Title>Why District Analysis Matters</Card.Title>
                                    <Card.Text>
                                        Understanding the geographical distribution of your shops helps in:
                                        <ul>
                                            <li>Identifying underserved regions</li>
                                            <li>Optimizing delivery routes</li>
                                            <li>Planning targeted marketing campaigns</li>
                                            <li>Analyzing regional sales performance</li>
                                        </ul>
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={6} lg={4} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body>
                                    <Card.Title>How to Use This Data</Card.Title>
                                    <Card.Text>
                                        <ol>
                                            <li>Identify districts with high shop concentration</li>
                                            <li>Compare district distribution with sales performance</li>
                                            <li>Plan expansion into underrepresented districts</li>
                                            <li>Optimize inventory distribution based on regional demand</li>
                                        </ol>
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col md={6} lg={4} className="mb-4">
                            <Card className="shadow-sm h-100" style={{ backgroundColor: "#D9EDFB" }}>
                                <Card.Body>
                                    <Card.Title>Next Steps</Card.Title>
                                    <Card.Text>
                                        To improve your district-based analysis:
                                        <ul>
                                            <li>Add district information to existing shops</li>
                                            <li>Ensure all new shops have district data</li>
                                            <li>Consider correlating district data with sales performance</li>
                                            <li>Export this data for more detailed analysis</li>
                                        </ul>
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
};

export default ShopAnalysisDashboard;
