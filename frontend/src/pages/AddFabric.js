import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoleBasedNavBar from "../components/RoleBasedNavBar";

const AddFabric = () => {
  // State variables
  const [fabricName, setFabricName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dateAdded, setDateAdded] = useState("");
  const [variants, setVariants] = useState([{ color: "#000000", totalYard: "", pricePerYard: "" }]);
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch suppliers
  useEffect(() => {
    axios.get("http://localhost:8000/api/suppliers/")
      .then((response) => {
        const supplierOptions = response.data.map((sup) => ({
          value: sup.supplier_id,
          label: sup.name,
        }));
        setSuppliers(supplierOptions);
      })
      .catch((error) => {
        console.error("Error fetching suppliers:", error);
        setMessage("Failed to load suppliers");
      });
  }, []);

  // Handle adding a variant
  const handleAddVariant = () => {
    setVariants([...variants, { color: "#000000", totalYard: "", pricePerYard: "" }]);
  };

  // Handle removing a variant
  const handleRemoveVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  // Handle variant input changes
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!selectedSupplier) {
      setMessage("Please select a supplier.");
      setIsSubmitting(false);
      return;
    }
    if (!fabricName || !dateAdded) {
      setMessage("Please fill out Fabric Name and Date.");
      setIsSubmitting(false);
      return;
    }

    try {
      const defResponse = await axios.post("http://localhost:8000/api/fabric-definitions/", {
        fabric_name: fabricName,
        supplier: selectedSupplier.value,
        date_added: dateAdded,
      });

      if (defResponse.status === 201) {
        const definitionId = defResponse.data.id;

        for (let variant of variants) {
          await axios.post("http://localhost:8000/api/fabric-variants/", {
            fabric_definition: definitionId,
            color: variant.color,
            total_yard: parseFloat(variant.totalYard) || 0,
            price_per_yard: parseFloat(variant.pricePerYard) || 0,
          });
        }

        setMessage("Fabric and variants created successfully!");
        setFabricName("");
        setSelectedSupplier(null);
        setDateAdded("");
        setVariants([{ color: "#000000", totalYard: "", pricePerYard: "" }]);
      }
    } catch (error) {
      console.error("Error creating fabric or variants:", error);
      setMessage("Error creating fabric or variants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <RoleBasedNavBar/>
    <div className="main-content">
    <Container className="add-fabric-container" style={{ padding: '2rem 0', backgroundColor: '#f4f6f9' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm" style={{ animation: 'fadeIn 1s' }}>
            <Card.Header as="h2" className="text-center bg-primary text-white">
              Add Fabric
            </Card.Header>
            <Card.Body>
              {message && (
                <Alert variant={message.includes("successfully") ? "success" : "danger"} style={{ animation: 'bounceIn 1s' }}>
                  {message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Fabric Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={fabricName}
                    onChange={(e) => setFabricName(e.target.value)}
                    required
                    placeholder="Enter fabric name"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Supplier</Form.Label>
                  <Select
                    options={suppliers}
                    value={selectedSupplier}
                    onChange={setSelectedSupplier}
                    placeholder="Select a supplier..."
                    isSearchable
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date Added</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateAdded}
                    onChange={(e) => setDateAdded(e.target.value)}
                    required
                  />
                </Form.Group>

                <Card className="mb-3 variant-container" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <Card.Header>Variants</Card.Header>
                  <Card.Body>
                    {variants.map((variant, index) => (
                      <Card key={index} className="mb-3 variant-card" style={{ transition: 'all 0.3s ease' }}>
                        <Card.Body>
                          <Row>
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Color</Form.Label>
                                <Form.Control
                                  type="color"
                                  value={variant.color}
                                  onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                                />
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Total Yard</Form.Label>
                                <Form.Control
                                  type="number"
                                  value={variant.totalYard}
                                  onChange={(e) => handleVariantChange(index, "totalYard", e.target.value)}
                                  placeholder="Yards"
                                />
                              </Form.Group>
                            </Col>

                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Price per Yard</Form.Label>
                                <Form.Control
                                  type="number"
                                  value={variant.pricePerYard}
                                  onChange={(e) => handleVariantChange(index, "pricePerYard", e.target.value)}
                                  placeholder="Price"
                                />
                              </Form.Group>
                            </Col>
                          </Row>

                          {variants.length > 1 && (
                            <Button
                              variant="danger"
                              onClick={() => handleRemoveVariant(index)}
                              className="position-absolute top-0 end-0 m-2"
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    ))}

                    <Button
                      variant="primary"
                      onClick={handleAddVariant}
                      className="d-flex align-items-center gap-2"
                    >
                      <FaPlus /> Add Variant
                    </Button>
                  </Card.Body>
                </Card>

                <Button type="submit" variant="success" disabled={isSubmitting} className="w-100">
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
    </>
  );
};

export default AddFabric;
