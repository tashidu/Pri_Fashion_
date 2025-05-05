import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import RoleBasedNavBar from "../components/RoleBasedNavBar";

const AddCuttingRecord = () => {
  // Overall cutting record fields
  const [fabricDefinitions, setFabricDefinitions] = useState([]);
  const [selectedFabricDefinition, setSelectedFabricDefinition] = useState('');
  const [cuttingDate, setCuttingDate] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState(''); // New product name field

  // For storing variants of the currently selected FabricDefinition
  const [fabricVariants, setFabricVariants] = useState([]);

  // Cutting detail rows
  const [details, setDetails] = useState([
    { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }
  ]);

  // Loading, error, success states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch fabric definitions on mount
  useEffect(() => {
    axios.get("http://localhost:8000/api/fabric-definitions/")
      .then((res) => {
        setFabricDefinitions(res.data);
      })
      .catch((err) => console.error('Error fetching fabric definitions:', err));
  }, []);

  // 2. Fetch variants when a FabricDefinition is selected
  useEffect(() => {
    if (selectedFabricDefinition) {
      axios.get(`http://localhost:8000/api/fabric-definitions/${selectedFabricDefinition}/variants/`)
        .then((res) => {
          setFabricVariants(res.data);
        })
        .catch((err) => console.error('Error fetching fabric variants:', err));
    } else {
      setFabricVariants([]);
    }
  }, [selectedFabricDefinition]);

  // Add a new empty detail row
  const addDetailRow = () => {
    setDetails([...details, { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
  };

  // Delete a detail row
  const removeDetailRow = (index) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  // Handle change for each detail row field
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      fabric_definition: selectedFabricDefinition,
      cutting_date: cuttingDate,
      description: description,
      product_name: productName, // Include product name in payload
      details: details
    };

    try {
      await axios.post("http://localhost:8000/api/cutting/cutting-records/", payload);
      setSuccess('Cutting record created successfully!');
      // Reset form fields
      setSelectedFabricDefinition('');
      setCuttingDate('');
      setDescription('');
      setProductName(''); // Reset product name field
      setDetails([{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
    } catch (err) {
      console.error('Error creating cutting record:', err);
      setError('Failed to create cutting record.');
    } finally {
      setLoading(false);
    }
  };

  // Custom option component that shows a color swatch + label
  const ColourOption = ({ data, innerRef, innerProps }) => (
    <div
      ref={innerRef}
      {...innerProps}
      style={{ display: 'flex', alignItems: 'center', padding: '4px' }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: data.color,
          marginRight: 8,
          border: '1px solid #ccc'
        }}
      />
      <span>{data.label}</span>
    </div>
  );

  // Some simple inline styles for a nicer layout
  const formStyles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '30px',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    },
    header: {
      borderBottom: '2px solid #f0f0f0',
      paddingBottom: '15px',
      marginBottom: '25px',
      color: '#2c3e50',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#555',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      backgroundColor: '#fff',
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      minHeight: '100px',
    },
    detailCard: {
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#f9f9f9',
    },
    detailHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '15px',
    },
    sizesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '10px',
      marginTop: '15px',
    },
    sizeBox: {
      textAlign: 'center',
    },
    sizeLabel: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: '500',
    },
    sizeInput: {
      width: '100%',
      padding: '8px',
      textAlign: 'center',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
    buttonPrimary: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '12px 24px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    buttonSecondary: {
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '10px 20px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
      marginBottom: '20px',
      marginRight: '10px'
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '4px',
      marginBottom: '20px',
      fontWeight: '500',
    },
    alertSuccess: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb',
    },
    alertError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb',
    }
  };

  return (
    <>
      <RoleBasedNavBar/>
      <div style={formStyles.container}>
        <h2 style={formStyles.header}>Add Cutting Record</h2>

        {error && <div style={{...formStyles.alert, ...formStyles.alertError}}>{error}</div>}
        {success && <div style={{...formStyles.alert, ...formStyles.alertSuccess}}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Fabric Definition Dropdown */}
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Fabric Definition:</label>
            <select
              style={formStyles.select}
              value={selectedFabricDefinition}
              onChange={(e) => setSelectedFabricDefinition(e.target.value)}
              required
            >
              <option value="">Select Fabric Group</option>
              {fabricDefinitions.map((fd) => (
                <option key={fd.id} value={fd.id}>
                  {fd.fabric_name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name Field */}
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Product Name:</label>
            <input
              style={formStyles.input}
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Cutting Date */}
            <div style={formStyles.formGroup}>
              <label style={formStyles.label}>Cutting Date:</label>
              <input
                style={formStyles.input}
                type="date"
                value={cuttingDate}
                onChange={(e) => setCuttingDate(e.target.value)}
                required
              />
            </div>
            <div></div> {/* empty space for additional fields */}
          </div>

          {/* Description */}
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Description:</label>
            <textarea
              style={formStyles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details about this cutting record..."
            />
          </div>

          <h3 style={{...formStyles.header, marginTop: '30px'}}>Fabric Details</h3>

          {details.map((detail, index) => {
            // Find the selected variant object to set the value in React-Select
            const currentVariant = fabricVariants.find(v => v.id === detail.fabric_variant);
            const currentValue = currentVariant
              ? { value: currentVariant.id, label: currentVariant.color, color: currentVariant.color }
              : null;

            // Prepare the variant options for React-Select
            const variantOptions = fabricVariants.map((variant) => ({
              value: variant.id,
              label: variant.color,
              color: variant.color,
            }));

            return (
              <div key={index} style={formStyles.detailCard}>
                <div style={formStyles.detailHeader}>
                  <h4 style={{margin: 0}}>Detail #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeDetailRow(index)}
                    style={formStyles.buttonSecondary}
                  >
                    Delete Detail
                  </button>
                </div>

                {/* Fabric Variant (Color) via React-Select */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                  <div>
                    <label style={formStyles.label}>Fabric Variant (Color):</label>
                    <Select
                      options={variantOptions}
                      components={{ Option: ColourOption }}
                      value={currentValue}
                      onChange={(selectedOption) => {
                        // Update the detail row with the selected variant ID
                        handleDetailChange(index, 'fabric_variant', selectedOption.value);
                      }}
                      placeholder="Select Variant"
                      styles={{
                        control: (provided) => ({
                          ...provided,
                          borderColor: '#ddd',
                          boxShadow: 'none',
                          '&:hover': {
                            borderColor: '#aaa'
                          }
                        })
                      }}
                    />
                  </div>

                  {/* Yard Usage */}
                  <div>
                    <label style={formStyles.label}>Yard Usage:</label>
                    <input
                      style={formStyles.input}
                      type="number"
                      step="0.01"
                      value={detail.yard_usage}
                      onChange={(e) => handleDetailChange(index, 'yard_usage', e.target.value)}
                      required
                      placeholder="Enter yards used"
                    />
                  </div>
                </div>

                {/* Size quantities in a grid */}
                <label style={{...formStyles.label, marginTop: '10px'}}>Size Quantities:</label>
                <div style={formStyles.sizesGrid}>
                  <div style={formStyles.sizeBox}>
                    <label style={formStyles.sizeLabel}>XS</label>
                    <input
                      style={formStyles.sizeInput}
                      type="number"
                      value={detail.xs}
                      onChange={(e) => handleDetailChange(index, 'xs', e.target.value)}
                    />
                  </div>
                  <div style={formStyles.sizeBox}>
                    <label style={formStyles.sizeLabel}>S</label>
                    <input
                      style={formStyles.sizeInput}
                      type="number"
                      value={detail.s}
                      onChange={(e) => handleDetailChange(index, 's', e.target.value)}
                    />
                  </div>
                  <div style={formStyles.sizeBox}>
                    <label style={formStyles.sizeLabel}>M</label>
                    <input
                      style={formStyles.sizeInput}
                      type="number"
                      value={detail.m}
                      onChange={(e) => handleDetailChange(index, 'm', e.target.value)}
                    />
                  </div>
                  <div style={formStyles.sizeBox}>
                    <label style={formStyles.sizeLabel}>L</label>
                    <input
                      style={formStyles.sizeInput}
                      type="number"
                      value={detail.l}
                      onChange={(e) => handleDetailChange(index, 'l', e.target.value)}
                    />
                  </div>
                  <div style={formStyles.sizeBox}>
                    <label style={formStyles.sizeLabel}>XL</label>
                    <input
                      style={formStyles.sizeInput}
                      type="number"
                      value={detail.xl}
                      onChange={(e) => handleDetailChange(index, 'xl', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addDetailRow}
            style={formStyles.buttonSecondary}
          >
            + Add Another Detail
          </button>

          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <button
              type="submit"
              disabled={loading}
              style={formStyles.buttonPrimary}
            >
              {loading ? 'Submitting...' : 'Submit Cutting Record'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddCuttingRecord;
