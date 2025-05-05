import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaFilter, FaEye, FaCheck, FaFileInvoice, FaMoneyBillWave, FaSync, FaPrint, FaTruck, FaDownload, FaFileAlt } from "react-icons/fa";
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
    const confirm = window.confirm("Are you sure you want to mark this order as delivered?");
    if (!confirm) return;

    // Get delivery details
    const deliveryNotes = prompt("Enter any delivery notes (optional):", "");
    const deliveredItemsCount = parseInt(prompt("Enter the number of items delivered:", "0"));

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/mark-delivered/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delivery_notes: deliveryNotes || "",
          delivered_items_count: deliveredItemsCount || 0
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderId ? {
            ...order,
            status: 'delivered',
            delivery_date: data.delivery_date,
            delivery_notes: deliveryNotes,
            delivered_items_count: deliveredItemsCount
          } : order
        );
        setOrders(updatedOrders);

        // Show success message
        setSuccessMessage("Order marked as delivered successfully!");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);

        // Refresh order details if this is the selected order
        if (selectedOrderId === orderId) {
          viewOrderItems(orderId);
        }
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

  const handleRecordPayment = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setError("Order not found");
      return;
    }

    // Calculate balance due
    const totalAmount = parseFloat(order.total_amount || 0);
    const amountPaid = parseFloat(order.amount_paid || 0);
    const balanceDue = totalAmount - amountPaid;

    // Get payment method
    const paymentMethod = prompt(
      "Select payment method (cash, check, bank_transfer, credit, advance):",
      "cash"
    );

    if (!paymentMethod) return;

    // Get payment amount
    const amountToPayStr = prompt(
      `Enter payment amount (Balance due: LKR ${balanceDue.toFixed(2)}):`,
      balanceDue.toFixed(2)
    );

    if (!amountToPayStr) return;

    const amountToPay = parseFloat(amountToPayStr);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      setError("Invalid payment amount");
      return;
    }

    // Prepare payment data
    const paymentData = {
      payment_method: paymentMethod,
      amount_paid: amountToPay,
      payment_date: new Date().toISOString().split('T')[0]
    };

    // Get additional details based on payment method
    if (paymentMethod === 'check') {
      paymentData.check_number = prompt("Enter check number:", "");
      paymentData.check_date = prompt("Enter check date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
      paymentData.bank_name = prompt("Enter bank name:", "");
    } else if (paymentMethod === 'credit') {
      const creditTermMonths = parseInt(prompt("Enter credit term in months (3, 6, etc.):", "3"));
      paymentData.credit_term_months = creditTermMonths;
    }

    // Get owner notes
    const ownerNotes = prompt("Enter any notes about this payment (optional):", "");
    if (ownerNotes) {
      paymentData.owner_notes = ownerNotes;
    }

    setProcessing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/orders/${orderId}/record-payment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const data = await response.json();

        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderId ? {
            ...order,
            status: data.status,
            payment_status: data.payment_status,
            amount_paid: data.amount_paid,
            payment_method: paymentData.payment_method,
            payment_date: paymentData.payment_date,
            check_number: paymentData.check_number,
            check_date: paymentData.check_date,
            bank_name: paymentData.bank_name,
            credit_term_months: paymentData.credit_term_months,
            owner_notes: paymentData.owner_notes
          } : order
        );
        setOrders(updatedOrders);

        // Show success message
        setSuccessMessage(data.message || "Payment recorded successfully!");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);

        // Refresh order details if this is the selected order
        if (selectedOrderId === orderId) {
          viewOrderItems(orderId);
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Record payment failed:", error);
      setError("Error recording payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const printInvoice = (order, autosave = true) => {
    console.log("Generating invoice for order:", order);

    if (!order || !order.items) {
      setError("Cannot generate invoice: Order data is missing.");
      return null;
    }

    if (!order.items.length) {
      setError("Cannot generate invoice: No order items found.");
      return null;
    }

    if (!order.invoice_number) {
      setError("Cannot generate invoice: Invoice number is missing.");
      return null;
    }

    try {
      // Initialize jsPDF with default a4 paper size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

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
      pdf.text(`INVOICE #${order.invoice_number}`, 120, 20);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 120, 28);
      pdf.text(`Order ID: ${order.id}`, 120, 34);
      pdf.text(`Status: ${order.status.toUpperCase()}`, 120, 40);

      // Add customer info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', 20, 50);

      pdf.setFont('helvetica', 'normal');
      pdf.text(`${order.shop_name || order.shop || 'Customer'}`, 20, 58);

      // Prepare table data safely
      const tableBody = order.items.map(item => {
        const productName = item.finished_product_name || `Product #${item.finished_product || 'Unknown'}`;
        const qty6Packs = item.quantity_6_packs || 0;
        const qty12Packs = item.quantity_12_packs || 0;
        const qtyExtra = item.quantity_extra_items || 0;
        const totalUnits = item.total_units || 0;

        // Calculate unit price safely
        let unitPrice = 0;
        let subtotal = 0;

        if (item.subtotal && item.total_units && item.total_units > 0) {
          unitPrice = item.subtotal / item.total_units;
          subtotal = item.subtotal;
        } else if (item.subtotal) {
          subtotal = item.subtotal;
        }

        return [
          productName,
          qty6Packs,
          qty12Packs,
          qtyExtra,
          totalUnits,
          `LKR ${parseFloat(unitPrice).toFixed(2)}`,
          `LKR ${parseFloat(subtotal).toFixed(2)}`
        ];
      });

      // Add order items table
      pdf.autoTable({
        startY: 70,
        head: [['Product', '6 Packs', '12 Packs', 'Extra Items', 'Total Units', 'Unit Price', 'Subtotal']],
        body: tableBody,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Add total - safely handle the case where finalY might not be available
      let finalY = 200; // Default position if autoTable doesn't set it

      if (pdf.previousAutoTable && pdf.previousAutoTable.finalY) {
        finalY = pdf.previousAutoTable.finalY + 10;
      }

      // Calculate total amount safely
      const totalAmount = order.total_amount ||
                         order.items.reduce((sum, item) => sum + (item.subtotal || 0), 0) ||
                         0;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Amount: LKR ${parseFloat(totalAmount).toFixed(2)}`, 120, finalY);

      // Add payment information if available
      if (order.amount_paid > 0) {
        finalY += 6;
        pdf.text(`Amount Paid: LKR ${parseFloat(order.amount_paid).toFixed(2)}`, 120, finalY);

        if (order.balance_due > 0) {
          finalY += 6;
          pdf.text(`Balance Due: LKR ${parseFloat(order.balance_due).toFixed(2)}`, 120, finalY);
        }
      }

      // Add payment terms if it's a credit payment
      if (order.payment_method === 'credit' && order.credit_term_months > 0) {
        finalY += 8;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Payment Terms: ${order.credit_term_months} months credit`, 120, finalY);

        if (order.payment_due_date) {
          finalY += 5;
          pdf.text(`Payment Due Date: ${new Date(order.payment_due_date).toLocaleDateString()}`, 120, finalY);
        }
      }

      // Add footer
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for your business!', 20, finalY + 20);

      // Add company contact information
      finalY += 30;
      pdf.setFontSize(8);
      pdf.text('Pri Fashion | Sri Lanka | Quality Clothes for Everyone', 20, finalY);

      // Save the PDF if autosave is true
      if (autosave) {
        pdf.save(`Invoice-${order.invoice_number}.pdf`);

        setSuccessMessage("Invoice printed successfully!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }

      // Return the PDF document for further processing
      return pdf;
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to generate PDF invoice: ${error.message || "Unknown error"}`);
      return null;
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
                        <th>Payment</th>
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
                          <td>
                            {order.payment_status ? (
                              <span className={`badge ${
                                order.payment_status === 'paid' ? 'bg-success' :
                                order.payment_status === 'partially_paid' ? 'bg-warning text-dark' :
                                'bg-danger'
                              }`}>
                                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1).replace('_', ' ')}
                              </span>
                            ) : (
                              order.status === 'delivered' ? (
                                <span className="badge bg-danger">Unpaid</span>
                              ) : (
                                <span className="badge bg-secondary">N/A</span>
                              )
                            )}
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>{order.invoice_number || "-"}</td>
                          <td>
                            <div>LKR {parseFloat(order.total_amount || 0).toFixed(2)}</div>
                            {order.amount_paid > 0 && (
                              <small className="text-muted">
                                Paid: LKR {parseFloat(order.amount_paid || 0).toFixed(2)}
                              </small>
                            )}
                          </td>
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
                                    title="Mark as Delivered"
                                  >
                                    <FaTruck className="me-1" /> Deliver
                                  </button>
                                </>
                              )}

                              {(order.status === "delivered" || order.status === "partially_paid" || order.status === "payment_due") && (
                                <button
                                  onClick={() => handleRecordPayment(order.id)}
                                  disabled={processing}
                                  className="btn btn-sm btn-warning d-flex align-items-center"
                                  title="Record Payment"
                                >
                                  <FaMoneyBillWave className="me-1" /> Payment
                                </button>
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
                        <p className="mb-1"><strong>Status:</strong> <span className={`badge ${getBadgeClass(selectedOrder.status)}`}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span></p>
                        <p className="mb-1"><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                        {selectedOrder.approval_date && (
                          <p className="mb-1"><strong>Approved Date:</strong> {new Date(selectedOrder.approval_date).toLocaleString()}</p>
                        )}
                        {selectedOrder.delivery_date && (
                          <p className="mb-1"><strong>Delivery Date:</strong> {new Date(selectedOrder.delivery_date).toLocaleString()}</p>
                        )}
                        {selectedOrder.delivered_items_count > 0 && (
                          <p className="mb-1"><strong>Items Delivered:</strong> {selectedOrder.delivered_items_count}</p>
                        )}
                        {selectedOrder.delivery_notes && (
                          <p className="mb-1"><strong>Delivery Notes:</strong> {selectedOrder.delivery_notes}</p>
                        )}
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Invoice Number:</strong> {selectedOrder.invoice_number || "Not invoiced yet"}</p>
                        <p className="mb-1"><strong>Total Amount:</strong> LKR {parseFloat(selectedOrder.total_amount || 0).toFixed(2)}</p>

                        {/* Payment Information */}
                        {selectedOrder.payment_status && (
                          <p className="mb-1">
                            <strong>Payment Status:</strong>
                            <span className={`badge ms-1 ${
                              selectedOrder.payment_status === 'paid' ? 'bg-success' :
                              selectedOrder.payment_status === 'partially_paid' ? 'bg-warning text-dark' :
                              'bg-danger'
                            }`}>
                              {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1).replace('_', ' ')}
                            </span>
                          </p>
                        )}

                        {selectedOrder.amount_paid > 0 && (
                          <p className="mb-1"><strong>Amount Paid:</strong> LKR {parseFloat(selectedOrder.amount_paid || 0).toFixed(2)}</p>
                        )}

                        {selectedOrder.balance_due > 0 && (
                          <p className="mb-1"><strong>Balance Due:</strong> LKR {parseFloat(selectedOrder.balance_due || 0).toFixed(2)}</p>
                        )}

                        {selectedOrder.payment_method && (
                          <p className="mb-1"><strong>Payment Method:</strong> {selectedOrder.payment_method.charAt(0).toUpperCase() + selectedOrder.payment_method.slice(1)}</p>
                        )}

                        {selectedOrder.payment_date && (
                          <p className="mb-1"><strong>Last Payment Date:</strong> {new Date(selectedOrder.payment_date).toLocaleDateString()}</p>
                        )}

                        {/* Check Payment Details */}
                        {selectedOrder.payment_method === 'check' && (
                          <>
                            {selectedOrder.check_number && (
                              <p className="mb-1"><strong>Check Number:</strong> {selectedOrder.check_number}</p>
                            )}
                            {selectedOrder.check_date && (
                              <p className="mb-1"><strong>Check Date:</strong> {new Date(selectedOrder.check_date).toLocaleDateString()}</p>
                            )}
                            {selectedOrder.bank_name && (
                              <p className="mb-1"><strong>Bank:</strong> {selectedOrder.bank_name}</p>
                            )}
                          </>
                        )}

                        {/* Credit Payment Details */}
                        {selectedOrder.payment_method === 'credit' && (
                          <>
                            {selectedOrder.credit_term_months > 0 && (
                              <p className="mb-1"><strong>Credit Term:</strong> {selectedOrder.credit_term_months} months</p>
                            )}
                            {selectedOrder.payment_due_date && (
                              <p className="mb-1">
                                <strong>Payment Due Date:</strong> {new Date(selectedOrder.payment_due_date).toLocaleDateString()}
                                {selectedOrder.is_payment_overdue && (
                                  <span className="badge bg-danger ms-2">Overdue</span>
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Owner Notes */}
                    {selectedOrder.owner_notes && (
                      <div className="mb-3">
                        <h6 className="fw-bold">Owner Notes:</h6>
                        <div className="p-2 bg-light rounded">
                          {selectedOrder.owner_notes}
                        </div>
                      </div>
                    )}

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
                                <td>LKR {parseFloat(item.subtotal || 0).toFixed(2)}</td>
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
                    <div className="mt-4 d-flex flex-wrap gap-2 justify-content-end">
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

                      {selectedOrder.invoice_number && (
                        <button
                          onClick={() => printInvoice(selectedOrder)}
                          className="btn btn-info text-white"
                        >
                          <FaPrint className="me-2" /> Print Invoice
                        </button>
                      )}

                      {selectedOrder.status === "invoiced" && (
                        <button
                          onClick={() => handleMarkDelivered(selectedOrder.id)}
                          disabled={processing}
                          className="btn btn-success"
                        >
                          <FaTruck className="me-2" /> Mark as Delivered
                        </button>
                      )}

                      {(selectedOrder.status === "delivered" ||
                        selectedOrder.status === "partially_paid" ||
                        selectedOrder.status === "payment_due") && (
                        <button
                          onClick={() => handleRecordPayment(selectedOrder.id)}
                          disabled={processing}
                          className="btn btn-warning"
                        >
                          <FaMoneyBillWave className="me-2" /> Record Payment
                        </button>
                      )}

                      {/* Download Invoice as PDF */}
                      {selectedOrder.invoice_number && (
                        <button
                          onClick={() => {
                            const pdfDoc = printInvoice(selectedOrder, false);
                            if (pdfDoc) {
                              pdfDoc.save(`Invoice-${selectedOrder.invoice_number}.pdf`);
                              setSuccessMessage("Invoice downloaded successfully!");
                              setTimeout(() => setSuccessMessage(""), 3000);
                            }
                          }}
                          className="btn btn-secondary"
                        >
                          <FaDownload className="me-2" /> Download Invoice
                        </button>
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
