import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Badge, Form, InputGroup } from 'react-bootstrap';
import { FaStore, FaMapMarkerAlt, FaPhone, FaSearch, FaPlus, FaEdit, FaMapMarked } from 'react-icons/fa';
import SalesTeamNavBar from '../components/SalesTeamNavBar';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// CSS for Leaflet map
const LeafletCSS = () => (
  <style jsx="true">{`
    .leaflet-container {
      height: 300px;
      width: 100%;
      border-radius: 8px;
    }
  `}</style>
);

const ViewShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const navigate = useNavigate();

  // Fetch shops data
  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:8000/api/orders/shops/')
      .then(response => {
        setShops(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching shops:', error);
        setError('Failed to load shops. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter shops based on search term
  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.district && shop.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
    shop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.contact_number && shop.contact_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle shop selection for map view
  const handleShowOnMap = (shop) => {
    setSelectedShop(shop);
    setShowMap(true);
  };

  return (
    <>
      <LeafletCSS />
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <FaStore className="me-2 text-primary" />
              Shop Directory
            </h2>
            <Button
              variant="success"
              onClick={() => navigate('/addshop')}
            >
              <FaPlus className="me-1" /> Add New Shop
            </Button>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form className="mb-4">
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search shops by name, district, address or phone number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Form>

              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading shops...</p>
                </div>
              ) : filteredShops.length === 0 ? (
                <Alert variant="info">
                  No shops found. {searchTerm ? 'Try a different search term or ' : ''}
                  <Alert.Link onClick={() => navigate('/addshop')}>add a new shop</Alert.Link>.
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Shop Name</th>
                      <th>Address</th>
                      <th>District</th>
                      <th>Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShops.map(shop => (
                      <tr key={shop.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaStore className="me-2 text-primary" />
                            <strong>{shop.name}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaMapMarkerAlt className="me-2 text-secondary" />
                            {shop.address}
                          </div>
                        </td>
                        <td>
                          {shop.district ? (
                            <Badge bg="info">{shop.district}</Badge>
                          ) : (
                            <Badge bg="secondary">Not specified</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaPhone className="me-2 text-success" />
                            {shop.contact_number}
                          </div>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowOnMap(shop)}
                            disabled={!shop.latitude || !shop.longitude}
                          >
                            <FaMapMarked className="me-1" /> Map
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {showMap && selectedShop && selectedShop.latitude && selectedShop.longitude && (
            <Card className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <FaMapMarked className="me-2" />
                  {selectedShop.name} Location
                </h5>
              </Card.Header>
              <Card.Body>
                <MapContainer
                  center={[selectedShop.latitude, selectedShop.longitude]}
                  zoom={13}
                  style={{ height: '400px' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[selectedShop.latitude, selectedShop.longitude]}>
                    <Popup>
                      <strong>{selectedShop.name}</strong><br />
                      {selectedShop.address}<br />
                      {selectedShop.district && <span>District: {selectedShop.district}<br /></span>}
                      Tel: {selectedShop.contact_number}
                    </Popup>
                  </Marker>
                </MapContainer>
              </Card.Body>
            </Card>
          )}
        </Container>
      </div>
    </>
  );
};

export default ViewShops;
