import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaFilter, FaEye, FaPaperPlane, FaSync } from "react-icons/fa";
import OrderCoordinatorNavBar from "../components/OrderCoordinatorNavBar";
import "bootstrap/dist/css/bootstrap.min.css";

const OrderListPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
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

  const handleSubmitOrder = async (orderId) => {
    const confirm = window.confirm("Are you sure you want to submit this order? This action cannot be undone.");
    if (!confirm) return;

    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:8000/api/orders/${orderId}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update the order status locally to avoid refetching
        const updatedOrders = orders.map(order =>
          order.id === orderId ? { ...order, status: 'submitted' } : order
        );
        setOrders(updatedOrders);

        // Show success message
        const successMessage = document.getElementById('success-message');
        successMessage.style.display = "block";

        // Hide success message after 3 seconds
        setTimeout(() => {
          successMessage.style.display = "none";
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to submit order");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      setError("Error submitting the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const viewOrderItems = async (orderId) => {
    if (selectedOrderId === orderId) {
      // If clicking on the same order, toggle the view
      setSelectedOrderId(null);
      setSelectedOrderItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/api/orders/orders/${orderId}/`
      );
      setSelectedOrderItems(response.data.items);
      setSelectedOrderId(orderId);
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      setError("Failed to load order details. Please try again.");
    } finally {
      setLoading(false);
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

  // Effect to handle sidebar state based on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <OrderCoordinatorNavBar />
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
            </div>
          </div>

          {/* Success message */}
          <div
            id="success-message"
            className="alert alert-success alert-dismissible fade show"
            role="alert"
            style={{ display: 'none' }}
          >
            <strong>Success!</strong> Order submitted successfully!
            <button type="button" className="btn-close" onClick={() => {
              document.getElementById('success-message').style.display = 'none';
            }}></button>
          </div>

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
          {loading && !submitting && (
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
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => viewOrderItems(order.id)}
                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                              >
                                <FaEye className="me-1" /> View
                              </button>

                              {order.status === "draft" && (
                                <button
                                  onClick={() => handleSubmitOrder(order.id)}
                                  disabled={submitting}
                                  className="btn btn-sm btn-success d-flex align-items-center"
                                >
                                  {submitting ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <FaPaperPlane className="me-1" /> Submit
                                    </>
                                  )}
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
                  Order Items for Order #{selectedOrderId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setSelectedOrderId(null);
                    setSelectedOrderItems([]);
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
                ) : selectedOrderItems.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
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
                        {selectedOrderItems.map((item, index) => (
                          <tr key={index}>
                            <td className="fw-medium">{item.finished_product_name || item.finished_product}</td>
                            <td>{item.quantity_6_packs}</td>
                            <td>{item.quantity_12_packs}</td>
                            <td>{item.quantity_extra_items}</td>
                            <td>{item.total_units}</td>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderListPage;
