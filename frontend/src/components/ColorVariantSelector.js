import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { BsChevronDown } from 'react-icons/bs';

const ColorVariantSelector = ({ 
  variants, 
  selectedValue, 
  onSelect, 
  placeholder = "Select Color Variant",
  isDuplicateFunction,
  groupIndex,
  variantIndex,
  disabled = false,
  showFabricName = false // For EditCutting where we need to show fabric name too
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedVariant = variants.find(v => v.id === selectedValue);

  return (
    <Dropdown show={isOpen && !disabled} onToggle={setIsOpen}>
      <Dropdown.Toggle 
        variant="outline-secondary" 
        className="w-100 d-flex justify-content-between align-items-center"
        style={{ textAlign: 'left' }}
        disabled={disabled}
      >
        {selectedVariant ? (
          <div className="d-flex align-items-center">
            <div
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: selectedVariant.color,
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginRight: '8px'
              }}
            />
            <span>
              {showFabricName && selectedVariant.fabric_definition_data?.fabric_name && 
                `${selectedVariant.fabric_definition_data.fabric_name} - `
              }
              {selectedVariant.color_name || selectedVariant.color} - {selectedVariant.available_yard} yards available
            </span>
          </div>
        ) : (
          <span className="text-muted">{placeholder}</span>
        )}
        <BsChevronDown />
      </Dropdown.Toggle>

      <Dropdown.Menu className="w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {variants.length === 0 ? (
          <Dropdown.Item disabled>No variants available</Dropdown.Item>
        ) : (
          variants.map((variant) => {
            const isAlreadySelected = isDuplicateFunction ? isDuplicateFunction(groupIndex, variant.id, variantIndex) : false;
            return (
              <Dropdown.Item
                key={variant.id}
                onClick={() => {
                  if (!isAlreadySelected) {
                    onSelect(variant.id);
                    setIsOpen(false);
                  }
                }}
                disabled={isAlreadySelected}
                className={isAlreadySelected ? 'text-muted' : ''}
              >
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: variant.color,
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      marginRight: '8px'
                    }}
                  />
                  <div>
                    <div className="fw-bold">
                      {showFabricName && variant.fabric_definition_data?.fabric_name && 
                        `${variant.fabric_definition_data.fabric_name} - `
                      }
                      {variant.color_name || variant.color}
                    </div>
                    <small className="text-muted">
                      {variant.available_yard} yards available
                      {isAlreadySelected ? ' (Already Selected)' : ''}
                    </small>
                  </div>
                </div>
              </Dropdown.Item>
            );
          })
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ColorVariantSelector;
