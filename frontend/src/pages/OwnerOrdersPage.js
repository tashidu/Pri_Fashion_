import { useEffect, useState } from "react";
import { FaSearch, FaFilter, FaEye, FaCheck, FaFileInvoice, FaMoneyBillWave, FaSync, FaDownload, FaChartLine, FaUndo } from "react-icons/fa";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
// Import custom modal components
import PaymentModal from "../components/PaymentModal";
import DeliveryModal from "../components/DeliveryModal";
import RevertOrderModal from "../components/RevertOrderModal";
// Import PDF generation libraries
import { jsPDF } from "jspdf";
import { autoTable } from 'jspdf-autotable';
// Import authenticated API utilities
import { authGet, authPost } from "../utils/api";

const OwnerOrdersPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderPayments, setOrderPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directSaleFilter, setDirectSaleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [orderForModal, setOrderForModal] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    // Apply filters whenever orders, searchTerm, statusFilter, or directSaleFilter changes
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

    // Apply direct sale filter
    if (directSaleFilter !== "all") {
      const isDirect = directSaleFilter === "direct";
      result = result.filter(order => (order.direct_sale === true) === isDirect);
    }

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, statusFilter, directSaleFilter]);

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
      const response = await authGet(
        "orders/orders/create/"
      );
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      if (error.code === 'ERR_NETWORK') {
        setError("Network error: Cannot connect to the server. Please make sure the backend server is running.");
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server error: ${error.response.status} - ${error.response.data.detail || 'Failed to load orders'}`);
      } else {
        setError("Failed to load orders. Please try again later.");
      }
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
      setOrderPayments([]);
      return;
    }

    try {
      setLoading(true);

      // Fetch order details
      const orderResponse = await authGet(
        `orders/orders/${orderId}/`
      );

      // Fetch payment history
      const paymentsResponse = await authGet(
        `orders/orders/${orderId}/payments/`
      );

      setSelectedOrderItems(orderResponse.data.items);
      setSelectedOrderId(orderId);
      setSelectedOrder(orderResponse.data);
      setOrderPayments(paymentsResponse.data);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      if (error.code === 'ERR_NETWORK') {
        setError("Network error: Cannot connect to the server. Please make sure the backend server is running.");
      } else if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data.detail || 'Failed to load order details'}`);
      } else {
        setError("Failed to load order details. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to approve this order?");
    if (!confirm) return;

    setProcessing(true);
    try {
      const response = await authPost(`orders/orders/${orderId}/approve/`);

      if (response.status === 200) {
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
      }
    } catch (error) {
      console.error("Approval failed:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Failed to approve order");
      } else {
        setError("Error approving the order. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to generate an invoice for this order?");
    if (!confirm) return;

    setProcessing(true);
    try {
      const response = await authPost(`orders/orders/${orderId}/generate-invoice/`);

      if (response.status === 200) {
        const data = response.data;

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
      }
    } catch (error) {
      console.error("Invoice generation failed:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Failed to generate invoice");
      } else {
        setError("Error generating invoice. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  // These functions are kept for the DeliveryModal component which might be used by other roles
  // Owners should not have access to delivery functionality as per requirements
  /* eslint-disable no-unused-vars */
  const handleMarkDelivered = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setError("Order not found");
      return;
    }

    // Set the order for the modal and show the modal
    setOrderForModal(order);
    setShowDeliveryModal(true);
  };

  const handleDeliverySubmit = async (deliveryData) => {
  /* eslint-enable no-unused-vars */
    if (!orderForModal) return;

    setProcessing(true);
    try {
      const response = await authPost(`orders/orders/${orderForModal.id}/mark-delivered/`, deliveryData);

      if (response.status === 200) {
        const data = response.data;

        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderForModal.id ? {
            ...order,
            status: 'delivered',
            delivery_date: data.delivery_date,
            delivery_notes: deliveryData.delivery_notes,
            delivered_items_count: deliveryData.delivered_items_count
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
        if (selectedOrderId === orderForModal.id) {
          viewOrderItems(orderForModal.id);
        }

        // Close the modal
        setShowDeliveryModal(false);
      }
    } catch (error) {
      console.error("Mark delivered failed:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Failed to mark order as delivered");
      } else {
        setError("Error marking the order as delivered. Please try again.");
      }
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

    // Set the order for the modal and show the modal
    setOrderForModal(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    if (!orderForModal) return;

    setProcessing(true);
    try {
      const response = await authPost(`orders/orders/${orderForModal.id}/record-payment/`, paymentData);

      if (response.status === 200) {
        const data = response.data;

        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderForModal.id ? {
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

        // Refresh order details and payment history if this is the selected order
        if (selectedOrderId === orderForModal.id) {
          // Fetch updated payment history
          try {
            const paymentsResponse = await authGet(
              `orders/orders/${orderForModal.id}/payments/`
            );
            setOrderPayments(paymentsResponse.data);

            // Also refresh the order details
            viewOrderItems(orderForModal.id);
          } catch (err) {
            console.error("Failed to refresh payment history:", err);
          }
        }

        // Close the modal
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error("Record payment failed:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Failed to record payment");
      } else {
        setError("Error recording payment. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (order) => {
    try {
      if (!order || !order.items) {
        setError("Cannot generate invoice: Order data is missing.");
        return;
      }

      if (!order.items.length) {
        setError("Cannot generate invoice: No order items found.");
        return;
      }

      if (!order.invoice_number) {
        setError("Cannot generate invoice: Invoice number is missing.");
        return;
      }

      // Create a new jsPDF instance for download
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Generate PDF content
      generateInvoicePdf(doc, order);

      // Save the PDF
      doc.save(`Invoice-${order.invoice_number}.pdf`);

      // Show success message
      setSuccessMessage("Invoice downloaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError(`Failed to download invoice: ${error.message || "Unknown error"}`);
    }
  };

  // Function to generate PDF content
  const generateInvoicePdf = (doc, order) => {
    try {
      // Add the logo to the PDF
      try {
        const baseUrl = window.location.origin;
        doc.addImage(`${baseUrl}/logo.png`, 'PNG', 14, 10, 20, 20);
      } catch (logoError) {
        console.warn("Could not add logo to PDF:", logoError);
        // Fallback to a simple placeholder
        doc.setFillColor(41, 128, 185);
        doc.rect(14, 10, 20, 20, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("PF", 24, 22, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      }

      // Add company header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Pri Fashion', 40, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Quality Clothes for Everyone', 40, 28);
      doc.text('Sri Lanka', 40, 34);

      // Add invoice details
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`INVOICE #${order.invoice_number}`, 120, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 120, 28);
      doc.text(`Order ID: ${order.id}`, 120, 34);
      doc.text(`Status: ${order.status.toUpperCase()}`, 120, 40);

      // Add customer info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 20, 50);

      doc.setFont('helvetica', 'normal');
      doc.text(`${order.shop_name || order.shop || 'Customer'}`, 20, 58);

      // Prepare table data
      const tableBody = [];

      // Add each order item to the table
      order.items.forEach(item => {
        const productName = item.finished_product_name || `Product #${item.finished_product || 'Unknown'}`;
        const qty6Packs = item.quantity_6_packs || 0;
        const qty12Packs = item.quantity_12_packs || 0;
        const qtyExtra = item.quantity_extra_items || 0;
        const totalUnits = item.total_units || 0;

        // Calculate unit price safely
        let unitPrice = 0;
        let subtotal = 0;

        if (item.subtotal && item.total_units && item.total_units > 0) {
          unitPrice = parseFloat(item.subtotal) / parseFloat(item.total_units);
          subtotal = parseFloat(item.subtotal);
        } else if (item.subtotal) {
          subtotal = parseFloat(item.subtotal);
        }

        tableBody.push([
          productName,
          qty6Packs,
          qty12Packs,
          qtyExtra,
          totalUnits,
          `LKR ${unitPrice.toFixed(2)}`,
          `LKR ${subtotal.toFixed(2)}`
        ]);
      });

      // Add the table to the PDF
      autoTable(doc, {
        startY: 70,
        head: [['Product', '6 Packs', '12 Packs', 'Extra Items', 'Total Units', 'Unit Price', 'Subtotal']],
        body: tableBody,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      });

      // Get the final Y position after the table
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;

      // Calculate total amount
      const totalAmount = parseFloat(order.total_amount || 0);

      // Add total amount
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Amount: LKR ${totalAmount.toFixed(2)}`, 120, finalY);

      // Add payment information if available
      if (parseFloat(order.amount_paid || 0) > 0) {
        finalY += 6;
        doc.text(`Amount Paid: LKR ${parseFloat(order.amount_paid || 0).toFixed(2)}`, 120, finalY);

        if (parseFloat(order.balance_due || 0) > 0) {
          finalY += 6;
          doc.text(`Balance Due: LKR ${parseFloat(order.balance_due || 0).toFixed(2)}`, 120, finalY);
        }
      }

      // Add payment terms if it's a credit payment
      if (order.payment_method === 'credit' && order.credit_term_months > 0) {
        finalY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Payment Terms: ${order.credit_term_months} months credit`, 120, finalY);

        if (order.payment_due_date) {
          finalY += 5;
          doc.text(`Payment Due Date: ${new Date(order.payment_due_date).toLocaleDateString()}`, 120, finalY);
        }
      }

      // Add signature fields
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Signatures:', 20, finalY + 10);

      // Draw signature lines
      finalY += 15;

      // Owner signature
      doc.line(20, finalY + 15, 80, finalY + 15); // Signature line
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Owner Signature", 20, finalY + 20);
      doc.text("Date: ________________", 20, finalY + 25);

      // Shop owner signature
      doc.line(120, finalY + 15, 180, finalY + 15); // Signature line
      doc.text("Shop Owner Signature", 120, finalY + 20);
      doc.text("Date: ________________", 120, finalY + 25);

      // Add footer
      finalY += 35;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', 20, finalY);

      // Add company contact information
      finalY += 10;
      doc.setFontSize(8);
      doc.text('Pri Fashion | Sri Lanka | Quality Clothes for Everyone', 20, finalY);

      return doc;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

  const handleRevertOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      setError("Order not found");
      return;
    }

    // Check if the order can be reverted
    if (order.payment_status === 'paid' || order.payment_status === 'partially_paid') {
      setError("Cannot revert orders that have been paid or partially paid.");
      return;
    }

    if (order.status !== 'draft' && order.status !== 'submitted' && order.status !== 'approved' &&
        order.status !== 'delivered' && order.status !== 'invoiced') {
      setError("Only draft, submitted, approved, delivered, or invoiced orders can be reverted.");
      return;
    }

    // Set the order for the modal and show the modal
    setOrderForModal(order);
    setShowRevertModal(true);
  };

  const handleRevertSubmit = async () => {
    if (!orderForModal) return;

    setProcessing(true);
    try {
      const response = await authPost(`orders/orders/${orderForModal.id}/revert/`);

      if (response.status === 200) {
        // Remove the order from the local state
        const updatedOrders = orders.filter(order => order.id !== orderForModal.id);
        setOrders(updatedOrders);

        // Show success message
        setSuccessMessage(response.data.message || "Order has been reverted and deleted successfully! New packing sessions have been created to restore inventory.");

        // Hide success message after 5 seconds (longer message needs more time to read)
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);

        // Close the modal
        setShowRevertModal(false);

        // Reset selected order if this was the selected one
        if (selectedOrderId === orderForModal.id) {
          setSelectedOrderId(null);
          setSelectedOrderItems([]);
          setSelectedOrder(null);
        }
      }
    } catch (error) {
      console.error("Revert order failed:", error);
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Failed to revert order");
      } else {
        setError("Error reverting the order. Please try again.");
      }
    } finally {
      setProcessing(false);
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
            <div className="col-md-8">
              <h2 className="text-center fw-bold text-primary">Order Management</h2>
              <p className="text-center text-muted">Approve orders, generate invoices, and track payments</p>
            </div>
            <div className="col-md-4 d-flex justify-content-end align-items-center">
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={() => navigate('/order-analysis')}
              >
                <FaChartLine className="me-2" /> View Order Analysis
              </button>
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
              {error.includes("Network error") && (
                <div className="mt-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={fetchOrders}
                  >
                    <FaSync className="me-1" /> Try Again
                  </button>
                </div>
              )}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {/* Search and filter controls */}
          <div className="row mb-4">
            <div className="col-md-4 mb-3 mb-md-0">
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

            <div className="col-md-3 mb-3 mb-md-0">
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

            <div className="col-md-3 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text bg-light">
                  <FaFilter className="text-secondary" />
                </span>
                <select
                  className="form-select"
                  value={directSaleFilter}
                  onChange={(e) => setDirectSaleFilter(e.target.value)}
                >
                  <option value="all">All Orders</option>
                  <option value="direct">Direct Sales</option>
                  <option value="regular">Regular Orders</option>
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
                            <div className="d-flex flex-column gap-1">
                              <span className={`badge ${getBadgeClass(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              {order.direct_sale && (
                                <span className="badge bg-info text-dark">Direct Sale</span>
                              )}
                            </div>
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
                                    onClick={() => handleDownload(order)}
                                    className="btn btn-sm btn-primary d-flex align-items-center"
                                    title="Download Invoice"
                                  >
                                    <FaDownload className="me-1" /> Download
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

                              {/* Removed Revert button from here - it will only show in order details */}
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
                        <p className="mb-1">
                          <strong>Status:</strong>
                          <span className={`badge ${getBadgeClass(selectedOrder.status)} me-1`}>
                            {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                          </span>
                          {selectedOrder.direct_sale && (
                            <span className="badge bg-info text-dark">Direct Sale</span>
                          )}
                        </p>
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

                    {/* Payment History */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3">Payment History</h6>
                      {orderPayments && orderPayments.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Details</th>
                                <th>Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderPayments.map((payment) => (
                                <tr key={payment.id}>
                                  <td>{new Date(payment.payment_date).toLocaleString()}</td>
                                  <td className="fw-medium">LKR {parseFloat(payment.amount).toFixed(2)}</td>
                                  <td>
                                    <span className={`badge ${
                                      payment.payment_method === 'cash' ? 'bg-success' :
                                      payment.payment_method === 'check' ? 'bg-warning text-dark' :
                                      payment.payment_method === 'bank_transfer' ? 'bg-info text-dark' :
                                      payment.payment_method === 'credit' ? 'bg-danger' :
                                      'bg-secondary'
                                    }`}>
                                      {payment.payment_method.charAt(0).toUpperCase() + payment.payment_method.slice(1).replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td>
                                    {payment.payment_method === 'check' && (
                                      <>
                                        Check #{payment.check_number}<br />
                                        {payment.check_date && <small>Date: {new Date(payment.check_date).toLocaleDateString()}</small>}
                                        {payment.bank_name && <small><br />Bank: {payment.bank_name}</small>}
                                      </>
                                    )}
                                    {payment.payment_method === 'credit' && payment.payment_due_date && (
                                      <>
                                        Due: {new Date(payment.payment_due_date).toLocaleDateString()}<br />
                                        <small>Term: {payment.credit_term_months} months</small>
                                      </>
                                    )}
                                  </td>
                                  <td>{payment.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-light rounded">
                          <p className="text-muted mb-0">No payment records found.</p>
                        </div>
                      )}
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
                          onClick={() => handleDownload(selectedOrder)}
                          className="btn btn-primary"
                        >
                          <FaDownload className="me-2" /> Download Invoice
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

                      {/* Revert Order button - for draft, submitted, approved, delivered or invoiced orders that are unpaid */}
                      {(selectedOrder.status === "draft" || selectedOrder.status === "submitted" ||
                        selectedOrder.status === "approved" || selectedOrder.status === "delivered" ||
                        selectedOrder.status === "invoiced") &&
                       (!selectedOrder.payment_status || selectedOrder.payment_status === "unpaid") && (
                        <button
                          onClick={() => handleRevertOrder(selectedOrder.id)}
                          disabled={processing}
                          className="btn btn-danger btn-lg"
                        >
                          <FaUndo className="me-2" /> Revert Order
                        </button>
                      )}

                      {/* We've removed the separate download button since it's now part of the invoice preview modal */}
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

      {/* Modal Components */}
      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        order={orderForModal}
        onSubmit={handlePaymentSubmit}
        processing={processing}
      />

      <DeliveryModal
        show={showDeliveryModal}
        onHide={() => setShowDeliveryModal(false)}
        order={orderForModal}
        onSubmit={handleDeliverySubmit}
        processing={processing}
      />



      <RevertOrderModal
        show={showRevertModal}
        onHide={() => setShowRevertModal(false)}
        order={orderForModal}
        onSubmit={handleRevertSubmit}
        processing={processing}
      />
    </>
  );
};

export default OwnerOrdersPage;
