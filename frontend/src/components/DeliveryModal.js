import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col } from "react-bootstrap";

const DeliveryModal = ({ show, onHide, order, onSubmit, processing }) => {
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [deliveredItemsCount, setDeliveredItemsCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [totalOrderItems, setTotalOrderItems] = useState(0);

  useEffect(() => {
    if (show && order) {
      // Calculate total items in the order
      let total = 0;
      if (order.items && order.items.length > 0) {
        total = order.items.reduce((sum, item) => sum + (parseInt(item.total_units) || 0), 0);
      }
      setTotalOrderItems(total);
      
      // Set default delivered items to total items
      setDeliveredItemsCount(total);
      
      // Reset other fields
      setDeliveryNotes("");
      setValidationErrors({});
    }
  }, [show, order]);

  const validateForm = () => {
    const errors = {};
    
    // Validate delivered items count
    if (deliveredItemsCount === "" || deliveredItemsCount === null) {
      errors.deliveredItemsCount = "Number of delivered items is required";
    } else if (isNaN(parseInt(deliveredItemsCount))) {
      errors.deliveredItemsCount = "Number of delivered items must be a number";
    } else if (parseInt(deliveredItemsCount) < 0) {
      errors.deliveredItemsCount = "Number of delivered items cannot be negative";
    } else if (parseInt(deliveredItemsCount) > totalOrderItems) {
      errors.deliveredItemsCount = `Cannot deliver more than ${totalOrderItems} items`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare delivery data
    const deliveryData = {
      delivery_notes: deliveryNotes,
      delivered_items_count: parseInt(deliveredItemsCount)
    };
    
    onSubmit(deliveryData);
  };

  if (!order) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header className="bg-light">
        <Modal.Title>
          <i className="fa fa-truck me-2"></i>
          Mark Order #{order.id} as Delivered
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={onHide}
          aria-label="Close"
        ></button>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className="mb-4 p-3 bg-light rounded">
            <Row>
              <Col md={6}>
                <p className="mb-1"><strong>Order ID:</strong> #{order.id}</p>
                <p className="mb-1"><strong>Shop:</strong> {order.shop_name || order.shop}</p>
                <p className="mb-1">
                  <strong>Status:</strong> 
                  <span className="badge bg-primary ms-1">
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                </p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>Invoice Number:</strong> {order.invoice_number}</p>
                <p className="mb-1"><strong>Total Amount:</strong> LKR {parseFloat(order.total_amount || 0).toFixed(2)}</p>
                <p className="mb-1"><strong>Total Items:</strong> {totalOrderItems}</p>
              </Col>
            </Row>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Number of Items Delivered</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max={totalOrderItems}
              value={deliveredItemsCount}
              onChange={(e) => setDeliveredItemsCount(e.target.value)}
              disabled={processing}
              isInvalid={!!validationErrors.deliveredItemsCount}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.deliveredItemsCount}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Enter the number of items being delivered (maximum: {totalOrderItems})
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Delivery Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              disabled={processing}
              placeholder="Enter any notes about this delivery"
            />
          </Form.Group>

          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please correct the errors above before submitting.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={processing}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            type="submit" 
            disabled={processing}
            className="d-flex align-items-center"
          >
            {processing && (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            )}
            Mark as Delivered
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DeliveryModal;
