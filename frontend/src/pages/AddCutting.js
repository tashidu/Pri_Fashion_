import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddCuttingRecord = () => {
  // State for overall cutting record fields
  const [fabricDefinitions, setFabricDefinitions] = useState([]);
  const [selectedFabricDefinition, setSelectedFabricDefinition] = useState('');
  const [cuttingDate, setCuttingDate] = useState('');
  const [description, setDescription] = useState('');
  
  // For storing variants of the currently selected FabricDefinition
  const [fabricVariants, setFabricVariants] = useState([]);

  // State for fabric detail rows
  const [details, setDetails] = useState([
    { fabric_variant: '', yard_usage: '', xs: 0, s: 0, m: 0, l: 0, xl: 0 }
  ]);
  
  // Loading, error, and success states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch fabric definitions on mount
  useEffect(() => { 
    axios.get("http://localhost:8000/api/fabric-definitions/")
      .then((res) => {
        console.log("Fetched fabric definitions:", res.data);
        setFabricDefinitions(res.data);
      })
      .catch((err) => console.error('Error fetching fabric definitions:', err));
  }, []);
  
  // 2. Whenever the user selects a FabricDefinition, fetch the associated variants
  useEffect(() => {
    if (selectedFabricDefinition) {
      axios.get(`http://localhost:8000/api/fabric-definitions/${selectedFabricDefinition}/variants/`)
        .then((res) => {
          console.log("Fetched variants for definition:", res.data);
          setFabricVariants(res.data);
        })
        .catch((err) => console.error('Error fetching fabric variants:', err));
    } else {
      // Reset if no definition is selected
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
        axios.post("http://localhost:8000/api/cutting/cutting-records/", payload);




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
        {details.map((detail, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            
            {/* Fabric Variant Dropdown (color, etc.) */}
            <div>
              <label>Fabric Variant (Color):</label>
              <select
                value={detail.fabric_variant}
                onChange={(e) => handleDetailChange(index, 'fabric_variant', e.target.value)}
                required
              >
                <option value="">Select Variant</option>
                {fabricVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.color} 
                    {/* Could also display additional info like price, etc. */}
                  </option>
                ))}
              </select>
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
        ))}
        <button type="button" onClick={addDetailRow}>Add Another Detail</button>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Cutting Record'}
        </button>
      </form>
    </div>
  );
};

export default AddCuttingRecord;
