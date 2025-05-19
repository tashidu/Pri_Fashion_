import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import {
  Card,
  Table,
  Form,
  InputGroup,
  Button,
  Spinner,
  Alert,
  Badge,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
  Modal,
  Tabs,
  Tab
} from "react-bootstrap";
import {
  BsBoxSeam,
  BsSearch,
  BsSortDown,
  BsSortUp,
  BsExclamationTriangle,
  BsInfoCircle,
  BsArrowRepeat,
  BsCalendar,
  BsShop,
  BsCurrencyDollar,
  BsGraphUp
} from "react-icons/bs";
import {
  FaBoxes,
  FaBoxOpen,
  FaWarehouse,
  FaHistory,
  FaShoppingCart,
  FaStore,
  FaCalendarAlt,
  FaEye,
  FaChartLine,
  FaChartPie,
  FaChartBar,
  FaPercentage,
  FaFilePdf,
  FaDownload
} from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const ViewPackingInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("product_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [packingSessions, setPackingSessions] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  // PDF state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to fetch inventory data
  const fetchInventoryData = () => {
    setLoading(true);
    axios
      .get("http://localhost:8000/api/packing/inventory/")
      .then((res) => {
        setInventory(res.data);
        setFilteredInventory(res.data);

        // Calculate total items
        const total = res.data.reduce((sum, item) => sum + item.total_quantity, 0);
        setTotalItems(total);

        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        console.error("Error fetching packing inventory:", err);
        setError("Failed to load packing inventory data.");
        setLoading(false);
        setRefreshing(false);
      });
  };

  // Fetch inventory on component mount
  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInventoryData();
  };

  // Filter and sort inventory when search term or sort parameters change
  useEffect(() => {
    let result = [...inventory];

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.product_name?.toLowerCase().includes(lowerCaseSearch) ||
          item.total_quantity?.toString().includes(lowerCaseSearch)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === "product_name") {
        comparison = (a.product_name || "").localeCompare(b.product_name || "");
      } else if (sortField === "total_quantity") {
        comparison = a.total_quantity - b.total_quantity;
      } else if (sortField === "number_of_6_packs") {
        comparison = a.number_of_6_packs - b.number_of_6_packs;
      } else if (sortField === "number_of_12_packs") {
        comparison = a.number_of_12_packs - b.number_of_12_packs;
      } else if (sortField === "extra_items") {
        comparison = a.extra_items - b.extra_items;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredInventory(result);
  }, [inventory, searchTerm, sortField, sortOrder]);

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Function to determine badge color based on quantity
  const getQuantityBadgeVariant = (quantity) => {
    if (quantity === 0) return "danger";
    if (quantity < 10) return "warning";
    if (quantity < 50) return "info";
    return "success";
  };

  // Function to open the product detail modal
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setModalLoading(true);
    setModalError("");
    setShowModal(true);

    // Fetch packing sessions for this product
    axios.get(`http://localhost:8000/api/packing/product/${product.product_id}/sessions/`)
      .then(res => {
        setPackingSessions(res.data);

        // After getting packing sessions, fetch sales data
        return axios.get(`http://localhost:8000/api/orders/product/${product.product_id}/sales/`);
      })
      .then(res => {
        setSalesData(res.data);
        setModalLoading(false);
      })
      .catch(err => {
        console.error("Error fetching product details:", err);
        setModalError("Failed to load product details. Please try again.");
        setModalLoading(false);
      });
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setPackingSessions([]);
    setSalesData([]);
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Open PDF modal
  const openPdfModal = () => {
    setShowPdfModal(true);
  };

  // Close PDF modal
  const closePdfModal = () => {
    setShowPdfModal(false);
  };

  // Generate PDF report for packing inventory
  const generatePDF = () => {
    setPdfLoading(true);

    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font sizes
      const titleFontSize = 16;
      const headingFontSize = 14;
      const normalFontSize = 10;
      const smallFontSize = 8;

      // Add logo to the PDF
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

      // Add title
      doc.setFontSize(titleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Packing Inventory Real-Time Stock Level Report', 105, 20, { align: 'center' });

      // Add report date
      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });

      // Add summary information
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventory Summary', 20, 45);

      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');

      // Summary table data
      const summaryData = [
        ['Total Products', inventory.length.toString()],
        ['Total Items', totalItems.toString()],
        ['Average Items per Product', inventory.length > 0 ? (totalItems / inventory.length).toFixed(1) : '0']
      ];

      // Add summary table
      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: normalFontSize }
      });

      // Add inventory details heading
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Inventory', 20, doc.lastAutoTable.finalY + 15);

      // Prepare inventory data for table
      const inventoryData = filteredInventory.map(item => [
        item.id.toString(),
        item.product_name,
        item.number_of_6_packs.toString(),
        item.number_of_12_packs.toString(),
        item.extra_items.toString(),
        item.total_quantity.toString()
      ]);

      // Add inventory table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['ID', 'Product Name', '6-Packs', '12-Packs', 'Extra Items', 'Total Quantity']],
        body: inventoryData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: normalFontSize },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 }
        }
      });

      // Add footer
      doc.setFontSize(smallFontSize);
      doc.setFont('helvetica', 'italic');
      doc.text('Pri Fashion Garment Management System', 105, 280, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });

      // Save the PDF
      doc.save(`Packing_Inventory_Report_${new Date().toISOString().slice(0, 10)}.pdf`);

      setPdfLoading(false);
      setShowPdfModal(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to generate PDF: ${error.message}`);
      setPdfLoading(false);
      setShowPdfModal(false);
    }
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <h2 className="mb-4">
          <FaWarehouse className="me-2" />
          Packing Inventory
        </h2>

        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <BsExclamationTriangle className="me-2" size={20} />
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-primary p-3 me-3">
                  <FaBoxes className="text-white" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Total Products</h6>
                  <h3 className="mb-0">{loading ? <Spinner animation="border" size="sm" /> : inventory.length}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-success p-3 me-3">
                  <BsBoxSeam className="text-white" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Total Items</h6>
                  <h3 className="mb-0">{loading ? <Spinner animation="border" size="sm" /> : totalItems}</h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
              <Card.Body className="d-flex align-items-center">
                <div className="rounded-circle bg-info p-3 me-3">
                  <FaBoxOpen className="text-white" size={24} />
                </div>
                <div>
                  <h6 className="mb-0">Avg. Items per Product</h6>
                  <h3 className="mb-0">
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : inventory.length > 0 ? (
                      (totalItems / inventory.length).toFixed(1)
                    ) : (
                      0
                    )}
                  </h3>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <InputGroup className="w-50">
                <InputGroup.Text>
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <div>
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <Spinner animation="border" size="sm" className="me-1" />
                  ) : (
                    <BsArrowRepeat className="me-1" />
                  )}
                  Refresh
                </Button>
                <Button
                  variant="outline-success"
                  className="me-2"
                  onClick={openPdfModal}
                >
                  <FaFilePdf className="me-1" />
                  Download PDF Report
                </Button>
                <Link to="/add-packing-session">
                  <Button variant="primary">Add New Packing Session</Button>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-2" />
                <p>Loading packing inventory...</p>
              </div>
            ) : filteredInventory.length === 0 ? (
              <Alert variant="info">
                No packing inventory found. {searchTerm && "Try adjusting your search."}
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th
                        onClick={() => handleSort("product_name")}
                        style={{ cursor: "pointer" }}
                      >
                        Product Name
                        {sortField === "product_name" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th
                        onClick={() => handleSort("number_of_6_packs")}
                        style={{ cursor: "pointer" }}
                      >
                        6-Packs
                        {sortField === "number_of_6_packs" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th
                        onClick={() => handleSort("number_of_12_packs")}
                        style={{ cursor: "pointer" }}
                      >
                        12-Packs
                        {sortField === "number_of_12_packs" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th
                        onClick={() => handleSort("extra_items")}
                        style={{ cursor: "pointer" }}
                      >
                        Extra Items
                        {sortField === "extra_items" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th
                        onClick={() => handleSort("total_quantity")}
                        style={{ cursor: "pointer" }}
                      >
                        Total Quantity
                        {sortField === "total_quantity" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.color_code && (
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: item.color_code,
                                  borderRadius: "4px",
                                  marginRight: "8px",
                                  border: "1px solid #ddd"
                                }}
                              ></div>
                            )}
                            {item.product_name}
                          </div>
                        </td>
                        <td>
                          {item.number_of_6_packs > 0 ? (
                            <Badge bg="info">{item.number_of_6_packs}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                        <td>
                          {item.number_of_12_packs > 0 ? (
                            <Badge bg="primary">{item.number_of_12_packs}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                        <td>
                          {item.extra_items > 0 ? (
                            <Badge bg="secondary">{item.extra_items}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                        <td>
                          <Badge
                            bg={getQuantityBadgeVariant(item.total_quantity)}
                            className="fs-6"
                          >
                            {item.total_quantity}
                          </Badge>
                        </td>
                        <td>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View Product Details</Tooltip>}
                          >
                            <Link to={`/viewproductlist`}>
                              <Button variant="outline-info" size="sm" className="me-1">
                                <BsInfoCircle />
                              </Button>
                            </Link>
                          </OverlayTrigger>
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>View Packing & Sales History</Tooltip>}
                          >
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewDetails(item)}
                            >
                              <FaEye />
                            </Button>
                          </OverlayTrigger>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Product Detail Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            {selectedProduct && (
              <div className="d-flex align-items-center">
                {selectedProduct.color_code && (
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: selectedProduct.color_code,
                      borderRadius: "4px",
                      marginRight: "8px",
                      border: "1px solid #ddd"
                    }}
                  ></div>
                )}
                <span>{selectedProduct?.product_name} - Detailed History</span>
              </div>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <p>Loading product details...</p>
            </div>
          ) : modalError ? (
            <Alert variant="danger">
              <BsExclamationTriangle className="me-2" />
              {modalError}
            </Alert>
          ) : (
            <Tabs defaultActiveKey="analysis" className="mb-3">
              {/* Packing Sessions Tab */}
              <Tab eventKey="packing" title={<span><FaBoxes className="me-2" />Packing History</span>}>
                {packingSessions.length === 0 ? (
                  <Alert variant="info">No packing sessions found for this product.</Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>6-Packs</th>
                          <th>12-Packs</th>
                          <th>Extra Items</th>
                          <th>Total Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packingSessions.map((session) => (
                          <tr key={session.id}>
                            <td>
                              <BsCalendar className="me-2" />
                              {formatDate(session.date)}
                            </td>
                            <td>
                              {session.number_of_6_packs > 0 ? (
                                <Badge bg="info">{session.number_of_6_packs}</Badge>
                              ) : (
                                0
                              )}
                            </td>
                            <td>
                              {session.number_of_12_packs > 0 ? (
                                <Badge bg="primary">{session.number_of_12_packs}</Badge>
                              ) : (
                                0
                              )}
                            </td>
                            <td>
                              {session.extra_items > 0 ? (
                                <Badge bg="secondary">{session.extra_items}</Badge>
                              ) : (
                                0
                              )}
                            </td>
                            <td>
                              <Badge bg="success">{session.total_packed_quantity}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td className="fw-bold">Total</td>
                          <td className="fw-bold">
                            {packingSessions.reduce((sum, session) => sum + session.number_of_6_packs, 0)}
                          </td>
                          <td className="fw-bold">
                            {packingSessions.reduce((sum, session) => sum + session.number_of_12_packs, 0)}
                          </td>
                          <td className="fw-bold">
                            {packingSessions.reduce((sum, session) => sum + session.extra_items, 0)}
                          </td>
                          <td className="fw-bold">
                            {packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                )}
              </Tab>

              {/* Sales History Tab */}
              <Tab eventKey="sales" title={<span><FaShoppingCart className="me-2" />Sales History</span>}>
                {salesData.length === 0 || (typeof salesData === 'object' && salesData.message) ? (
                  <Alert variant="info">
                    {typeof salesData === 'object' && salesData.message
                      ? salesData.message
                      : "No sales data found for this product."}
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead className="table-light">
                        <tr>
                          <th>Order ID</th>
                          <th>Shop</th>
                          <th>Order Date</th>
                          <th>6-Packs</th>
                          <th>12-Packs</th>
                          <th>Extra Items</th>
                          <th>Total Units</th>
                          <th>Amount (LKR)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(salesData) && salesData.map((sale) => (
                          <tr key={sale.order_id + '-' + (sale.id || Math.random())}>
                            <td>#{sale.order_id}</td>
                            <td>
                              <FaStore className="me-1" />
                              {sale.shop_name}
                            </td>
                            <td>
                              <FaCalendarAlt className="me-1" />
                              {formatDate(sale.order_date)}
                            </td>
                            <td>{sale.quantity_6_packs || 0}</td>
                            <td>{sale.quantity_12_packs || 0}</td>
                            <td>{sale.quantity_extra_items || 0}</td>
                            <td className="fw-bold">{sale.total_units}</td>
                            <td>
                              <BsCurrencyDollar className="me-1" />
                              {sale.subtotal.toLocaleString()}
                            </td>
                            <td>
                              <Badge
                                bg={
                                  sale.order_status === 'delivered' || sale.order_status === 'paid'
                                    ? 'success'
                                    : sale.order_status === 'invoiced'
                                    ? 'info'
                                    : 'warning'
                                }
                              >
                                {sale.order_status?.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {Array.isArray(salesData) && salesData.length > 0 && (
                        <tfoot className="table-light">
                          <tr>
                            <td colSpan="3" className="fw-bold">Total</td>
                            <td className="fw-bold">
                              {salesData.reduce((sum, sale) => sum + (sale.quantity_6_packs || 0), 0)}
                            </td>
                            <td className="fw-bold">
                              {salesData.reduce((sum, sale) => sum + (sale.quantity_12_packs || 0), 0)}
                            </td>
                            <td className="fw-bold">
                              {salesData.reduce((sum, sale) => sum + (sale.quantity_extra_items || 0), 0)}
                            </td>
                            <td className="fw-bold">
                              {salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0)}
                            </td>
                            <td className="fw-bold" colSpan="2">
                              LKR {salesData.reduce((sum, sale) => sum + (sale.subtotal || 0), 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </Table>
                  </div>
                )}
              </Tab>

              {/* Inventory Summary Tab */}
              <Tab eventKey="summary" title={<span><FaWarehouse className="me-2" />Current Inventory</span>}>
                {selectedProduct && (
                  <div className="p-3 bg-light rounded">
                    <Row>
                      <Col md={6}>
                        <h5 className="mb-3">Inventory Summary</h5>
                        <Table bordered>
                          <tbody>
                            <tr>
                              <td className="fw-bold">6-Packs</td>
                              <td>{selectedProduct.number_of_6_packs}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">12-Packs</td>
                              <td>{selectedProduct.number_of_12_packs}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Extra Items</td>
                              <td>{selectedProduct.extra_items}</td>
                            </tr>
                            <tr className="table-primary">
                              <td className="fw-bold">Total Items</td>
                              <td className="fw-bold">{selectedProduct.total_quantity}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <h5 className="mb-3">Statistics</h5>
                        <div className="p-3 bg-white rounded shadow-sm mb-3">
                          <h6 className="text-muted">Total Packed</h6>
                          <h3 className="mb-0">
                            {packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0)} items
                          </h3>
                        </div>
                        <div className="p-3 bg-white rounded shadow-sm">
                          <h6 className="text-muted">Total Sold</h6>
                          <h3 className="mb-0">
                            {Array.isArray(salesData)
                              ? salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0)
                              : 0} items
                          </h3>
                        </div>
                      </Col>
                    </Row>
                  </div>
                )}
              </Tab>

              {/* Analysis Tab */}
              <Tab eventKey="analysis" title={<span><FaChartBar className="me-2" />Analysis</span>}>
                {selectedProduct && (
                  <div className="p-3 bg-light rounded">
                    <h4 className="mb-4 text-primary">Product Performance Analysis</h4>

                    {/* Packing Trends */}
                    <div className="mb-4">
                      <h5 className="mb-3"><FaChartLine className="me-2" />Packing Trends</h5>
                      <div className="table-responsive">
                        <Table bordered hover>
                          <thead className="table-light">
                            <tr>
                              <th>Metric</th>
                              <th>Value</th>
                              <th>Analysis</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Total Packing Sessions</td>
                              <td>{packingSessions.length}</td>
                              <td>
                                {packingSessions.length > 0
                                  ? `Last session on ${formatDate(packingSessions[0]?.date)}`
                                  : "No packing sessions recorded"}
                              </td>
                            </tr>
                            <tr>
                              <td>Average Items per Session</td>
                              <td>
                                {packingSessions.length > 0
                                  ? (packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0) / packingSessions.length).toFixed(1)
                                  : "N/A"}
                              </td>
                              <td>
                                {packingSessions.length > 0
                                  ? (packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0) / packingSessions.length) > 50
                                    ? "High efficiency packing"
                                    : "Standard packing efficiency"
                                  : "No data available"}
                              </td>
                            </tr>
                            <tr>
                              <td>Preferred Pack Type</td>
                              <td>
                                {packingSessions.length > 0
                                  ? packingSessions.reduce((sum, session) => sum + session.number_of_6_packs, 0) >
                                    packingSessions.reduce((sum, session) => sum + session.number_of_12_packs, 0)
                                    ? "6-Packs"
                                    : "12-Packs"
                                  : "N/A"}
                              </td>
                              <td>
                                {packingSessions.length > 0
                                  ? `${Math.round((packingSessions.reduce((sum, session) => sum + (session.number_of_6_packs > session.number_of_12_packs ? 1 : 0), 0) / packingSessions.length) * 100)}% of sessions favor this pack type`
                                  : "No data available"}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </div>

                    {/* Sales Analysis */}
                    <div className="mb-4">
                      <h5 className="mb-3"><FaChartPie className="me-2" />Sales Analysis</h5>
                      {Array.isArray(salesData) && salesData.length > 0 ? (
                        <div className="table-responsive">
                          <Table bordered hover>
                            <thead className="table-light">
                              <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Analysis</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>Total Orders</td>
                                <td>{salesData.length}</td>
                                <td>
                                  {salesData.length > 5
                                    ? "High demand product"
                                    : salesData.length > 0
                                    ? "Regular demand product"
                                    : "Low demand product"}
                                </td>
                              </tr>
                              <tr>
                                <td>Total Revenue</td>
                                <td>LKR {salesData.reduce((sum, sale) => sum + (sale.subtotal || 0), 0).toLocaleString()}</td>
                                <td>
                                  {salesData.reduce((sum, sale) => sum + (sale.subtotal || 0), 0) > 100000
                                    ? "High revenue generator"
                                    : "Standard revenue generator"}
                                </td>
                              </tr>
                              <tr>
                                <td>Average Order Size</td>
                                <td>
                                  {salesData.length > 0
                                    ? (salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) / salesData.length).toFixed(1) + " units"
                                    : "N/A"}
                                </td>
                                <td>
                                  {salesData.length > 0 && (salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) / salesData.length) > 20
                                    ? "Bulk order preference"
                                    : "Standard order size"}
                                </td>
                              </tr>
                              <tr>
                                <td>Top Shop</td>
                                <td>
                                  {salesData.length > 0
                                    ? (() => {
                                        const shopCounts = {};
                                        salesData.forEach(sale => {
                                          shopCounts[sale.shop_name] = (shopCounts[sale.shop_name] || 0) + 1;
                                        });
                                        const topShop = Object.entries(shopCounts).sort((a, b) => b[1] - a[1])[0];
                                        return topShop ? topShop[0] : "N/A";
                                      })()
                                    : "N/A"}
                                </td>
                                <td>
                                  {salesData.length > 0
                                    ? `${Math.round((salesData.filter(sale => sale.shop_name === (() => {
                                        const shopCounts = {};
                                        salesData.forEach(sale => {
                                          shopCounts[sale.shop_name] = (shopCounts[sale.shop_name] || 0) + 1;
                                        });
                                        const topShop = Object.entries(shopCounts).sort((a, b) => b[1] - a[1])[0];
                                        return topShop ? topShop[0] : "";
                                      })()).length / salesData.length) * 100)}% of orders from this shop`
                                    : "No data available"}
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <Alert variant="info">No sales data available for analysis.</Alert>
                      )}
                    </div>

                    {/* Inventory Efficiency */}
                    <div>
                      <h5 className="mb-3"><FaPercentage className="me-2" />Inventory Efficiency</h5>
                      <div className="table-responsive">
                        <Table bordered hover>
                          <thead className="table-light">
                            <tr>
                              <th>Metric</th>
                              <th>Value</th>
                              <th>Analysis</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Current Stock Level</td>
                              <td>{selectedProduct.total_quantity} items</td>
                              <td>
                                {selectedProduct.total_quantity > 100
                                  ? "High stock level"
                                  : selectedProduct.total_quantity > 50
                                  ? "Moderate stock level"
                                  : selectedProduct.total_quantity > 10
                                  ? "Low stock level"
                                  : "Critical stock level"}
                              </td>
                            </tr>
                            <tr>
                              <td>Stock Turnover Rate</td>
                              <td>
                                {packingSessions.length > 0 && Array.isArray(salesData) && salesData.length > 0
                                  ? `${((salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) /
                                      packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0)) * 100).toFixed(1)}%`
                                  : "N/A"}
                              </td>
                              <td>
                                {packingSessions.length > 0 && Array.isArray(salesData) && salesData.length > 0
                                  ? ((salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) /
                                      packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0)) * 100) > 80
                                    ? "Excellent turnover rate"
                                    : ((salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) /
                                        packingSessions.reduce((sum, session) => sum + session.total_packed_quantity, 0)) * 100) > 50
                                    ? "Good turnover rate"
                                    : "Low turnover rate - consider production adjustment"
                                  : "Insufficient data for analysis"}
                              </td>
                            </tr>
                            <tr>
                              <td>Restock Recommendation</td>
                              <td>
                                {selectedProduct.total_quantity < 20 && Array.isArray(salesData) && salesData.length > 0
                                  ? "Restock Recommended"
                                  : "No Restock Needed"}
                              </td>
                              <td>
                                {selectedProduct.total_quantity < 20 && Array.isArray(salesData) && salesData.length > 0
                                  ? `Based on average sales of ${salesData.length > 0
                                      ? (salesData.reduce((sum, sale) => sum + (sale.total_units || 0), 0) / salesData.length).toFixed(1)
                                      : 0} units per order`
                                  : "Current stock levels are sufficient"}
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </Tab>
            </Tabs>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Link to="/viewproductlist">
            <Button variant="primary">
              View All Products
            </Button>
          </Link>
        </Modal.Footer>
      </Modal>

      {/* PDF Generation Confirmation Modal */}
      <Modal show={showPdfModal} onHide={closePdfModal} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <FaFilePdf className="me-2 text-success" />
            Generate Packing Inventory Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {pdfLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="success" className="mb-3" />
              <p>Generating PDF report...</p>
            </div>
          ) : (
            <>
              <p>
                This will generate a PDF report containing the current packing inventory stock levels
                for all products. The report will include:
              </p>
              <ul>
                <li>Summary statistics</li>
                <li>Detailed inventory for each product</li>
                <li>Current stock levels (6-packs, 12-packs, extra items)</li>
              </ul>
              <p>Do you want to continue?</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closePdfModal} disabled={pdfLoading}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={generatePDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Generating...
              </>
            ) : (
              <>
                <FaDownload className="me-1" />
                Generate PDF
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewPackingInventory;
