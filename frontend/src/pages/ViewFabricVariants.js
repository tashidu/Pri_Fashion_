import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { getUserRole, hasRole } from '../utils/auth';
import {
  Container, Row, Col, Card, Table, Button,
  Badge, Alert, Spinner, ListGroup, ProgressBar, Modal,
  Form
} from 'react-bootstrap';
import {
  FaTshirt, FaArrowLeft, FaPalette,
  FaRulerHorizontal, FaMoneyBillWave, FaUserTie,
  FaCalendarAlt, FaInfoCircle, FaTrash, FaEdit,
  FaFilePdf, FaFileDownload, FaTable
} from 'react-icons/fa';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const ViewFabricVariants = () => {
  const { id } = useParams(); // FabricDefinition ID from URL
  const [fabricDetail, setFabricDetail] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isInventoryManager, setIsInventoryManager] = useState(hasRole('Inventory Manager'));
  const navigate = useNavigate();

  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasDependencies, setHasDependencies] = useState(false);

  // PDF export states
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showAdditionPdfModal, setShowAdditionPdfModal] = useState(false);
  const [additionPdfLoading, setAdditionPdfLoading] = useState(false);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8000/api/fabric-definitions/${id}/`)
      .then((response) => {
        setFabricDetail(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching fabric definition:", error);
        setMessage("Error loading fabric details.");
        setLoading(false);
      });
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total inventory value
  const calculateTotalValue = () => {
    if (!fabricDetail || !fabricDetail.variants) return 0;
    return fabricDetail.variants.reduce((total, variant) => {
      return total + (variant.total_yard * variant.price_per_yard);
    }, 0).toFixed(2);
  };

  // Calculate current inventory value (based on available yards)
  const calculateCurrentValue = () => {
    if (!fabricDetail || !fabricDetail.variants) return 0;
    return fabricDetail.variants.reduce((total, variant) => {
      return total + (variant.available_yard * variant.price_per_yard);
    }, 0).toFixed(2);
  };

  // Calculate total yards
  const calculateTotalYards = () => {
    if (!fabricDetail || !fabricDetail.variants) return 0;
    return fabricDetail.variants.reduce((total, variant) => {
      return total + parseFloat(variant.total_yard);
    }, 0).toFixed(2);
  };

  // Check if variant has any cutting records associated with it
  const checkVariantDependencies = async (variantId) => {
    try {
      // Direct check for cutting records that use this fabric variant
      // This is more reliable than using the history endpoint
      const response = await axios.get(`http://localhost:8000/api/cutting/cutting-records/`);
      console.log("All cutting records:", response.data);

      // Check if any cutting record details reference this variant
      let hasReferences = false;

      for (const record of response.data) {
        if (record.details && record.details.length > 0) {
          // Check if any detail uses this variant
          const usesVariant = record.details.some(detail => detail.fabric_variant === variantId);

          if (usesVariant) {
            console.log(`Variant ${variantId} is used in cutting record ${record.id}`);
            hasReferences = true;
            break;
          }
        }
      }

      if (hasReferences) {
        return true;
      }

      // Fallback to the history endpoint if needed
      try {
        const historyResponse = await axios.get(`http://localhost:8000/api/cutting/fabric-variant/${variantId}/history/`);
        console.log("Variant dependency check response:", historyResponse.data);

        // If there are cutting records in the history, the variant has dependencies
        if (historyResponse.data &&
            historyResponse.data.cutting_history &&
            historyResponse.data.cutting_history.length > 0) {
          console.log(`Variant ${variantId} has ${historyResponse.data.cutting_history.length} cutting records`);
          return true;
        }
      } catch (historyError) {
        console.error("Error checking variant history:", historyError);
        // Continue with the main function even if history check fails
      }

      // No cutting records found - variant can be safely deleted
      console.log(`Variant ${variantId} has no cutting records`);
      return false;
    } catch (error) {
      console.error("Error checking variant dependencies:", error);

      // If it's a 404 error, it means the endpoint doesn't exist or the variant doesn't exist
      // In this case, we can assume there are no dependencies
      if (error.response && error.response.status === 404) {
        console.log(`Variant ${variantId} not found or endpoint not available`);
        return false;
      }

      // For other errors, log more details to help with debugging
      console.error("Error details:", error.response ? error.response.data : "No response data");

      // If there's an error, assume there might be dependencies to prevent accidental deletion
      return true;
    }
  };

  // Handle delete button click
  const handleDeleteClick = async (variant) => {
    setVariantToDelete(variant);
    setIsDeleting(false);
    setHasDependencies(false); // Default to no dependencies

    try {
      // Check if this is the last variant
      if (fabricDetail.variants.length <= 1) {
        setError("Cannot delete the last variant of a fabric. Please delete the entire fabric definition instead.");
        return;
      }

      // Check for dependencies
      const hasDeps = await checkVariantDependencies(variant.id);
      setHasDependencies(hasDeps);

      // Show the confirmation modal
      setShowDeleteModal(true);
    } catch (error) {
      console.error("Error in handleDeleteClick:", error);
      setError("An error occurred while checking if this variant can be deleted. Please try again.");
    }
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (hasDependencies) {
      return; // Don't allow deletion if there are dependencies
    }

    setIsDeleting(true);

    try {
      console.log(`Attempting to delete variant with ID: ${variantToDelete.id}`);

      // Double-check if this is the last variant
      if (fabricDetail.variants.length <= 1) {
        setError("Cannot delete the last variant of a fabric. Please delete the entire fabric definition instead.");
        setIsDeleting(false);
        return;
      }

      // Force a direct delete without checking dependencies again
      try {
        const response = await axios.delete(`http://localhost:8000/api/fabric-variants/${variantToDelete.id}/`);
        console.log("Delete response:", response);

        // Update the fabric detail by removing the deleted variant
        const updatedVariants = fabricDetail.variants.filter(v => v.id !== variantToDelete.id);
        setFabricDetail({
          ...fabricDetail,
          variants: updatedVariants
        });

        // Close the modal and show success message
        setShowDeleteModal(false);
        setSuccess(`Fabric variant "${variantToDelete.color_name || variantToDelete.color}" deleted successfully!`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } catch (deleteError) {
        console.error("Error in direct delete attempt:", deleteError);

        // If the direct delete fails, try a workaround for variants with no cutting records
        if (deleteError.response && (deleteError.response.status === 400 || deleteError.response.status === 500)) {
          console.log("Attempting alternative delete method...");

          try {
            // Update the variant with minimal data before deleting
            await axios.put(`http://localhost:8000/api/fabric-variants/${variantToDelete.id}/`, {
              fabric_definition: variantToDelete.fabric_definition,
              color: variantToDelete.color,
              color_name: variantToDelete.color_name || variantToDelete.color,
              total_yard: 0,
              available_yard: 0,
              price_per_yard: 0
            });

            // Try deleting again
            await axios.delete(`http://localhost:8000/api/fabric-variants/${variantToDelete.id}/`);

            // Update the fabric detail by removing the deleted variant
            const updatedVariants = fabricDetail.variants.filter(v => v.id !== variantToDelete.id);
            setFabricDetail({
              ...fabricDetail,
              variants: updatedVariants
            });

            // Close the modal and show success message
            setShowDeleteModal(false);
            setSuccess(`Fabric variant "${variantToDelete.color_name || variantToDelete.color}" deleted successfully!`);

            // Clear success message after 3 seconds
            setTimeout(() => {
              setSuccess("");
            }, 3000);
          } catch (alternativeError) {
            console.error("Alternative delete method failed:", alternativeError);
            throw alternativeError; // Re-throw to be caught by the outer catch block
          }
        } else {
          throw deleteError; // Re-throw to be caught by the outer catch block
        }
      }
    } catch (error) {
      console.error("Error deleting fabric variant:", error);

      // Log detailed error information
      console.error("Error details:", error.response ? error.response.data : "No response data");
      console.error("Error status:", error.response ? error.response.status : "No status");

      // Provide more specific error messages based on the error
      let errorMessage = "Failed to delete fabric variant. Please try again.";

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.detail || "Bad request. The variant may be referenced by other records.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to delete this variant.";
        } else if (error.response.status === 404) {
          errorMessage = "Variant not found. It may have been already deleted.";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please contact the administrator.";
        }
      }

      setError(error.response?.data?.message || errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Close the delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setVariantToDelete(null);
    setHasDependencies(false);
  };

  // Open Real-time Inventory PDF export modal
  const openPdfModal = () => {
    setShowPdfModal(true);
  };

  // Open Fabric Addition Report PDF modal
  const openAdditionPdfModal = () => {
    setShowAdditionPdfModal(true);
  };

  // Generate and download Real-time Inventory PDF file
  const generatePDF = () => {
    setPdfLoading(true);

    if (!fabricDetail || !fabricDetail.variants) {
      setError("No fabric data available to export");
      setPdfLoading(false);
      return;
    }

    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font sizes and styles
      const titleFontSize = 18;
      const headingFontSize = 14;
      const normalFontSize = 10;
      const smallFontSize = 8;

      // Add logo
      try {
        // Get the base URL for the current environment
        const baseUrl = window.location.origin;

        // Add the logo to the PDF
        doc.addImage(`${baseUrl}/logo.png`, 'PNG', 14, 10, 20, 20);
      } catch (logoError) {
        console.warn("Could not add logo to PDF:", logoError);

        // Fallback to a simple placeholder if the logo can't be loaded
        doc.setFillColor(41, 128, 185); // Primary blue color
        doc.rect(14, 10, 20, 20, 'F');

        // Add "PF" text as a simple logo
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("PF", 24, 22, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset text color to black
      }

      // Add title
      doc.setFontSize(titleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Real-time Fabric Inventory Report', 105, 20, { align: 'center' });

      // Add fabric information section
      doc.setFontSize(headingFontSize);
      doc.text('Fabric Information', 20, 35);

      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');

      // Add fabric details
      const fabricInfo = [
        ['Fabric Name', fabricDetail.fabric_name || 'N/A'],
        ['Supplier', fabricDetail.supplier_name || 'N/A'],
        ['Date Added', formatDate(fabricDetail.date_added) || 'N/A'],
        ['Total Variants', fabricDetail.variants.length.toString()],
        ['Total Yards', calculateTotalYards().toString()],
        ['Available Yards', fabricDetail.variants.reduce((total, variant) => total + parseFloat(variant.available_yard), 0).toFixed(2)],
        ['Total Value (All)', `Rs. ${calculateTotalValue()}`],
        ['Current Value', `Rs. ${calculateCurrentValue()}`]
      ];

      // Add fabric info table
      autoTable(doc, {
        startY: 40,
        head: [['Property', 'Value']],
        body: fabricInfo,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10 }
      });

      // Add variants section
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Color Variants', 20, doc.lastAutoTable.finalY + 15);

      // Prepare data for variants table
      const variantsData = fabricDetail.variants.map(variant => {
        // Calculate current value based on available yard * price per yard
        const currentValue = (variant.available_yard * variant.price_per_yard).toFixed(2);
        return [
          variant.color_name || variant.color || 'N/A',
          '', // Empty cell for color display
          variant.color || 'N/A', // Color code in separate column
          variant.total_yard.toString(),
          variant.available_yard.toString(),
          `Rs. ${variant.price_per_yard}`,
          `Rs. ${currentValue}`
        ];
      });

      // No need to define dimensions here as we'll use the cell dimensions

      // Add variants table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Color Name', 'Color', 'Color Code', 'Total Yard', 'Available Yard', 'Price/Yard', 'Current Value']],
        body: variantsData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          1: { cellWidth: 30 }, // Wider column for color swatch
          2: { cellWidth: 30 }  // Wider column for color code
        },
        didDrawCell: (data) => {
          // Add color box in the color display column (index 1)
          if (data.section === 'body' && data.column.index === 1) {
            const rowIndex = data.row.index;
            const colorCode = variantsData[rowIndex][2]; // Get color code from the next column

            // Only draw if it's a valid color code
            if (colorCode && colorCode !== 'N/A') {
              const { x, y, width, height } = data.cell;

              // Create a color swatch that fits within the cell with some padding
              const padding = 2;
              const swatchX = x + padding;
              const swatchY = y + padding;
              const swatchWidth = width - (padding * 2);
              const swatchHeight = height - (padding * 2);

              // Draw the color swatch
              doc.setFillColor(colorCode);
              doc.rect(swatchX, swatchY, swatchWidth, swatchHeight, 'F');

              // Add border around the color box
              doc.setDrawColor(100, 100, 100); // Darker border for better visibility
              doc.rect(swatchX, swatchY, swatchWidth, swatchHeight, 'S');
            }
          }
        }
      });

      // Add footer
      doc.setFontSize(smallFontSize);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      doc.text('Pri Fashion Garment Management System', 105, 285, { align: 'center' });

      // Save the PDF
      const cleanFabricName = fabricDetail.fabric_name.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Fabric_Inventory_${cleanFabricName}_${new Date().toISOString().slice(0, 10)}.pdf`);

      setPdfLoading(false);
      setShowPdfModal(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to generate PDF: ${error.message}`);
      setPdfLoading(false);
    }
  };

  // Generate and download Fabric Addition Report PDF
  const generateAdditionPDF = () => {
    setAdditionPdfLoading(true);

    if (!fabricDetail || !fabricDetail.variants) {
      setError("No fabric data available to export");
      setAdditionPdfLoading(false);
      return;
    }

    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font sizes and styles
      const titleFontSize = 18;
      const headingFontSize = 14;
      const normalFontSize = 10;
      const smallFontSize = 8;

      // Add logo
      try {
        // Get the base URL for the current environment
        const baseUrl = window.location.origin;

        // Add the logo to the PDF
        doc.addImage(`${baseUrl}/logo.png`, 'PNG', 14, 10, 20, 20);
      } catch (logoError) {
        console.warn("Could not add logo to PDF:", logoError);

        // Fallback to a simple placeholder if the logo can't be loaded
        doc.setFillColor(41, 128, 185); // Primary blue color
        doc.rect(14, 10, 20, 20, 'F');

        // Add "PF" text as a simple logo
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("PF", 24, 22, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset text color to black
      }

      // Add title
      doc.setFontSize(titleFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Fabric Addition Report', 105, 20, { align: 'center' });

      // Add fabric information section
      doc.setFontSize(headingFontSize);
      doc.text('Fabric Information', 20, 35);

      doc.setFontSize(normalFontSize);
      doc.setFont('helvetica', 'normal');

      // Add fabric details
      const fabricInfo = [
        ['Fabric Name', fabricDetail.fabric_name || 'N/A'],
        ['Supplier', fabricDetail.supplier_name || 'N/A'],
        ['Date Added', formatDate(fabricDetail.date_added) || 'N/A'],
        ['Total Variants', fabricDetail.variants.length.toString()]
      ];

      // Add fabric info table
      autoTable(doc, {
        startY: 40,
        head: [['Property', 'Value']],
        body: fabricInfo,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10 }
      });

      // Add variants section
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Added Fabric Variants', 20, doc.lastAutoTable.finalY + 15);

      // Prepare data for variants table
      const variantsData = fabricDetail.variants.map(variant => {
        return [
          variant.color_name || variant.color || 'N/A',
          '', // Empty cell for color display
          variant.color || 'N/A', // Color code in separate column
          variant.total_yard.toString(),
          `Rs. ${variant.price_per_yard}`,
          `Rs. ${(variant.total_yard * variant.price_per_yard).toFixed(2)}`
        ];
      });

      // No need to define dimensions here as we'll use the cell dimensions

      // Add variants table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Color Name', 'Color', 'Color Code', 'Added Yard', 'Price/Yard', 'Total Value']],
        body: variantsData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          1: { cellWidth: 30 }, // Wider column for color swatch
          2: { cellWidth: 30 }  // Wider column for color code
        },
        didDrawCell: (data) => {
          // Add color box in the color display column (index 1)
          if (data.section === 'body' && data.column.index === 1) {
            const rowIndex = data.row.index;
            const colorCode = variantsData[rowIndex][2]; // Get color code from the next column

            // Only draw if it's a valid color code
            if (colorCode && colorCode !== 'N/A') {
              const { x, y, width, height } = data.cell;

              // Create a color swatch that fits within the cell with some padding
              const padding = 2;
              const swatchX = x + padding;
              const swatchY = y + padding;
              const swatchWidth = width - (padding * 2);
              const swatchHeight = height - (padding * 2);

              // Draw the color swatch
              doc.setFillColor(colorCode);
              doc.rect(swatchX, swatchY, swatchWidth, swatchHeight, 'F');

              // Add border around the color box
              doc.setDrawColor(100, 100, 100); // Darker border for better visibility
              doc.rect(swatchX, swatchY, swatchWidth, swatchHeight, 'S');
            }
          }
        }
      });

      // Add summary section
      doc.setFontSize(headingFontSize);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, doc.lastAutoTable.finalY + 15);

      // Calculate totals
      const totalYards = calculateTotalYards();
      const totalValue = calculateTotalValue();

      // Add summary table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Total Yards Added', 'Total Value']],
        body: [[totalYards, `Rs. ${totalValue}`]],
        theme: 'grid',
        styles: { fontSize: 10, halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
      });

      // Add footer
      doc.setFontSize(smallFontSize);
      doc.setFont('helvetica', 'italic');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
      doc.text('Pri Fashion Garment Management System', 105, 285, { align: 'center' });

      // Save the PDF
      const cleanFabricName = fabricDetail.fabric_name.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Fabric_Addition_${cleanFabricName}_${new Date().toISOString().slice(0, 10)}.pdf`);

      setAdditionPdfLoading(false);
      setShowAdditionPdfModal(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to generate PDF: ${error.message}`);
      setAdditionPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <RoleBasedNavBar />
        <Container fluid
          style={{
            marginLeft: isSidebarOpen ? "240px" : "70px",
            width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
            transition: "all 0.3s ease",
            padding: "20px"
          }}
        >
          <div className="text-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading fabric details...</p>
          </div>
        </Container>
      </>
    );
  }

  if (!fabricDetail) {
    return (
      <>
        <RoleBasedNavBar />
        <Container fluid
          style={{
            marginLeft: isSidebarOpen ? "240px" : "70px",
            width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
            transition: "all 0.3s ease",
            padding: "20px"
          }}
        >
          <Alert variant="danger" className="text-center">
            {message || "Error loading fabric details."}
          </Alert>
          <div className="text-center mt-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <FaArrowLeft className="me-2" /> Back to Fabrics
            </Button>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <RoleBasedNavBar />
      <Container fluid
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(-1)}
            className="me-2"
          >
            <FaArrowLeft className="me-2" /> Back
          </Button>
          <h2 className="mb-0 text-center flex-grow-1">
            <FaTshirt className="me-2 text-primary" />
            {fabricDetail.fabric_name}
          </h2>
          <div>
            <Button
              variant="outline-primary"
              onClick={openPdfModal}
              className="me-2"
            >
              <FaFilePdf className="me-2" /> Real-time Inventory
            </Button>
            <Button
              variant="outline-success"
              onClick={openAdditionPdfModal}
              className="me-2"
            >
              <FaFilePdf className="me-2" /> Fabric Addition
            </Button>
          </div>
        </div>

        {message && <Alert variant="danger" className="text-center">{message}</Alert>}
        {error && <Alert variant="danger" className="text-center">{error}</Alert>}
        {success && <Alert variant="success" className="text-center">{success}</Alert>}

        <Row className="mb-4">
          <Col lg={4} md={12}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FaInfoCircle className="me-2" />
                  Fabric Information
                </h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaUserTie className="me-2 text-secondary" />
                      Supplier
                    </div>
                    <Badge bg="info" pill>{fabricDetail.supplier_name}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaCalendarAlt className="me-2 text-secondary" />
                      Date Added
                    </div>
                    <span>{formatDate(fabricDetail.date_added)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaPalette className="me-2 text-secondary" />
                      Color Variants
                    </div>
                    <Badge bg="primary" pill>{fabricDetail.variants.length}</Badge>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaRulerHorizontal className="me-2 text-secondary" />
                      Total Yards
                    </div>
                    <span>{calculateTotalYards()} yards</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaRulerHorizontal className="me-2 text-secondary" />
                      Available Yards
                    </div>
                    <span>{fabricDetail.variants.reduce((total, variant) => total + parseFloat(variant.available_yard), 0).toFixed(2)} yards</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaMoneyBillWave className="me-2 text-secondary" />
                      Total Value (All)
                    </div>
                    <span className="text-success fw-bold">Rs. {calculateTotalValue()}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaMoneyBillWave className="me-2 text-secondary" />
                      Current Value
                    </div>
                    <span className="text-success fw-bold">Rs. {calculateCurrentValue()}</span>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FaPalette className="me-2" />
                  Color Variants
                </h5>
              </Card.Header>
              <Card.Body>
                <Table hover bordered responsive className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '15%' }}>Color</th>
                      <th style={{ width: '30%' }} className="text-center">Yard Information</th>
                      <th style={{ width: '20%' }} className="text-center">Price per Yard</th>
                      <th style={{ width: '20%' }} className="text-center">Current Value</th>
                      {isInventoryManager && (
                        <th style={{ width: '15%' }} className="text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {fabricDetail.variants.map((variant) => (
                      <tr key={variant.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: variant.color,
                                borderRadius: '4px',
                                border: '1px solid #dee2e6',
                                marginRight: '10px'
                              }}
                            />
                            <span>{variant.color}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="mb-1">
                            <strong>Total:</strong> {variant.total_yard} yards
                          </div>
                          <div className="mb-2">
                            <strong>Current Stock:</strong>{' '}
                            <span className={variant.available_yard < 10 ? 'text-danger fw-bold' : ''}>
                              {variant.available_yard !== null ? `${variant.available_yard} yards` : 'N/A'}
                            </span>
                            {variant.available_yard !== null && variant.total_yard > 0 && (
                              <div className="mt-1">
                                <ProgressBar
                                  now={Math.min(100, (variant.available_yard / variant.total_yard) * 100)}
                                  variant={
                                    variant.available_yard < 0.1 * variant.total_yard ? 'danger' :
                                    variant.available_yard < 0.3 * variant.total_yard ? 'warning' : 'success'
                                  }
                                  style={{ height: '8px' }}
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => navigate(`/fabric-inventory/${variant.id}`)}
                            >
                              View Inventory
                            </Button>
                          </div>
                        </td>
                        <td className="text-center">Rs. {variant.price_per_yard}/yard</td>
                        <td className="text-center fw-bold">
                          Rs. {(variant.available_yard * variant.price_per_yard).toFixed(2)}
                        </td>
                        {isInventoryManager && (
                          <td className="text-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteClick(variant)}
                              disabled={fabricDetail.variants.length <= 1}
                              title={fabricDetail.variants.length <= 1 ? "Cannot delete the last variant" : "Delete variant"}
                            >
                              <FaTrash className="me-1" /> Delete
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-light">
                    <tr>
                      <td colSpan="2" className="text-end fw-bold">Total:</td>
                      <td className="text-center">{fabricDetail.variants.length} variants</td>
                      <td className="text-center fw-bold text-success" colSpan={isInventoryManager ? 2 : 1}>
                        Rs. {calculateCurrentValue()}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {variantToDelete && (
            <>
              <p>Are you sure you want to delete this fabric variant?</p>
              <Table bordered size="sm" className="mt-3">
                <tbody>
                  <tr>
                    <td><strong>Color:</strong></td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: variantToDelete.color,
                            borderRadius: '4px',
                            border: '1px solid #dee2e6',
                            marginRight: '10px'
                          }}
                        />
                        {variantToDelete.color_name || variantToDelete.color}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Total Yard:</strong></td>
                    <td>{variantToDelete.total_yard} yards</td>
                  </tr>
                  <tr>
                    <td><strong>Available Yard:</strong></td>
                    <td>{variantToDelete.available_yard} yards</td>
                  </tr>
                  <tr>
                    <td><strong>Price per Yard:</strong></td>
                    <td>Rs. {variantToDelete.price_per_yard}/yard</td>
                  </tr>
                </tbody>
              </Table>

              {hasDependencies && (
                <Alert variant="warning" className="mt-3">
                  <strong>Warning:</strong> This fabric variant cannot be deleted because it is being used in cutting records.
                  <div className="mt-2">
                    <small>
                      To delete this variant, you must first delete all cutting records that use it. You can view these records by clicking "View Inventory" and checking the cutting history.
                    </small>
                  </div>
                </Alert>
              )}

              {!hasDependencies && fabricDetail && fabricDetail.variants && fabricDetail.variants.length > 1 && (
                <Alert variant="success" className="mt-3">
                  <strong>Good news!</strong> This fabric variant has no cutting records and can be safely deleted.
                </Alert>
              )}

              {fabricDetail && fabricDetail.variants && fabricDetail.variants.length <= 1 && (
                <Alert variant="warning" className="mt-3">
                  <strong>Warning:</strong> Cannot delete the last variant of a fabric. If you want to remove this fabric completely, please delete the entire fabric definition from the fabric list.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={isDeleting || hasDependencies || (fabricDetail && fabricDetail.variants && fabricDetail.variants.length <= 1)}
          >
            {isDeleting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Deleting...
              </>
            ) : (
              'Delete Variant'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PDF Export Modal */}
      <Modal show={showPdfModal} onHide={() => setShowPdfModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFilePdf className="me-2 text-primary" />
            Export Fabric Variants to PDF
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            This will generate a PDF report containing all color variants of {fabricDetail?.fabric_name}.
            The PDF will include fabric name, color, total yard, available yard, price per yard, and total value.
          </p>

          <Alert variant="info">
            <FaTable className="me-2" />
            <strong>Note:</strong> The PDF report will include all color variants for this fabric with their respective inventory details and color swatches.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPdfModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={generatePDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Generating PDF...
              </>
            ) : (
              <>
                <FaFileDownload className="me-1" /> Download PDF
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Fabric Addition Report Modal */}
      <Modal show={showAdditionPdfModal} onHide={() => setShowAdditionPdfModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFilePdf className="me-2 text-success" />
            Fabric Addition Report
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-3">
            This will generate a PDF report showing the initial fabric addition details for {fabricDetail?.fabric_name}.
            The report will include fabric name, supplier, date added, and details of all color variants that were added.
          </p>

          <Alert variant="info">
            <FaTable className="me-2" />
            <strong>Note:</strong> This report focuses on the initial fabric addition data rather than current inventory levels.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdditionPdfModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={generateAdditionPDF}
            disabled={additionPdfLoading}
          >
            {additionPdfLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Generating PDF...
              </>
            ) : (
              <>
                <FaFileDownload className="me-1" /> Download Report
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ViewFabricVariants;
