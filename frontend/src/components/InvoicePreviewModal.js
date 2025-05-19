import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
import { jsPDF } from "jspdf";
import { autoTable } from 'jspdf-autotable';
import { FaDownload, FaPrint, FaEye } from "react-icons/fa";

const InvoicePreviewModal = ({ show, onHide, order, onSuccess, onError }) => {
  const [loading, setLoading] = useState(true);
  const [pdfDataUrl, setPdfDataUrl] = useState(null);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show && order) {
      generatePdfPreview();
    }
  }, [show, order]);

  const generatePdfPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!order || !order.items) {
        throw new Error("Cannot generate invoice: Order data is missing.");
      }

      if (!order.items.length) {
        throw new Error("Cannot generate invoice: No order items found.");
      }

      if (!order.invoice_number) {
        throw new Error("Cannot generate invoice: Invoice number is missing.");
      }

      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add the logo to the PDF
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

      // Convert the PDF to a data URL for preview
      const dataUrl = doc.output('datauristring');
      setPdfDataUrl(dataUrl);
      setLoading(false);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setError(error.message || "Failed to generate PDF preview");
      setLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      // Create a new jsPDF instance for download
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add the logo to the PDF
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

      // Save the PDF
      doc.save(`Invoice-${order.invoice_number}.pdf`);

      // Call the success callback
      if (onSuccess) {
        onSuccess("Invoice downloaded successfully!");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      if (onError) {
        onError(`Failed to download invoice: ${error.message || "Unknown error"}`);
      }
    }
  };

  const handlePrint = () => {
    try {
      // Create a new jsPDF instance for printing
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add the logo to the PDF
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

      // Open PDF in a new window for printing
      const pdfOutput = doc.output('bloburl');
      window.open(pdfOutput, '_blank');

      // Call the success callback
      if (onSuccess) {
        onSuccess("Invoice opened for printing!");
      }
    } catch (error) {
      console.error("Error printing PDF:", error);
      if (onError) {
        onError(`Failed to print invoice: ${error.message || "Unknown error"}`);
      }
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
      className="invoice-preview-modal"
    >
      <Modal.Header className="bg-light">
        <Modal.Title>
          <i className="fa fa-file-invoice me-2"></i>
          Invoice Preview - #{order?.invoice_number}
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={onHide}
          aria-label="Close"
        ></button>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Generating invoice preview...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <Alert.Heading>Error Generating Preview</Alert.Heading>
            <p>{error}</p>
          </Alert>
        ) : (
          <div className="pdf-preview-container">
            <div className="ratio ratio-1x1">
              <iframe
                src={pdfDataUrl}
                title="Invoice Preview"
                className="pdf-preview"
                style={{ width: '100%', height: '600px', border: '1px solid #dee2e6' }}
              />
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="info"
          onClick={handlePrint}
          disabled={loading || error}
          className="d-flex align-items-center"
        >
          <FaPrint className="me-2" /> Print
        </Button>
        <Button
          variant="primary"
          onClick={handleDownload}
          disabled={loading || error}
          className="d-flex align-items-center"
        >
          <FaDownload className="me-2" /> Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InvoicePreviewModal;
