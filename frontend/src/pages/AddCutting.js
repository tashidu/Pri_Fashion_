import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

const AddCuttingRecord = () => {
  // Overall cutting record fields
  const [fabricDefinitions, setFabricDefinitions] = useState([]);
  const [selectedFabricDefinition, setSelectedFabricDefinition] = useState('');
  const [cuttingDate, setCuttingDate] = useState('');
  const [description, setDescription] = useState('');

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
      details: details
    };

    try {
      await axios.post("http://localhost:8000/api/cutting/cutting-records/", payload);
      setSuccess('Cutting record created successfully!');
      // Reset form fields
      setSelectedFabricDefinition('');
      setCuttingDate('');
      setDescription('');
      setDetails([{ fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }]);
    } catch (err) {
      console.error('Error creating cutting record:', err);
      setError('Failed to create cutting record.');
    } finally {
      setLoading(false);
    }
  };

  // Convert fabricVariants to react-select options
  // We'll do this for each detail row, but if each row uses the same set of variants,
  // we can reuse the same array for all.
  const getVariantOptions = () => {
    return fabricVariants.map((variant) => ({
      value: variant.id,
      label: variant.color, // e.g. "#000000"
      color: variant.color  // store hex code for the color swatch
    }));
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

  return (
    <div>
      <h2>Add Cutting Record</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        {/* Fabric Definition Dropdown */}
        <div>
          <label>Fabric Definition:</label>
          <select 
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

        {/* Cutting Date */}
        <div>
          <label>Cutting Date:</label>
          <input 
            type="date" 
            value={cuttingDate} 
            onChange={(e) => setCuttingDate(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label>Description:</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <h3>Fabric Details</h3>
        {details.map((detail, index) => {
          // Prepare the react-select value from the detail.fabric_variant
          const currentVariant = fabricVariants.find(v => v.id === detail.fabric_variant);
          const currentValue = currentVariant
            ? { value: currentVariant.id, label: currentVariant.color, color: currentVariant.color }
            : null;

          return (
            <div 
              key={index} 
              style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
            >
              {/* Fabric Variant (Color) via React-Select */}
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block' }}>Fabric Variant (Color):</label>
                <Select
                  options={getVariantOptions()}
                  components={{ Option: ColourOption }}
                  value={currentValue}
                  onChange={(selectedOption) => {
                    // Update the detail row with the selected variant ID
                    handleDetailChange(index, 'fabric_variant', selectedOption.value);
                  }}
                  placeholder="Select Variant"
                />
              </div>

              {/* Yard Usage */}
              <div>
                <label>Yard Usage:</label>
                <input 
                  type="number"
                  step="0.01"
                  value={detail.yard_usage}
                  onChange={(e) => handleDetailChange(index, 'yard_usage', e.target.value)}
                  required
                />
              </div>

              {/* XS, S, M, L, XL fields */}
              <div>
                <label>XS:</label>
                <input 
                  type="number"
                  value={detail.xs}
                  onChange={(e) => handleDetailChange(index, 'xs', e.target.value)}
                />
              </div>
              <div>
                <label>S:</label>
                <input 
                  type="number"
                  value={detail.s}
                  onChange={(e) => handleDetailChange(index, 's', e.target.value)}
                />
              </div>
              <div>
                <label>M:</label>
                <input 
                  type="number"
                  value={detail.m}
                  onChange={(e) => handleDetailChange(index, 'm', e.target.value)}
                />
              </div>
              <div>
                <label>L:</label>
                <input 
                  type="number"
                  value={detail.l}
                  onChange={(e) => handleDetailChange(index, 'l', e.target.value)}
                />
              </div>
              <div>
                <label>XL:</label>
                <input 
                  type="number"
                  value={detail.xl}
                  onChange={(e) => handleDetailChange(index, 'xl', e.target.value)}
                />
              </div>
            </div>
          );
        })}

        <button type="button" onClick={addDetailRow}>
          Add Another Detail
        </button>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Cutting Record'}
        </button>
      </form>
    </div>
  );
};

export default AddCuttingRecord;
