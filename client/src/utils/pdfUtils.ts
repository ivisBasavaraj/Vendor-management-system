import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Utility functions for PDF generation
 */

/**
 * Convert image URL to base64
 * @param url Image URL
 * @returns Promise<string> Base64 string
 */
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        console.log(`Image loaded: ${url} (${img.width}x${img.height}px)`);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        console.log(`Image converted to base64, size: ${Math.round(dataURL.length / 1024)}KB`);
        resolve(dataURL);
      } catch (error) {
        console.error('Error converting image to base64:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error(`Failed to load image: ${url}`, error);
      reject(`Could not load image: ${url}`);
    };
    
    console.log(`Loading image: ${url}`);
    img.src = url;
  });
};

/**
 * Load and cache logos
 */
let cachedLogos: { varuni?: string } = {};

/**
 * Clear logo cache to force reload
 */
const clearLogoCache = (): void => {
  cachedLogos = {};
  console.log('Logo cache cleared');
};

/**
 * Preload logos for faster PDF generation
 */
const preloadLogos = async (): Promise<void> => {
  try {
    console.log('Starting logo preload...');
    const promises = [];
    
    if (!cachedLogos.varuni) {
      console.log('Loading Varuni logo from local file...');
      promises.push(
        imageToBase64('/images/Varuni.jpg')
          .then(base64 => {
            cachedLogos.varuni = base64;
            console.log('Varuni logo preloaded successfully from local file');
          })
          .catch(error => console.warn('Could not preload Varuni logo from local file:', error))
      );
    } else {
      console.log('Varuni logo already cached');
    }
    
    await Promise.all(promises);
    console.log('Logo preload completed. Cache status:', {
      varuni: !!cachedLogos.varuni
    });
  } catch (error) {
    console.warn('Error preloading logos:', error);
  }
};

interface DocumentData {
  title: string;
  documentType: string;
  submissionDate: string;
  status: string;
  remarks?: string;
}

interface VendorData {
  name: string;
  company: string;
  email: string;
  address?: string;
}

/**
 * Generate a professional 2-page compliance verification report PDF
 * 
 * @param vendorData - Vendor information
 * @param submissionData - Submission data (for backward compatibility)
 * @param complianceMetrics - Compliance metrics (for backward compatibility)
 * @param title - Report title (optional)
 * @returns The generated PDF document
 */
