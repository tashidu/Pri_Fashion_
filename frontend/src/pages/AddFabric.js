import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoleBasedNavBar from "../components/RoleBasedNavBar";

// Common color presets with names
const COLOR_PRESETS = [
  { color: "#000000", name: "Black" },
  { color: "#FFFFFF", name: "White" },
  { color: "#FF0000", name: "Red" },
  { color: "#0000FF", name: "Blue" },
  { color: "#008000", name: "Green" },
  { color: "#FFFF00", name: "Yellow" },
  { color: "#FFA500", name: "Orange" },
  { color: "#800080", name: "Purple" },
  { color: "#FFC0CB", name: "Pink" },
  { color: "#A52A2A", name: "Brown" },
  { color: "#808080", name: "Gray" },
];

const AddFabric = () => {
  // State variables
  const [fabricName, setFabricName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dateAdded, setDateAdded] = useState("");
  const [variants, setVariants] = useState([{ color: "#000000", colorName: "Black", totalYard: "", pricePerYard: "" }]);
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);

  // Effect to handle sidebar state based on window size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch suppliers
  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:8000/api/suppliers/")
      .then((response) => {
        const supplierOptions = response.data.map((sup) => ({
          value: sup.supplier_id,
          label: sup.name,
        }));
        setSuppliers(supplierOptions);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching suppliers:", error);
        setMessage("Failed to load suppliers");
        setLoading(false);
      });
  }, []);

  // Handle adding a variant
  const handleAddVariant = () => {
    setVariants([...variants, { color: "#000000", colorName: "Black", totalYard: "", pricePerYard: "" }]);
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

    // If color is changed, update the color name
    if (field === "color") {
      const colorPreset = COLOR_PRESETS.find(preset => preset.color === value);
      updated[index].colorName = colorPreset ? colorPreset.name : "";
    }

    setVariants(updated);
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    // Basic validation
    if (!fabricName.trim()) {
      setMessage("Please enter a fabric name");
      setIsSubmitting(false);
      return;
    }

    if (!selectedSupplier) {
      setMessage("Please select a supplier");
      setIsSubmitting(false);
      return;
    }

    if (!dateAdded) {
      setMessage("Please select a date");
      setIsSubmitting(false);
      return;
    }

    // Validate variants
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      if (variant.totalYard && parseFloat(variant.totalYard) < 0) {
        setMessage(`Variant ${i+1}: Total yard cannot be negative`);
        setIsSubmitting(false);
        return;
      }

      if (variant.pricePerYard && parseFloat(variant.pricePerYard) < 0) {
        setMessage(`Variant ${i+1}: Price per yard cannot be negative`);
        setIsSubmitting(false);
        return;
      }
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
            color_name: variant.colorName,
            total_yard: parseFloat(variant.totalYard) || 0,
            price_per_yard: parseFloat(variant.pricePerYard) || 0,
          });
        }

        setMessage("✅ Fabric and variants created successfully!");
        setFabricName("");
        setSelectedSupplier(null);
        setDateAdded("");
        setVariants([{ color: "#000000", colorName: "Black", totalYard: "", pricePerYard: "" }]);
      }
    } catch (error) {
      console.error("Error creating fabric or variants:", error);
      setMessage("Error creating fabric or variants.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to select a preset color
  const selectPresetColor = (index, preset) => {
    const updated = [...variants];
    updated[index].color = preset.color;
    updated[index].colorName = preset.name;
    setVariants(updated);
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
        <h2 className="mb-4">
          <FaPlus className="me-2" />
          Add Fabric
        </h2>

        {message && (
          <Alert
            variant={message.includes("✅") ? "success" : "danger"}
            className="d-flex align-items-center"
          >
            {message}
          </Alert>
        )}

        <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Fabric Name</strong></Form.Label>
                    <Form.Control
                      type="text"
                      value={fabricName}
                      onChange={(e) => setFabricName(e.target.value)}
                      required
                      placeholder="Enter fabric name"
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Supplier</strong></Form.Label>
                    {loading ? (
                      <div className="d-flex align-items-center">
                        <Spinner animation="border" size="sm" className="me-2" />
                        <span>Loading suppliers...</span>
                      </div>
                    ) : (
                      <Select
                        options={suppliers}
                        value={selectedSupplier}
                        onChange={setSelectedSupplier}
                        placeholder="Select a supplier..."
                        isSearchable
                      />
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Date Added</strong></Form.Label>
                    <Form.Control
                      type="date"
                      value={dateAdded}
                      onChange={(e) => setDateAdded(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h4 className="mt-4 mb-3 border-bottom pb-2">Fabric Variants</h4>

              {variants.map((variant, index) => (
                <Card
                  key={index}
                  className="mb-3 border"
                  style={{
                    borderLeft: `5px solid ${variant.color}`,
                    borderRadius: "8px"
                  }}
                >
                  <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                    <h5 className="mb-0">Variant #{index + 1}</h5>
                    {variants.length > 1 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveVariant(index)}
                      >
                        <FaTrash className="me-1" /> Remove
                      </Button>
                    )}
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label><strong>Color</strong></Form.Label>
                          <div className="d-flex align-items-center mb-2">
                            <Form.Control
                              type="color"
                              value={variant.color}
                              onChange={(e) => handleVariantChange(index, "color", e.target.value)}
                              className="me-2"
                              style={{ width: '38px', height: '38px' }}
                            />
                            <Form.Control
                              type="text"
                              placeholder="Color name"
                              value={variant.colorName}
                              onChange={(e) => handleVariantChange(index, "colorName", e.target.value)}
                            />
                          </div>
                          <div className="color-presets d-flex flex-wrap gap-1 mt-1">
                            {COLOR_PRESETS.map((preset, presetIndex) => (
                              <div
                                key={presetIndex}
                                onClick={() => selectPresetColor(index, preset)}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  backgroundColor: preset.color,
                                  border: variant.color === preset.color ? '2px solid #000' : '1px solid #ccc',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                                title={preset.name}
                              />
                            ))}
                          </div>
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label><strong>Total Yard</strong></Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.totalYard}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow positive numbers
                              if (value === '' || parseFloat(value) >= 0) {
                                handleVariantChange(index, "totalYard", value);
                              }
                            }}
                            placeholder="Enter total yards"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label><strong>Price per Yard</strong></Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.pricePerYard}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow positive numbers
                              if (value === '' || parseFloat(value) >= 0) {
                                handleVariantChange(index, "pricePerYard", value);
                              }
                            }}
                            placeholder="Enter price per yard"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="mt-2 p-2 bg-light rounded">
                      <strong>Preview:</strong> {variant.colorName || "Unnamed"} -
                      {variant.totalYard ? ` ${variant.totalYard} yards` : " No yards specified"} -
                      {variant.pricePerYard ? ` Rs. ${variant.pricePerYard}/yard` : " No price specified"}
                    </div>
                  </Card.Body>
                </Card>
              ))}

              <div className="d-flex justify-content-center mb-4">
                <Button
                  variant="outline-primary"
                  onClick={handleAddVariant}
                  className="d-flex align-items-center"
                >
                  <FaPlus className="me-2" /> Add Another Variant
                </Button>
              </div>

              <div className="d-flex justify-content-center mt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="px-5"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Fabric'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};



export default AddFabric;
