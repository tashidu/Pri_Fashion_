import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useParams, useNavigate } from "react-router-dom";
import { getUserRole, hasRole } from '../utils/auth';

// Color presets for fabric variants
const COLOR_PRESETS = [
  { color: "#000000", name: "Black" },
  { color: "#FFFFFF", name: "White" },
  { color: "#FF0000", name: "Red" },
  { color: "#0000FF", name: "Blue" },
  { color: "#FFFF00", name: "Yellow" },
  { color: "#00FF00", name: "Green" },
  { color: "#FFA500", name: "Orange" },
  { color: "#800080", name: "Purple" },
  { color: "#FFC0CB", name: "Pink" },
  { color: "#A52A2A", name: "Brown" },
  { color: "#808080", name: "Gray" },
  { color: "#C0C0C0", name: "Silver" },
];

const EditFabric = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State variables
  const [fabricName, setFabricName] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dateAdded, setDateAdded] = useState("");
  const [variants, setVariants] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(true);
  const [isInventoryManager, setIsInventoryManager] = useState(hasRole('Inventory Manager'));

  // Check if user is authorized to access this page
  useEffect(() => {
    if (!isInventoryManager) {
      setError("Only Inventory Managers can edit fabrics.");
      // Redirect to fabric list after a short delay
      setTimeout(() => {
        navigate('/viewfabric');
      }, 2000);
    }
  }, [isInventoryManager, navigate]);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/suppliers/");
        const supplierOptions = response.data.map((supplier) => ({
          value: supplier.supplier_id,
          label: supplier.name,
        }));
        setSuppliers(supplierOptions);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        setError("Error loading suppliers. Please try again.");
      }
    };

    fetchSuppliers();
  }, []);

  // Fetch fabric data
  useEffect(() => {
    const fetchFabricData = async () => {
      setLoading(true);
      try {
        // Fetch fabric definition
        const fabricResponse = await axios.get(`http://localhost:8000/api/fabric-definitions/${id}/`);
        const fabricData = fabricResponse.data;

        setFabricName(fabricData.fabric_name);
        setDateAdded(fabricData.date_added);

        // Set selected supplier
        const supplierOption = suppliers.find(s => s.value === fabricData.supplier);
        if (supplierOption) {
          setSelectedSupplier(supplierOption);
        }

        // Fetch fabric variants
        const variantsResponse = await axios.get(`http://localhost:8000/api/fabric-definitions/${id}/variants/`);
        const variantsData = variantsResponse.data;

        // Format variants for state
        const formattedVariants = variantsData.map(variant => ({
          id: variant.id,
          color: variant.color,
          colorName: variant.color_name,
          totalYard: variant.total_yard.toString(),
          originalTotalYard: variant.total_yard,
          availableYard: variant.available_yard !== null ? variant.available_yard : variant.total_yard,
          originalAvailableYard: variant.available_yard !== null ? variant.available_yard : variant.total_yard,
          pricePerYard: variant.price_per_yard.toString()
        }));

        setVariants(formattedVariants);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fabric data:", error);
        setError("Error loading fabric data. Please try again.");
        setLoading(false);
      }
    };

    if (suppliers.length > 0) {
      fetchFabricData();
    }
  }, [id, suppliers]);

  // Handle adding a variant
  const handleAddVariant = () => {
    setVariants([...variants, {
      color: "#000000",
      colorName: "Black",
      totalYard: "",
      originalTotalYard: 0,
      availableYard: 0,
      originalAvailableYard: 0,
      pricePerYard: ""
    }]);
  };

  // Handle removing a variant
  const handleRemoveVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  // Handle variant input changes
  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    const variant = updated[index];

    // Store the previous value before updating
    const previousValue = variant[field];

    // Update the field with the new value
    variant[field] = value;

    // If color is changed, update the color name
    if (field === "color") {
      const colorPreset = COLOR_PRESETS.find(preset => preset.color === value);
      variant.colorName = colorPreset ? colorPreset.name : "";
    }

    // If total yard is changed, update available yard proportionally
    if (field === "totalYard" && value !== "") {
      const newTotalYard = parseFloat(value);
      const originalTotalYard = variant.originalTotalYard;
      const originalAvailableYard = variant.originalAvailableYard;

      // Calculate how much of the fabric has been used
      const usedYard = originalTotalYard - originalAvailableYard;

      // Validate that new total yard is not less than what's already been used
      if (newTotalYard < usedYard) {
        setError(`Cannot reduce total yard below ${usedYard} yards as that amount has already been used in cutting records.`);
        // Revert to previous value
        variant.totalYard = previousValue;
        return;
      } else {
        // Clear error if it was previously set
        setError("");
      }

      // Update available yard based on the change in total yard
      const newAvailableYard = newTotalYard - usedYard;
      variant.availableYard = newAvailableYard;
    }

    setVariants(updated);
  };

  // Select a preset color
  const selectPresetColor = (index, preset) => {
    handleVariantChange(index, "color", preset.color);
    handleVariantChange(index, "colorName", preset.name);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fabricName || !selectedSupplier || !dateAdded) {
      setError("Please fill in all required fields.");
      return;
    }

    if (variants.length === 0) {
      setError("Please add at least one fabric variant.");
      return;
    }

    for (const variant of variants) {
      if (!variant.color || !variant.colorName || !variant.totalYard || !variant.pricePerYard) {
        setError("Please fill in all variant details.");
        return;
      }

      // For existing variants, check if total yard is not reduced below what's been used
      if (variant.id) {
        const newTotalYard = parseFloat(variant.totalYard);
        const usedYard = variant.originalTotalYard - variant.originalAvailableYard;

        if (newTotalYard < usedYard) {
          setError(`Cannot reduce total yard below ${usedYard.toFixed(2)} yards for ${variant.colorName} as that amount has already been used in cutting records.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      // Update fabric definition
      await axios.put(`http://localhost:8000/api/fabric-definitions/${id}/`, {
        fabric_name: fabricName,
        supplier: selectedSupplier.value,
        date_added: dateAdded,
      });

      // Update existing variants and add new ones
      for (let variant of variants) {
        if (variant.id) {
          // Update existing variant
          await axios.put(`http://localhost:8000/api/fabric-variants/${variant.id}/`, {
            fabric_definition: id,
            color: variant.color,
            color_name: variant.colorName,
            total_yard: parseFloat(variant.totalYard) || 0,
            available_yard: parseFloat(variant.availableYard) || 0,
            price_per_yard: parseFloat(variant.pricePerYard) || 0,
          });
        } else {
          // Add new variant
          await axios.post("http://localhost:8000/api/fabric-variants/", {
            fabric_definition: id,
            color: variant.color,
            color_name: variant.colorName,
            total_yard: parseFloat(variant.totalYard) || 0,
            available_yard: parseFloat(variant.totalYard) || 0, // For new variants, available_yard equals total_yard
            price_per_yard: parseFloat(variant.pricePerYard) || 0,
          });
        }
      }

      setMessage("✅ Fabric updated successfully!");

      // Navigate back to fabric list after a short delay
      setTimeout(() => {
        navigate('/viewfabric');
      }, 2000);
    } catch (error) {
      console.error("Error updating fabric:", error);
      setError("Error updating fabric. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          padding: "20px",
        }}
      >
        <h2 className="mb-4">Edit Fabric</h2>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading fabric data...</p>
          </div>
        ) : (
          <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {!isInventoryManager && (
                  <Alert variant="warning" className="mb-3">
                    <strong>Access Denied:</strong> Only Inventory Managers can edit fabrics.
                  </Alert>
                )}
                <fieldset disabled={!isInventoryManager}>
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
                                    cursor: 'pointer',
                                    border: '1px solid #ccc',
                                    borderRadius: '3px'
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
                              step="0.01"
                              min="0"
                              value={variant.totalYard}
                              onChange={(e) => handleVariantChange(index, "totalYard", e.target.value)}
                              placeholder="Enter total yard"
                            />
                            {variant.id && (
                              <div className="mt-2 small">
                                <span className="text-muted">Available: </span>
                                <span className={parseFloat(variant.availableYard) < 10 ? 'text-danger fw-bold' : 'text-success'}>
                                  {parseFloat(variant.availableYard).toFixed(2)} yards
                                </span>
                                {variant.originalTotalYard !== parseFloat(variant.totalYard) && (
                                  <div className="text-info mt-1">
                                    <small>
                                      {parseFloat(variant.totalYard) > variant.originalTotalYard
                                        ? `Increasing total yard will add ${(parseFloat(variant.totalYard) - variant.originalTotalYard).toFixed(2)} yards to available stock.`
                                        : `Decreasing total yard will reduce available stock by ${(variant.originalTotalYard - parseFloat(variant.totalYard)).toFixed(2)} yards.`
                                      }
                                    </small>
                                  </div>
                                )}
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label><strong>Price per Yard (Rs.)</strong></Form.Label>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.pricePerYard}
                              onChange={(e) => handleVariantChange(index, "pricePerYard", e.target.value)}
                              placeholder="Enter price per yard"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
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
                    variant="secondary"
                    className="me-2 px-4"
                    onClick={() => navigate('/viewfabric')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || !isInventoryManager}
                    className="px-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" /> Save Changes
                      </>
                    )}
                  </Button>
                </div>
                </fieldset>
              </Form>
            </Card.Body>
          </Card>
        )}
      </div>
    </>
  );
};

export default EditFabric;