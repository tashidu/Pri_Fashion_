import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Row, Col } from "react-bootstrap";

const PaymentModal = ({ show, onHide, order, onSubmit, processing }) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountToPay, setAmountToPay] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [bankName, setBankName] = useState("");
  const [creditTermMonths, setCreditTermMonths] = useState(3);
  const [ownerNotes, setOwnerNotes] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (show && order) {
      // Calculate balance due
      const totalAmount = parseFloat(order.total_amount || 0);
      const amountPaid = parseFloat(order.amount_paid || 0);
      const balanceDue = totalAmount - amountPaid;
      
      // Set default amount to pay as the balance due
      setAmountToPay(balanceDue.toFixed(2));
      
      // Reset other fields
      setPaymentMethod("cash");
      setCheckNumber("");
      setCheckDate(new Date().toISOString().split('T')[0]);
      setBankName("");
      setCreditTermMonths(3);
      setOwnerNotes("");
      setValidationErrors({});
    }
  }, [show, order]);

  const validateForm = () => {
    const errors = {};
    
    // Validate amount
    if (!amountToPay) {
      errors.amountToPay = "Payment amount is required";
    } else if (isNaN(parseFloat(amountToPay))) {
      errors.amountToPay = "Payment amount must be a number";
    } else if (parseFloat(amountToPay) <= 0) {
      errors.amountToPay = "Payment amount must be greater than zero";
    }
    
    // Validate check details if payment method is check
    if (paymentMethod === "check") {
      if (!checkNumber) {
        errors.checkNumber = "Check number is required";
      }
      if (!checkDate) {
        errors.checkDate = "Check date is required";
      }
      if (!bankName) {
        errors.bankName = "Bank name is required";
      }
    }
    
    // Validate credit term if payment method is credit
    if (paymentMethod === "credit") {
      if (!creditTermMonths || creditTermMonths <= 0) {
        errors.creditTermMonths = "Credit term must be greater than zero";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare payment data
    const paymentData = {
      payment_method: paymentMethod,
      amount_paid: parseFloat(amountToPay),
      payment_date: new Date().toISOString().split('T')[0],
      owner_notes: ownerNotes
    };
    
    // Add payment method specific data
    if (paymentMethod === "check") {
      paymentData.check_number = checkNumber;
      paymentData.check_date = checkDate;
      paymentData.bank_name = bankName;
    } else if (paymentMethod === "credit") {
      paymentData.credit_term_months = parseInt(creditTermMonths);
    }
    
    onSubmit(paymentData);
  };

  if (!order) return null;

  // Calculate balance due
  const totalAmount = parseFloat(order.total_amount || 0);
  const amountPaid = parseFloat(order.amount_paid || 0);
  const balanceDue = totalAmount - amountPaid;

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
          <i className="fa fa-money-bill-wave me-2"></i>
          Record Payment for Order #{order.id}
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
                  <span className="badge bg-secondary ms-1">
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </span>
                </p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>Total Amount:</strong> LKR {totalAmount.toFixed(2)}</p>
                <p className="mb-1"><strong>Amount Paid:</strong> LKR {amountPaid.toFixed(2)}</p>
                <p className="mb-1">
                  <strong>Balance Due:</strong> 
                  <span className="text-danger fw-bold"> LKR {balanceDue.toFixed(2)}</span>
                </p>
              </Col>
            </Row>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Payment Method</Form.Label>
            <Form.Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={processing}
            >
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit (Pay Later)</option>
              <option value="advance">Advance Payment</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Payment Amount (LKR)</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              value={amountToPay}
              onChange={(e) => setAmountToPay(e.target.value)}
              disabled={processing}
              isInvalid={!!validationErrors.amountToPay}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.amountToPay}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Enter the amount being paid (maximum: LKR {balanceDue.toFixed(2)})
            </Form.Text>
          </Form.Group>

          {paymentMethod === "check" && (
            <div className="check-details p-3 border rounded mb-3">
              <h6 className="mb-3">Check Details</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Check Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      disabled={processing}
                      isInvalid={!!validationErrors.checkNumber}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.checkNumber}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Check Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={checkDate}
                      onChange={(e) => setCheckDate(e.target.value)}
                      disabled={processing}
                      isInvalid={!!validationErrors.checkDate}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.checkDate}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Bank Name</Form.Label>
                <Form.Control
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={processing}
                  isInvalid={!!validationErrors.bankName}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.bankName}
                </Form.Control.Feedback>
              </Form.Group>
            </div>
          )}

          {paymentMethod === "credit" && (
            <div className="credit-details p-3 border rounded mb-3">
              <h6 className="mb-3">Credit Terms</h6>
              <Form.Group className="mb-3">
                <Form.Label>Credit Term (Months)</Form.Label>
                <Form.Select
                  value={creditTermMonths}
                  onChange={(e) => setCreditTermMonths(e.target.value)}
                  disabled={processing}
                  isInvalid={!!validationErrors.creditTermMonths}
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.creditTermMonths}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Payment will be due in {creditTermMonths} month(s)
                </Form.Text>
              </Form.Group>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={ownerNotes}
              onChange={(e) => setOwnerNotes(e.target.value)}
              disabled={processing}
              placeholder="Enter any notes about this payment"
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
            variant="primary" 
            type="submit" 
            disabled={processing}
            className="d-flex align-items-center"
          >
            {processing && (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            )}
            Record Payment
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PaymentModal;
