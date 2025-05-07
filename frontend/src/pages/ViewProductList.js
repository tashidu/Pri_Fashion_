import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Link } from "react-router-dom";
import {
  FaSearch, FaFilter, FaEye, FaEyeSlash,
  FaCheckCircle, FaSpinner, FaExclamationTriangle,
  FaSortAmountDown, FaSortAmountUp
} from "react-icons/fa";

// Helper function to get color code from color name
const getColorCode = (colorName) => {
  // Common color mapping
  const colorMap = {
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'black': '#000000',
    'white': '#FFFFFF',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'orange': '#FFA500',
    'brown': '#A52A2A',
    'grey': '#808080',
    'gray': '#808080',
    'navy': '#000080',
    'teal': '#008080',
    'maroon': '#800000',
    'olive': '#808000',
    'lime': '#00FF00',
    'aqua': '#00FFFF',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'tan': '#D2B48C',
    'khaki': '#F0E68C',
    'lavender': '#E6E6FA',
    'magenta': '#FF00FF',
    'cyan': '#00FFFF',
    'turquoise': '#40E0D0',
    'indigo': '#4B0082',
    'violet': '#EE82EE',
    'crimson': '#DC143C',
    'coral': '#FF7F50',
    'salmon': '#FA8072',
  };

  // Try to match the color name (case insensitive)
  if (!colorName) return '#CCCCCC'; // Default gray for undefined

  const lowerCaseName = colorName.toLowerCase();

  // Check for exact match
  if (colorMap[lowerCaseName]) {
    return colorMap[lowerCaseName];
  }

  // Check for partial match
  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerCaseName.includes(key)) {
      return value;
    }
  }

  // If no match found, return a default color
  return '#CCCCCC';
};

