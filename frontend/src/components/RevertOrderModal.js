import React, { useState } from "react";
import { Modal, Button, Alert } from "react-bootstrap";
import { FaUndo, FaExclamationTriangle } from "react-icons/fa";

const RevertOrderModal = ({ show, onHide, order, onSubmit, processing }) => {
  const [confirmText, setConfirmText] = useState("");
  const [validationError, setValidationError] = useState("");

  // Reset the form when the modal is opened
  React.useEffect(() => {
    if (show) {
      setConfirmText("");
      setValidationError("");
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the confirmation text
    if (confirmText !== `revert-${order?.id}`) {
      setValidationError("Please type the confirmation text exactly as shown to proceed.");
      return;
    }

    // Clear validation error
    setValidationError("");

    // Submit the revert request
    onSubmit();
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
      <Modal.Header className="bg-danger text-white">
        <Modal.Title>
          <FaExclamationTriangle className="me-2" />
          Revert Order #{order.id}
        </Modal.Title>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onHide}
          aria-label="Close"
        ></button>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="warning">
            <Alert.Heading>Warning: This action cannot be undone!</Alert.Heading>
            <p>
              You are about to revert order #{order.id} for {order.shop_name || order.shop}. This will:
            </p>
            <ul>
              <li>Permanently delete this order from the system</li>
              <li>Create new packing sessions to restore items to packing inventory</li>
              <li>Update the packing inventory with the restored items</li>
            </ul>
            <p className="mb-0">
              <strong>This action is intended for draft orders or cases where a shop has rejected an order after delivery or during processing, and the order has not been paid for.</strong>
            </p>
          </Alert>

          {order.payment_status === 'paid' || order.payment_status === 'partially_paid' ? (
            <Alert variant="danger">
              <strong>Error:</strong> This order has already been paid or partially paid and cannot be reverted.
              Please handle this situation manually by contacting the shop and arranging a refund if necessary.
            </Alert>
          ) : (
            <>
              <div className="mb-4">
                <h5>Order Details</h5>
                <div className="p-3 bg-light rounded">
                  <p className="mb-1"><strong>Order ID:</strong> #{order.id}</p>
                  <p className="mb-1"><strong>Shop:</strong> {order.shop_name || order.shop}</p>
                  <p className="mb-1"><strong>Status:</strong> {order.status}</p>
                  <p className="mb-1"><strong>Payment Status:</strong> {order.payment_status || "Unpaid"}</p>
                  <p className="mb-1"><strong>Total Amount:</strong> LKR {parseFloat(order.total_amount || 0).toFixed(2)}</p>
                  <p className="mb-0"><strong>Created Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-4">
                <h5>Items to be Restored to Inventory</h5>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>6 Packs</th>
                        <th>12 Packs</th>
                        <th>Extra Items</th>
                        <th>Total Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.finished_product_name || `Product #${item.finished_product}`}</td>
                          <td>{item.quantity_6_packs}</td>
                          <td>{item.quantity_12_packs}</td>
                          <td>{item.quantity_extra_items}</td>
                          <td>{item.total_units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmText" className="form-label">
                  <strong>Confirmation:</strong> To revert this order, please type <code>revert-{order.id}</code> below:
                </label>
                <input
                  type="text"
                  className={`form-control ${validationError ? 'is-invalid' : ''}`}
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`revert-${order.id}`}
                  required
                />
                {validationError && (
                  <div className="invalid-feedback">
                    {validationError}
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={processing || order.payment_status === 'paid' || order.payment_status === 'partially_paid'}
            className="d-flex align-items-center"
          >
            {processing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <FaUndo className="me-2" /> Revert Order
              </>
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default RevertOrderModal;
