import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const ShopDistrictAnalysis = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [districtData, setDistrictData] = useState([]);

    // Generate random colors for chart
    const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * 200);
            const g = Math.floor(Math.random() * 200);
            const b = Math.floor(Math.random() * 200);
            colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        }
        return colors;
    };

    useEffect(() => {
        const fetchShopData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8000/api/orders/shops/district-analysis/');

                // Process data for district analysis
                const shops = response.data;
                const districtCounts = {};

                // Count shops by district
                shops.forEach(shop => {
                    const district = shop.district || 'Unknown';
                    districtCounts[district] = (districtCounts[district] || 0) + 1;
                });

                // Convert to array for chart
                const districts = Object.keys(districtCounts);
                const counts = Object.values(districtCounts);

                // Generate colors
                const backgroundColors = generateColors(districts.length);

                setDistrictData({
                    labels: districts,
                    datasets: [
                        {
                            label: 'Number of Shops',
                            data: counts,
                            backgroundColor: backgroundColors,
                            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
                            borderWidth: 1,
                        },
                    ],
                });

                setLoading(false);
            } catch (err) {
                console.error('Error fetching shop data:', err);
                setError('Failed to load shop district data. Please try again later.');
                setLoading(false);
            }
        };

        fetchShopData();
    }, []);

    if (loading) {
        return (
            <Card className="shadow-sm mb-4" style={{ backgroundColor: "#D9EDFB" }}>
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" role="status" className="mb-2" />
                    <p>Loading district analysis...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-sm mb-4" style={{ backgroundColor: "#D9EDFB" }}>
                <Card.Body>
                    <Alert variant="danger">{error}</Alert>
                </Card.Body>
            </Card>
        );
    }

    // If no district data or all districts are unknown
    if (!districtData.labels || districtData.labels.length === 0 ||
        (districtData.labels.length === 1 && districtData.labels[0] === 'Unknown')) {
        return (
            <Card className="shadow-sm mb-4" style={{ backgroundColor: "#D9EDFB" }}>
                <Card.Body>
                    <Alert variant="info">
                        No district data available yet. Add shops with district information to see analysis.
                    </Alert>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm mb-4" style={{ backgroundColor: "#D9EDFB" }}>
            <Card.Body>
                <Card.Title className="mb-4">Shop Distribution by District</Card.Title>
                <Row>
                    <Col md={8} className="mx-auto">
                        <div style={{ height: '300px' }}>
                            <Pie
                                data={districtData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'right',
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function(context) {
                                                    const label = context.label || '';
                                                    const value = context.raw || 0;
                                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                    const percentage = Math.round((value / total) * 100);
                                                    return `${label}: ${value} shops (${percentage}%)`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </Col>
                </Row>
                <div className="text-center mt-3">
                    <small className="text-muted">
                        This analysis helps identify which districts have the most shops,
                        allowing for better targeted marketing and distribution strategies.
                    </small>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ShopDistrictAnalysis;
