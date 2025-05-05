import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaFilter, FaEye, FaCheck, FaFileInvoice, FaMoneyBillWave, FaSync, FaPrint } from "react-icons/fa";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import "bootstrap/dist/css/bootstrap.min.css";
import jsPDF from "jspdf";
import 'jspdf-autotable';

const OwnerOrdersPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Apply filters whenever orders, searchTerm, or statusFilter changes
    let result = [...orders];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(order =>
        order.id.toString().includes(searchTerm) ||
        (order.shop_name && order.shop_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, statusFilter]);

  // Effect to handle sidebar state based on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/orders/orders/create/"
      );
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setError("Failed to load orders. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const viewOrderItems = async (orderId) => {
    if (selectedOrderId === orderId) {
      // If clicking on the same order, toggle the view
      setSelectedOrderId(null);
      setSelectedOrderItems([]);
      setSelectedOrder(null);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/orders/orders/${orderId}/`
      );
      setSelectedOrderItems(response.data.items);
      setSelectedOrderId(orderId);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to approve this order?");
    if (!confirm) return;

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderId ? { ...order, status: 'approved' } : order
        );
        setOrders(updatedOrders);

        // Show success message
        setSuccessMessage("Order approved successfully!");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to approve order");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      setError("Error approving the order. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to generate an invoice for this order?");
    if (!confirm) return;

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/generate-invoice/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderId ? {
            ...order,
            status: 'invoiced',
            invoice_number: data.invoice_number
          } : order
        );
        setOrders(updatedOrders);

        // Show success message
        setSuccessMessage(`Invoice ${data.invoice_number} generated successfully!`);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);

        // Refresh order details
        viewOrderItems(orderId);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to generate invoice");
      }
    } catch (error) {
      console.error("Invoice generation failed:", error);
      setError("Error generating invoice. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to mark this order as delivered and paid?");
    if (!confirm) return;

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/mark-delivered/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderId ? { ...order, status: 'delivered' } : order
        );
        setOrders(updatedOrders);

        // Show success message
        setSuccessMessage("Order marked as delivered and paid successfully!");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to mark order as delivered");
      }
    } catch (error) {
      console.error("Mark delivered failed:", error);
      setError("Error marking the order as delivered. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const printInvoice = (order) => {
    if (!order || !order.items || order.items.length === 0) {
      setError("Cannot print invoice: No order items found.");
      return;
    }

    try {
      const pdf = new jsPDF();

      // Add company header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pri Fashion', 20, 20);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Quality Clothes for Everyone', 20, 28);
      pdf.text('Sri Lanka', 20, 34);

      // Add invoice details
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`INVOICE #${order.invoice_number}`, 140, 20);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 140, 28);
      pdf.text(`Order ID: ${order.id}`, 140, 34);
      pdf.text(`Status: ${order.status.toUpperCase()}`, 140, 40);

      // Add customer info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', 20, 50);

      pdf.setFont('helvetica', 'normal');
      pdf.text(`${order.shop_name}`, 20, 58);

      // Add order items table
      pdf.autoTable({
        startY: 70,
        head: [['Product', '6 Packs', '12 Packs', 'Extra Items', 'Total Units', 'Unit Price', 'Subtotal']],
        body: order.items.map(item => [
          item.finished_product_name || `Product #${item.finished_product}`,
          item.quantity_6_packs,
          item.quantity_12_packs,
          item.quantity_extra_items,
          item.total_units,
          `LKR ${(item.subtotal / item.total_units).toFixed(2)}`,
          `LKR ${item.subtotal.toFixed(2)}`
        ]),
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add total
      const finalY = pdf.previousAutoTable.finalY + 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Amount: LKR ${order.total_amount.toFixed(2)}`, 140, finalY);

      // Add footer
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for your business!', 20, finalY + 20);

      // Save the PDF
      pdf.save(`Invoice-${order.invoice_number}.pdf`);

      setSuccessMessage("Invoice printed successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Failed to generate PDF invoice. Please try again.");
    }
  };

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get status badge color for Bootstrap
  const getBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-warning text-dark';
      case 'submitted':
        return 'bg-info text-dark';
      case 'approved':
        return 'bg-success';
      case 'invoiced':
        return 'bg-primary';
      case 'delivered':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          transition: "margin-left 0.3s ease",
          padding: "1.5rem",
        }}
      >
        <div className="container-fluid">
          <div className="row mb-4">
            <div className="col-12">
              <h2 className="text-center fw-bold text-primary">Order Management</h2>
              <p className="text-center text-muted">Approve orders, generate invoices, and track payments</p>
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <strong>Success!</strong> {successMessage}
              <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <strong>Error!</strong> {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {/* Search and filter controls */}
          <div className="row mb-4">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaSearch className="text-secondary" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by order ID or shop name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-4 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaFilter className="text-secondary" />
                </span>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div className="col-md-2">
              <button
                onClick={fetchOrders}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
              >
                <FaSync className="me-2" /> Refresh
              </button>
            </div>
          </div>

          {/* Orders table */}
          {loading && !processing && (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {!loading && currentOrders.length === 0 && (
            <div className="card bg-light">
              <div className="card-body text-center py-5">
                <p className="text-muted mb-0">No orders found. Try adjusting your filters.</p>
              </div>
            </div>
          )}

          {!loading && currentOrders.length > 0 && (
            <div className="card shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Shop</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Invoice #</th>
                        <th>Total Amount</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="fw-medium">#{order.id}</td>
                          <td>{order.shop_name || order.shop}</td>
                          <td>
                            <span className={`badge ${getBadgeClass(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>{order.invoice_number || "-"}</td>
                          <td>LKR {order.total_amount?.toFixed(2) || "0.00"}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => viewOrderItems(order.id)}
                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                title="View Order Details"
                              >
                                <FaEye className="me-1" /> View
                              </button>

                              {order.status === "submitted" && (
                                <button
                                  onClick={() => handleApproveOrder(order.id)}
                                  disabled={processing}
                                  className="btn btn-sm btn-success d-flex align-items-center"
                                  title="Approve Order"
                                >
                                  <FaCheck className="me-1" /> Approve
                                </button>
                              )}

                              {order.status === "approved" && (
                                <button
                                  onClick={() => handleGenerateInvoice(order.id)}
                                  disabled={processing}
                                  className="btn btn-sm btn-primary d-flex align-items-center"
                                  title="Generate Invoice"
                                >
                                  <FaFileInvoice className="me-1" /> Invoice
                                </button>
                              )}

                              {order.status === "invoiced" && (
                                <>
                                  <button
                                    onClick={() => printInvoice(order)}
                                    className="btn btn-sm btn-info d-flex align-items-center"
                                    title="Print Invoice"
                                  >
                                    <FaPrint className="me-1" /> Print
                                  </button>

                                  <button
                                    onClick={() => handleMarkDelivered(order.id)}
                                    disabled={processing}
                                    className="btn btn-sm btn-success d-flex align-items-center"
                                    title="Mark as Delivered and Paid"
                                  >
                                    <FaMoneyBillWave className="me-1" /> Paid
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {filteredOrders.length > itemsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {[...Array(Math.ceil(filteredOrders.length / itemsPerPage)).keys()].map(number => (
                    <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => paginate(number + 1)}
                      >
                        {number + 1}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === Math.ceil(filteredOrders.length / itemsPerPage) ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage < Math.ceil(filteredOrders.length / itemsPerPage) ? currentPage + 1 : currentPage)}
                      disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}

          {/* Order Items Section */}
          {selectedOrderId && (
            <div className="card mt-4 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 text-primary">
                  Order Details for Order #{selectedOrderId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setSelectedOrderId(null);
                    setSelectedOrderItems([]);
                    setSelectedOrder(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>

              <div className="card-body">
                {loading ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : selectedOrder ? (
                  <div className="mb-4">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Shop:</strong> {selectedOrder.shop_name}</p>
                        <p className="mb-1"><strong>Status:</strong> {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}</p>
                        <p className="mb-1"><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Invoice Number:</strong> {selectedOrder.invoice_number || "Not invoiced yet"}</p>
                        <p className="mb-1"><strong>Total Amount:</strong> LKR {selectedOrder.total_amount?.toFixed(2) || "0.00"}</p>
                        {selectedOrder.approval_date && (
                          <p className="mb-1"><strong>Approved Date:</strong> {new Date(selectedOrder.approval_date).toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <h6 className="fw-bold mb-3">Order Items</h6>
                    {selectedOrderItems.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-light">
                            <tr>
                              <th>Product</th>
                              <th>6 Packs</th>
                              <th>12 Packs</th>
                              <th>Extra Items</th>
                              <th>Total Units</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrderItems.map((item, index) => (
                              <tr key={index}>
                                <td className="fw-medium">{item.finished_product_name || item.finished_product}</td>
                                <td>{item.quantity_6_packs}</td>
                                <td>{item.quantity_12_packs}</td>
                                <td>{item.quantity_extra_items}</td>
                                <td>{item.total_units}</td>
                                <td>LKR {item.subtotal?.toFixed(2) || "0.00"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-5 bg-light rounded">
                        <p className="text-muted mb-0">No items in this order.</p>
                      </div>
                    )}

                    {/* Action buttons based on order status */}
                    <div className="mt-4 d-flex gap-2 justify-content-end">
                      {selectedOrder.status === "submitted" && (
                        <button
                          onClick={() => handleApproveOrder(selectedOrder.id)}
                          disabled={processing}
                          className="btn btn-success"
                        >
                          <FaCheck className="me-2" /> Approve Order
                        </button>
                      )}

                      {selectedOrder.status === "approved" && (
                        <button
                          onClick={() => handleGenerateInvoice(selectedOrder.id)}
                          disabled={processing}
                          className="btn btn-primary"
                        >
                          <FaFileInvoice className="me-2" /> Generate Invoice
                        </button>
                      )}

                      {selectedOrder.status === "invoiced" && (
                        <>
                          <button
                            onClick={() => printInvoice(selectedOrder)}
                            className="btn btn-info text-white"
                          >
                            <FaPrint className="me-2" /> Print Invoice
                          </button>

                          <button
                            onClick={() => handleMarkDelivered(selectedOrder.id)}
                            disabled={processing}
                            className="btn btn-success"
                          >
                            <FaMoneyBillWave className="me-2" /> Mark as Delivered & Paid
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 bg-light rounded">
                    <p className="text-muted mb-0">Failed to load order details.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OwnerOrdersPage;
