import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

/**
 * A reusable dashboard card component with the preferred styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.value - Main value to display
 * @param {string} props.icon - Icon component or element
 * @param {string} props.linkTo - Path to navigate to when clicked
 * @param {string} props.color - Optional color override
 */
const DashboardCard = ({ title, value, icon, linkTo, color = '#D9EDFB' }) => {
  return (
    <Link to={linkTo} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card 
        className="custom-card mb-4" 
        style={{ 
          backgroundColor: color,
          cursor: 'pointer',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          border: 'none'
        }}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="text-muted mb-1">{title}</h6>
              <h3 className="mb-0">{value}</h3>
            </div>
            <div 
              style={{ 
                fontSize: '2rem', 
                opacity: 0.7,
                color: '#0d6efd'
              }}
            >
              {icon}
            </div>
          </div>
        </Card.Body>
      </Card>
    </Link>
  );
};

export default DashboardCard;