const generateComplianceVerificationReport = async (
  vendorData: VendorData,
  submissionData: any,
  complianceMetrics?: any,
  title?: string
): Promise<jsPDF> => {
  // Create new PDF document with A4 size
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  try {
    // Load logo if not cached
    if (!cachedLogos.varuni) {
      try {
        console.log('Loading Varuni logo from local file...');
        cachedLogos.varuni = await imageToBase64('/images/Varuni.jpg');
        console.log('Varuni logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load Varuni logo from local file:', error);
      }
    }
    
    // Page margins and dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    const footerY = pageHeight - 15;
    
    // Helper function to add header to each page
    const addPageHeader = () => {
      // Add Varuni logo (Top left corner, bigger size)
      if (cachedLogos.varuni) {
        const logoWidth = 60;
        const logoHeight = 30;
        const logoX = 10; // Top left corner
        pdf.addImage(cachedLogos.varuni, 'JPEG', logoX, 5, logoWidth, logoHeight);
      } else {
        pdf.setFillColor(70, 130, 180);
        pdf.rect(10, 5, 60, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text('VARUNI', 40, 22, { align: 'center' });
      }
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
    };
    
    // Helper function to add footer to each page
    const addPageFooter = (reportDate: string, reportTime: string, pageNumber: number, totalPages: number) => {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('This is a computer-generated compliance verification report.', pageWidth / 2, footerY, { align: 'center' });
      pdf.text(`Generated on ${reportDate} at ${reportTime}`, pageWidth / 2, footerY + 3, { align: 'center' });
      
      // Add page number to footer (right side)
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY + 3, { align: 'right' });
      
      pdf.setTextColor(0, 0, 0);
    };
    
    // Generate report data
    const reportDate = format(new Date(), 'dd MMMM yyyy');
    const reportTime = format(new Date(), 'HH:mm:ss');
    const reportId = `VCR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Handle both new format (complianceData) and old format (submissionData + complianceMetrics)
    const workLocation = submissionData.workLocation || submissionData.locationOfWork || 'Not specified';
    const agreementPeriod = submissionData.agreementPeriod || 'Not specified';
    const month = submissionData.uploadPeriod?.month || submissionData.month || 'July';
    const year = submissionData.uploadPeriod?.year || submissionData.year || 2025;
    const auditReview = complianceMetrics?.auditReview || submissionData.auditReview || 'All submitted documents have been reviewed and verified for compliance with regulatory requirements and industry standards.';
    const remarks = complianceMetrics?.remarks || submissionData.remarks || 'All documents are compliant with regulatory requirements.';
    const auditorName = complianceMetrics?.auditorName || submissionData.auditorName || 'System Consultant';
    
    // Enhanced document checklist
    const defaultDocuments = [
      { slNo: 1, particulars: 'Form T - Combined Muster Roll Cum Register of Wages', status: 'VERIFIED', remarks: 'Compliant with Labour Laws' },
      { slNo: 2, particulars: 'Bank Statement - Salary Account', status: 'VERIFIED', remarks: 'All transactions verified' },
      { slNo: 3, particulars: 'Electronic Challan Cum Return (ECR) - Previous Month', status: 'VERIFIED', remarks: 'EPF compliance confirmed' },
      { slNo: 4, particulars: 'Combined Challan A/C NO. 01, 02, 10, 21 & 22 (EPFO)', status: 'VERIFIED', remarks: 'Payment records verified' },
      { slNo: 5, particulars: 'Provident Fund TRRN Details', status: 'VERIFIED', remarks: 'Reference numbers validated' },
      { slNo: 6, particulars: 'ESIC Contribution History Statements', status: 'VERIFIED', remarks: 'Medical insurance compliance' },
      { slNo: 7, particulars: 'ESIC Challan - Monthly Contribution', status: 'VERIFIED', remarks: 'Payment confirmation received' },
      { slNo: 8, particulars: 'Professional Tax Returns Form 5A', status: 'VERIFIED', remarks: 'State tax compliance verified' },
      { slNo: 9, particulars: 'Labour License & Registration Certificates', status: 'VERIFIED', remarks: 'Valid licenses confirmed' },
      { slNo: 10, particulars: 'Safety & Compliance Certificates', status: 'VERIFIED', remarks: 'Workplace safety standards met' }
    ];
    
    // Handle document data from submission
    let documentsToShow = defaultDocuments;
    if (submissionData.documents && submissionData.documents.length > 0) {
      documentsToShow = submissionData.documents.map((doc: any, index: number) => {
        // Use individual document remarks - check multiple possible fields
        const documentRemarks = doc.consultantRemarks || 
                               doc.reviewNotes || 
                               doc.remarks || 
                               doc.consultantNotes || 
                               doc.approvalRemarks ||
                               doc.rejectionRemarks ||
                               doc.statusRemarks ||
                               'No specific remarks provided';
        
        return {
          slNo: index + 1,
          particulars: doc.documentType || doc.documentName || doc.title || 'Unknown Document',
          status: doc.status ? doc.status.toUpperCase() : 'PENDING',
          remarks: documentRemarks
        };
      });
    } else {
      // For default documents, use the global compliance remarks as fallback
      const globalComplianceRemarks = complianceMetrics?.remarks || 'All documents are compliant with regulatory requirements.';
      documentsToShow = defaultDocuments.map(doc => ({
        ...doc,
        remarks: globalComplianceRemarks
      }));
    }
    
    const totalPages = 2;
    
    // ==================== PAGE 1: COMPLIANCE VERIFICATION REPORT ====================
    addPageHeader();
    
    let currentY = 35;
    
    // Main Title Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const mainTitle = title || 'COMPLIANCE VERIFICATION REPORT';
    pdf.text(mainTitle, pageWidth / 2, currentY, { align: 'center' });
    
    // Add decorative line under title
    currentY += 5;
    pdf.setLineWidth(0.8);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 10;
    
    // Report info line
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${reportDate} | Period: ${month} ${year}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    
    // Vendor Information Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VENDOR INFORMATION', margin, currentY);
    currentY += 8;
    
    // Create comprehensive vendor information table
    const vendorInfoData = [
      ['Name & Address of the Vendor', `${vendorData.name || 'Unknown'}\n${vendorData.company || ''}\n${vendorData.address || ''}`],
      ['Location of Work', workLocation],
      ['Agreement Period', agreementPeriod],
      ['Month', `${month} ${year}`],
      ['Audit Review', auditReview],
      ['Remarks if any', remarks],
      ['Seal with Signature of Auditor', '']
    ];
    
    autoTable(pdf, {
      body: vendorInfoData,
      startY: currentY,
      theme: 'grid',
      columnStyles: {
        0: { 
          cellWidth: 65, 
          fontStyle: 'bold',
          fillColor: [240, 240, 240],
          valign: 'top',
          fontSize: 11
        },
        1: { 
          cellWidth: contentWidth - 65,
          fontStyle: 'bold',
          valign: 'top',
          fontSize: 11
        }
      },
      styles: {
        cellPadding: 6,
        fontSize: 11,
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.4,
        overflow: 'linebreak'
      },
      didParseCell: function (data) {
        // Make the seal and signature row (last row) taller
        if (data.row.index === vendorInfoData.length - 1) {
          data.cell.styles.minCellHeight = 32; // Increase height to 25mm
        }
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
    
    // Skip the compliance summary section as requested
    currentY += 5;
    
    addPageFooter(reportDate, reportTime, 1, totalPages);
    
    // ==================== PAGE 2: DOCUMENTS VERIFICATION REPORT ====================
    pdf.addPage();
    addPageHeader();
    
    currentY = 35;
    
    // Documents Verification Section 
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOCUMENTS VERIFICATION REPORT', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 5;
    pdf.setLineWidth(0.8);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Documents verified for the period: ${month} ${year}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    // Create enhanced documents table with proper text formatting
    const documentTableData = documentsToShow.map(doc => [
      doc.slNo.toString().padStart(2, '0'),
      // Ensure document particulars text wraps properly
      doc.particulars.length > 80 ? 
        doc.particulars.substring(0, 77) + '...' : 
        doc.particulars,
      doc.status || 'PENDING',
      // Ensure remarks text is properly formatted and not too long
      (doc.remarks || 'No specific remarks').length > 120 ? 
        (doc.remarks || 'No specific remarks').substring(0, 117) + '...' : 
        (doc.remarks || 'No specific remarks')
    ]);
    
    autoTable(pdf, {
      head: [['S.No', 'Document Particulars', 'Verification Status', 'Compliance Remarks']],
      body: documentTableData,
      startY: currentY,
      theme: 'striped',
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.09, halign: 'center', fontStyle: 'bold', fontSize: 9 }, // ~9% for S.No
        1: { cellWidth: contentWidth * 0.44, fontStyle: 'bold', fontSize: 9, overflow: 'linebreak' }, // ~44% for Document Particulars
        2: { cellWidth: contentWidth * 0.18, halign: 'center', fontStyle: 'bold', fontSize: 9 }, // ~18% for Status
        3: { cellWidth: contentWidth * 0.29, fontStyle: 'bold', fontSize: 9, overflow: 'linebreak' } // ~29% for Compliance Remarks
      },
      styles: {
        cellPadding: 4,
        fontSize: 9,
        fontStyle: 'bold',
        overflow: 'linebreak',
        lineColor: [150, 150, 150],
        lineWidth: 0.3,
        valign: 'top',
        minCellHeight: 10
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      bodyStyles: {
        textColor: [33, 37, 41]
      }
    });
    
    addPageFooter(reportDate, reportTime, 2, totalPages);
    
    return pdf;
  } catch (error) {
    console.error('Error generating compliance verification report:', error);
    throw error;
  }
};

/**
 * Generate a professional document verification report PDF
 * 
 * @param vendorData - Vendor information
 * @param documents - List of approved documents
 * @param title - Report title
 * @returns The generated PDF document
 */
const generateVerificationReport = async (
  vendorData: VendorData,
  documents: DocumentData[],
  title: string = 'Document Verification Report'
): Promise<jsPDF> => {
  // Create new PDF document with A4 size
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  try {
    // Load logo if not cached
    if (!cachedLogos.varuni) {
      try {
        console.log('Loading Varuni logo from local file in PDF generation...');
        cachedLogos.varuni = await imageToBase64('/images/Varuni.jpg');
        console.log('Varuni logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load Varuni logo from local file:', error);
      }
    }
    
    // Page margins and dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Header Section with Logo
    let currentY = 50; // Start after logo (logo ends at Y=45)
    
    // Add Varuni logo (Top left corner, bigger size)
    console.log('VERIFICATION REPORT - Varuni logo available:', !!cachedLogos.varuni);
    if (cachedLogos.varuni) {
      console.log('VERIFICATION REPORT - Adding Varuni logo to PDF');
      const logoWidth = 80;
      const logoHeight = 40;
      const logoX = 10; // Top left corner
      pdf.addImage(cachedLogos.varuni, 'JPEG', logoX, 5, logoWidth, logoHeight);
    } else {
      console.log('VERIFICATION REPORT - Using Varuni fallback rectangle');
      pdf.setFillColor(70, 130, 180);
      pdf.rect(10, 5, 80, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text('VARUNI', 50, 27, { align: 'center' });
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Main Title Section
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    
    // Add decorative lines under title
    currentY += 8;
    pdf.setLineWidth(1);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 2;
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 15;
    
    // Report Information Section
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const reportDate = format(new Date(), 'dd MMMM yyyy');
    const reportTime = format(new Date(), 'HH:mm:ss');
    
    pdf.text(`Report Generated: ${reportDate} at ${reportTime}`, margin, currentY);
    
    currentY += 15;
    
    // Vendor Information Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VENDOR INFORMATION', margin, currentY);
    currentY += 10;
    
    // Create vendor information table
    const vendorInfoData = [
      ['Vendor Name', vendorData.name || 'Not specified'],
      ['Company/Organization', vendorData.company || 'Not specified'],
      ['Address', vendorData.address || 'Not specified'],
      ['Verification Date', reportDate],
      ['Total Documents', documents.length.toString()]
    ];
    
    autoTable(pdf, {
      body: vendorInfoData,
      startY: currentY,
      theme: 'grid',
      columnStyles: {
        0: { 
          cellWidth: 60, 
          fontStyle: 'bold',
          fillColor: [240, 248, 255],
          textColor: [0, 51, 102],
          valign: 'top'
        },
        1: { 
          cellWidth: contentWidth - 60,
          fontStyle: 'normal',
          valign: 'top'
        }
      },
      styles: {
        cellPadding: 6,
        fontSize: 10,
        lineColor: [100, 100, 100],
        lineWidth: 0.3,
        overflow: 'linebreak'
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 20;
    
    // Documents Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOCUMENT VERIFICATION DETAILS', margin, currentY);
    currentY += 10;
    
    // Prepare document table data with enhanced formatting
    const tableData = documents.map((doc, index) => [
      (index + 1).toString().padStart(2, '0'),
      doc.documentType || 'General',
      typeof doc.submissionDate === 'string' ? format(new Date(doc.submissionDate), 'dd/MM/yyyy') : 'Unknown',
      doc.status?.toUpperCase() || 'PENDING',
      doc.remarks && doc.remarks.trim() ? doc.remarks.trim() : 'No specific remarks'
    ]);
    
    autoTable(pdf, {
      head: [['S.No', 'Document Type', 'Submission Date', 'Status', 'Verification Remarks']],
      body: tableData,
      startY: currentY,
      theme: 'striped',
      headStyles: {
        fillColor: [70, 130, 180],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 60 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 60 }
      },
      styles: {
        cellPadding: 5,
        fontSize: 9,
        overflow: 'linebreak',
        lineColor: [150, 150, 150],
        lineWidth: 0.2,
        valign: 'top'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      bodyStyles: {
        textColor: [33, 37, 41]
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 20;
    
    // Verification Summary
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VERIFICATION SUMMARY', margin, currentY);
    currentY += 10;
    
    const approvedDocs = documents.filter(doc => doc.status?.toLowerCase() === 'approved').length;
    const pendingDocs = documents.filter(doc => doc.status?.toLowerCase() === 'pending').length;
    const rejectedDocs = documents.filter(doc => doc.status?.toLowerCase() === 'rejected').length;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Documents Submitted: ${documents.length}`, margin, currentY);
    currentY += 6;
    pdf.text(`Documents Approved: ${approvedDocs}`, margin, currentY);
    currentY += 6;
    pdf.text(`Documents Pending: ${pendingDocs}`, margin, currentY);
    currentY += 6;
    pdf.text(`Documents Rejected: ${rejectedDocs}`, margin, currentY);
    currentY += 10;
    
    // Overall status
    if (approvedDocs === documents.length && documents.length > 0) {
      pdf.setTextColor(0, 128, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Status: ALL DOCUMENTS VERIFIED ✓', margin, currentY);
    } else if (approvedDocs > 0) {
      pdf.setTextColor(255, 140, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Status: PARTIAL VERIFICATION ⚠', margin, currentY);
    } else {
      pdf.setTextColor(220, 53, 69);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Overall Status: VERIFICATION PENDING ⏳', margin, currentY);
    }
    
    pdf.setTextColor(0, 0, 0);
    currentY += 15;
    
    // Skip certification and signature sections as requested
    
    // Footer
    currentY = pageHeight - 30;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is a computer-generated document verification report.', pageWidth / 2, currentY, { align: 'center' });
    pdf.text(`Generated on ${reportDate} at ${reportTime}`, pageWidth / 2, currentY + 4, { align: 'center' });
    
    return pdf;
  } catch (error) {
    console.error('Error generating document verification report:', error);
    throw error;
  }
};

/**
 * Generate a compliance report PDF
 * 
 * @param vendorData - Vendor information
 * @param complianceData - Compliance data
 * @param title - Report title
 * @returns The generated PDF document
 */
const generateComplianceReport = async (
  vendorData: VendorData,
  complianceData: any,
  title: string = 'Compliance Report'
): Promise<jsPDF> => {
  // Create new PDF document
  const pdf = new jsPDF();
  
  try {
    // Load logo if not cached
    if (!cachedLogos.varuni) {
      try {
        console.log('Loading Varuni logo from local file in compliance report...');
        cachedLogos.varuni = await imageToBase64('/images/Varuni.jpg');
        console.log('Varuni logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load Varuni logo from local file:', error);
      }
    }
    
    // Add Varuni logo (Top left corner, bigger size)
    console.log('COMPLIANCE REPORT - Varuni logo available:', !!cachedLogos.varuni);
    if (cachedLogos.varuni) {
      console.log('COMPLIANCE REPORT - Adding Varuni logo to PDF at top left corner');
      const logoWidth = 80;
      const logoHeight = 40;
      const logoX = 10; // Top left corner
      pdf.addImage(cachedLogos.varuni, 'JPEG', logoX, 10, logoWidth, logoHeight);
      console.log('COMPLIANCE REPORT - Varuni logo added successfully');
    } else {
      console.log('COMPLIANCE REPORT - Using Varuni fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(70, 130, 180);
      pdf.rect(10, 10, 80, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text('VARUNI', 50, 32, { align: 'center' });
    }
    
  } catch (error) {
    console.warn('Error loading logo, using fallback design:', error);
    // Fallback to colored rectangle
    pdf.setFillColor(70, 130, 180);
    pdf.rect(10, 10, 80, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text('VARUNI', 50, 32, { align: 'center' });
  }
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  // Add title (moved down to avoid logo overlap - logo ends at Y=50)
  pdf.setFontSize(18);
  pdf.text(title, 105, 60, { align: 'center' });
  
  // Add vendor information (moved down with proper spacing)
  pdf.setFontSize(12);
  pdf.text(`Vendor: ${vendorData.name || 'Unknown'}`, 15, 75);
  pdf.text(`Company: ${vendorData.company || 'Unknown'}`, 15, 82);
  pdf.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 15, 89);
  
  // Add compliance data (moved down with proper spacing)
  // This would be customized based on the specific compliance data structure
  
  return pdf;
};

/**
 * Generate a sample compliance report for testing
 */
const generateSampleComplianceReport = async (): Promise<jsPDF> => {
  const sampleVendorData: VendorData = {
    name: 'ABC Construction Services Pvt. Ltd.',
    company: 'ABC Construction Services Pvt. Ltd.',
    email: 'contact@abcconstruction.com',
    address: '123 Industrial Area, Sector 45, Bangalore - 560078'
  };
  
  const sampleSubmissionData = {
    workLocation: 'BIEC Exhibition Center, Bangalore',
    locationOfWork: 'BIEC Exhibition Center, Bangalore',
    agreementPeriod: 'January 2024 - December 2024',
    uploadPeriod: {
      month: 'November',
      year: 2024
    },
    month: 'November',
    year: 2024,
    auditReview: 'All submitted documents have been thoroughly reviewed and verified for compliance with regulatory requirements, labour laws, and industry standards. The vendor has demonstrated excellent adherence to compliance protocols.',
    remarks: 'All documents are compliant with regulatory requirements. The vendor maintains high standards of documentation and regulatory compliance.',
    auditorName: 'Senior Compliance Officer',
    documents: [
      {
        documentName: 'Form T - Combined Muster Roll Cum Register of Wages',
        title: 'Form T - Combined Muster Roll Cum Register of Wages',
        documentType: 'Labour Compliance',
        status: 'verified',
        consultantRemarks: 'Compliant with Labour Laws and Wage Regulations'
      },
      {
        documentName: 'Bank Statement - Salary Account',
        title: 'Bank Statement - Salary Account',
        documentType: 'Financial Document',
        status: 'verified',
        consultantRemarks: 'All salary transactions verified and compliant'
      },
      {
        documentName: 'Electronic Challan Cum Return (ECR)',
        title: 'Electronic Challan Cum Return (ECR)',
        documentType: 'EPF Compliance',
        status: 'verified',
        consultantRemarks: 'EPF compliance confirmed for the reporting period'
      }
    ]
  };
  
  const sampleComplianceMetrics = {
    auditReview: 'Comprehensive audit completed with satisfactory results',
    remarks: 'Vendor demonstrates excellent compliance standards',
    auditorName: 'Senior Compliance Officer'
  };
  
  return generateComplianceVerificationReport(
    sampleVendorData,
    sampleSubmissionData,
    sampleComplianceMetrics,
    'COMPLIANCE VERIFICATION REPORT'
  );
};

export {
  generateVerificationReport,
  generateComplianceVerificationReport,
  generateComplianceReport,
  generateSampleComplianceReport,
  preloadLogos,
  clearLogoCache
};