// Helper function to determine text color based on background color
const getContrastColor = (hexColor) => {
  // Default to black if no color provided
  if (!hexColor) return '#000000';

  // Convert hex to RGB
  let r, g, b;

  // Handle shorthand hex (#fff)
  if (hexColor.length === 4) {
    r = parseInt(hexColor[1] + hexColor[1], 16);
    g = parseInt(hexColor[2] + hexColor[2], 16);
    b = parseInt(hexColor[3] + hexColor[3], 16);
  }
  // Handle full hex (#ffffff)
  else if (hexColor.length === 7) {
    r = parseInt(hexColor.substring(1, 3), 16);
    g = parseInt(hexColor.substring(3, 5), 16);
    b = parseInt(hexColor.substring(5, 7), 16);
  }
  // Default values if invalid hex
  else {
    r = 0;
    g = 0;
    b = 0;
  }

  // Calculate luminance - brighter colors have higher values
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use white text for dark backgrounds, black text for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

const ViewProductList = () => {
  const [products, setProducts] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("product_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? "card" : "table");
  const [retryCount, setRetryCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Function to fetch products data
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/sewing/product-list/");
      console.log("API Response:", res.data);
      setProducts(res.data);
      setError("");
      setLoading(false);
    } catch (err) {
      console.error("Error fetching product list:", err);
      // Provide more detailed error information
      const errorMessage = err.response
        ? `Error: ${err.response.status} - ${err.response.statusText}`
        : err.request
          ? "No response received from server. Check if the backend is running."
          : "Failed to make request. Check your network connection.";

      setError(`Failed to fetch product list. ${errorMessage}`);
      setLoading(false);

      // If we haven't retried too many times, try again
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchProducts();
        }, 2000); // Wait 2 seconds before retrying
      }
    }
  };

  // Fetch products data on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle responsive view mode and sidebar state
  useEffect(() => {
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? "card" : "table");
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle expanded row
  const toggleRow = (productId) => {
    setExpandedRows((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase() || "in progress") {
      case "completed":
        return "bg-success";
      case "in progress":
        return "bg-warning text-dark";
      case "pending":
        return "bg-info text-dark";
      default:
        return "bg-secondary";
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    // First filter by search term and status
    let result = [...products];

    if (searchTerm) {
      result = result.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(product =>
        (product.status || "in progress").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Then sort
    result.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Convert to strings for comparison if they're not numbers
      if (typeof aValue !== 'number') aValue = String(aValue).toLowerCase();
      if (typeof bValue !== 'number') bValue = String(bValue).toLowerCase();

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [products, searchTerm, statusFilter, sortField, sortDirection]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />;
  };

  // Render table view
  const renderTableView = () => (
    <div className="table-responsive">
      <table className="table table-hover shadow-sm">
        <thead className="table-light">
          <tr>
            <th className="cursor-pointer" onClick={() => handleSort("product_name")}>
              <div className="d-flex align-items-center">
                Product Name {renderSortIndicator("product_name")}
              </div>
            </th>
            <th className="cursor-pointer" onClick={() => handleSort("last_update_date")}>
              <div className="d-flex align-items-center">
                Last Update {renderSortIndicator("last_update_date")}
              </div>
            </th>
            <th className="cursor-pointer" onClick={() => handleSort("total_sewn")}>
              <div className="d-flex align-items-center">
                Total Sewing {renderSortIndicator("total_sewn")}
              </div>
            </th>
            <th className="cursor-pointer" onClick={() => handleSort("total_cut")}>
              <div className="d-flex align-items-center">
                Total Cut {renderSortIndicator("total_cut")}
              </div>
            </th>
            <th className="cursor-pointer" onClick={() => handleSort("remaining")}>
              <div className="d-flex align-items-center">
                Remaining {renderSortIndicator("remaining")}
              </div>
            </th>
            <th className="cursor-pointer" onClick={() => handleSort("status")}>
              <div className="d-flex align-items-center">
                Status {renderSortIndicator("status")}
              </div>
            </th>
            <th>Details</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="8" className="text-center py-4">
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center">
                    <FaSpinner className="me-2 fa-spin" /> Loading products...
                  </div>
                ) : (
                  <div className="text-muted">No products found matching your criteria</div>
                )}
              </td>
            </tr>
          ) : (
            currentItems.map((prod) => (
              <React.Fragment key={prod.id}>
                <tr className={expandedRows[prod.id] ? "expanded-row" : ""}>
                  <td className="fw-medium">{prod.product_name}</td>
                  <td>{prod.last_update_date || "N/A"}</td>
                  <td>{prod.total_sewn}</td>
                  <td>{prod.total_cut}</td>
                  <td>
                    <span className={prod.remaining <= 0 ? "text-success" : "text-danger"}>
                      {prod.remaining}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(prod.status)}`}>
                      {prod.status || "In Progress"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary d-flex align-items-center"
                      onClick={() => toggleRow(prod.id)}
                    >
                      {expandedRows[prod.id] ? (
                        <><FaEyeSlash className="me-1" /> Hide</>
                      ) : (
                        <><FaEye className="me-1" /> View</>
                      )}
                    </button>
                  </td>
                  <td>
                    <Link to={`/approve-finished-product/${prod.id}`}>
                      <button className="btn btn-sm btn-success d-flex align-items-center">
                        <FaCheckCircle className="me-1" /> Approve
                      </button>
                    </Link>
                  </td>
                </tr>

                {expandedRows[prod.id] && (
                  <tr className="expanded-details">
                    <td colSpan={8}>
                      <div className="p-3 bg-light rounded">
                        <h5 className="mb-3 text-primary">Color Details</h5>
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered">
                            <thead className="table-light">
                              <tr>
                                <th>Color</th>
                                <th>XS</th>
                                <th>S</th>
                                <th>M</th>
                                <th>L</th>
                                <th>XL</th>
                                <th>Total Sewing</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prod.color_details && prod.color_details.length > 0 ? (
                                prod.color_details.map((color, idx) => (
                                  <tr key={idx}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div
                                          className="color-swatch me-2"
                                          style={{
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: getColorCode(color.color),
                                            borderRadius: '4px',
                                            display: 'inline-block',
                                            border: '1px solid #ddd'
                                          }}
                                        ></div>
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          backgroundColor: `${getColorCode(color.color)}20`, // 20 is hex for 12% opacity
                                          color: getContrastColor(getColorCode(color.color))
                                        }}>
                                          {color.color}
                                        </span>
                                      </div>
                                    </td>
                                    <td>{color.xs || 0}</td>
                                    <td>{color.s || 0}</td>
                                    <td>{color.m || 0}</td>
                                    <td>{color.l || 0}</td>
                                    <td>{color.xl || 0}</td>
                                    <td>{color.total_sewn || 0}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="7" className="text-center py-3">
                                    No color details available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Render card view (for mobile)
  const renderCardView = () => (
    <div className="row g-3">
      {currentItems.length === 0 ? (
        <div className="col-12 text-center py-4">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center">
              <FaSpinner className="me-2 fa-spin" /> Loading products...
            </div>
          ) : (
            <div className="text-muted">No products found matching your criteria</div>
          )}
        </div>
      ) : (
        currentItems.map((prod) => (
          <div className="col-12" key={prod.id}>
            <div className="card shadow-sm h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{prod.product_name}</h5>
                <span className={`badge ${getStatusBadgeClass(prod.status)}`}>
                  {prod.status || "In Progress"}
                </span>
              </div>
              <div className="card-body">
                <div className="row mb-2">
                  <div className="col-6">
                    <small className="text-muted">Last Update:</small>
                    <div>{prod.last_update_date || "N/A"}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Remaining:</small>
                    <div className={prod.remaining <= 0 ? "text-success" : "text-danger"}>
                      {prod.remaining}
                    </div>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <small className="text-muted">Total Sewing:</small>
                    <div>{prod.total_sewn}</div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Total Cut:</small>
                    <div>{prod.total_cut}</div>
                  </div>
                </div>

                <button
                  className="btn btn-sm btn-outline-primary w-100 mb-2"
                  onClick={() => toggleRow(prod.id)}
                >
                  {expandedRows[prod.id] ? (
                    <><FaEyeSlash className="me-1" /> Hide Details</>
                  ) : (
                    <><FaEye className="me-1" /> View Details</>
                  )}
                </button>

                {expandedRows[prod.id] && (
                  <div className="mt-3 p-2 bg-light rounded">
                    <h6 className="mb-2 text-primary">Color Details</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead className="table-light">
                          <tr>
                            <th>Color</th>
                            <th>XS</th>
                            <th>S</th>
                            <th>M</th>
                            <th>L</th>
                            <th>XL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prod.color_details && prod.color_details.length > 0 ? (
                            prod.color_details.map((color, idx) => (
                              <tr key={idx}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="color-swatch me-1"
                                      style={{
                                        width: '15px',
                                        height: '15px',
                                        backgroundColor: getColorCode(color.color),
                                        borderRadius: '3px',
                                        display: 'inline-block',
                                        border: '1px solid #ddd'
                                      }}
                                    ></div>
                                    <small style={{
                                      padding: '1px 6px',
                                      borderRadius: '3px',
                                      backgroundColor: `${getColorCode(color.color)}20`,
                                      color: getContrastColor(getColorCode(color.color))
                                    }}>
                                      {color.color}
                                    </small>
                                  </div>
                                </td>
                                <td><small>{color.xs || 0}</small></td>
                                <td><small>{color.s || 0}</small></td>
                                <td><small>{color.m || 0}</small></td>
                                <td><small>{color.l || 0}</small></td>
                                <td><small>{color.xl || 0}</small></td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="text-center py-2">
                                <small>No color details</small>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link to={`/approve-finished-product/${prod.id}`} className="w-100">
                  <button className="btn btn-success btn-sm w-100">
                    <FaCheckCircle className="me-1" /> Approve Product
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <RoleBasedNavBar />
      <div
        className="main-content"
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <div className="container-fluid px-0">
          {/* Header with title and view toggle */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Product List</h2>
            <div className="btn-group">
              <button
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <i className="bi bi-table"></i>
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <i className="bi bi-grid"></i>
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <FaExclamationTriangle className="me-2" /> {error}
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={() => fetchProducts()}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                    aria-label="Close"
                  ></button>
                </div>
              </div>
            </div>
          )}

          {/* Search and filter controls */}
          <div className="row mb-4 g-2">
            <div className="col-md-6 col-sm-12">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
            </div>
            <div className="col-md-4 col-sm-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <FaFilter className="text-muted" />
                </span>
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="col-md-2 col-sm-4">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Products list - table or card view */}
          <div className="card shadow-sm mb-4">
            <div className="card-body p-0">
              {viewMode === "table" ? renderTableView() : renderCardView()}
            </div>
          </div>

          {/* Pagination */}
          {filteredAndSortedProducts.length > 0 && (
            <nav aria-label="Product list pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={prevPage}>
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>

                {/* Show limited page numbers with ellipsis for large page counts */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(num =>
                    num === 1 ||
                    num === totalPages ||
                    (num >= currentPage - 1 && num <= currentPage + 1)
                  )
                  .map((number, index, array) => {
                    // Add ellipsis
                    if (index > 0 && array[index - 1] !== number - 1) {
                      return (
                        <React.Fragment key={`ellipsis-${number}`}>
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                          <li className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => paginate(number)}>
                              {number}
                            </button>
                          </li>
                        </React.Fragment>
                      );
                    }
                    return (
                      <li
                        key={number}
                        className={`page-item ${currentPage === number ? 'active' : ''}`}
                      >
                        <button className="page-link" onClick={() => paginate(number)}>
                          {number}
                        </button>
                      </li>
                    );
                  })
                }

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={nextPage}>
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Summary information */}
          <div className="text-center text-muted mb-3">
            {filteredAndSortedProducts.length > 0 ? (
              <small>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
              </small>
            ) : !loading && (
              <small>No products found</small>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for this component */}
      <style jsx="true">{`
        .cursor-pointer {
          cursor: pointer;
        }
        .expanded-row {
          background-color: rgba(217, 237, 251, 0.2);
        }
        .expanded-details {
          background-color: #f8f9fa;
        }
        .table th {
          white-space: nowrap;
        }
      `}</style>
    </>
  );
};

export default ViewProductList;
