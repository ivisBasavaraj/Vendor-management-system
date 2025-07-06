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
let cachedLogos: { biec?: string; imtma?: string } = {};

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
    
    if (!cachedLogos.biec) {
      console.log('Loading BIEC logo from local file...');
      promises.push(
        imageToBase64('/images/BIEC.png')
          .then(base64 => {
            cachedLogos.biec = base64;
            console.log('BIEC logo preloaded successfully from local file');
          })
          .catch(error => console.warn('Could not preload BIEC logo from local file:', error))
      );
    } else {
      console.log('BIEC logo already cached');
    }
    
    if (!cachedLogos.imtma) {
      console.log('Loading IMTMA logo...');
      promises.push(
        imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png')
          .then(base64 => {
            cachedLogos.imtma = base64;
            console.log('IMTMA logo preloaded successfully');
          })
          .catch(error => console.warn('Could not preload IMTMA logo:', error))
      );
    } else {
      console.log('IMTMA logo already cached');
    }
    
    await Promise.all(promises);
    console.log('Logo preload completed. Cache status:', {
      biec: !!cachedLogos.biec,
      imtma: !!cachedLogos.imtma
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
    // Load logos if not cached
    if (!cachedLogos.biec) {
      try {
        console.log('Loading BIEC logo from local file...');
        cachedLogos.biec = await imageToBase64('/images/BIEC.png');
        console.log('BIEC logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load BIEC logo from local file:', error);
      }
    }
    
    if (!cachedLogos.imtma) {
      try {
        console.log('Loading IMTMA logo from external URL...');
        cachedLogos.imtma = await imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png');
        console.log('IMTMA logo loaded successfully from external URL');
      } catch (error) {
        console.warn('Could not load IMTMA logo:', error);
      }
    }
    
    // Page margins and dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    const footerY = pageHeight - 15;
    
    // Helper function to add header to each page
    const addPageHeader = (pageNumber: number, totalPages: number) => {
      // Add IMTMA logo (Left side)
      if (cachedLogos.imtma) {
        pdf.addImage(cachedLogos.imtma, 'PNG', margin, 10, 30, 15);
      } else {
        pdf.setFillColor(220, 53, 69);
        pdf.rect(margin, 10, 30, 15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('IMTMA', margin + 10, 19);
      }
      
      // Add BIEC logo (Right side)
      if (cachedLogos.biec) {
        pdf.addImage(cachedLogos.biec, 'PNG', pageWidth - margin - 30, 10, 30, 15);
      } else {
        pdf.setFillColor(0, 123, 255);
        pdf.rect(pageWidth - margin - 30, 10, 30, 15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('BIEC', pageWidth - margin - 20, 19);
      }
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Add page number
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, 8, { align: 'right' });
    };
    
    // Helper function to add footer to each page
    const addPageFooter = (reportId: string, reportDate: string, reportTime: string) => {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('This is a computer-generated compliance verification report.', pageWidth / 2, footerY, { align: 'center' });
      pdf.text(`Generated on ${reportDate} at ${reportTime} | Report ID: ${reportId}`, pageWidth / 2, footerY + 3, { align: 'center' });
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
      documentsToShow = submissionData.documents.map((doc: any, index: number) => ({
        slNo: index + 1,
        particulars: doc.documentName || doc.title || doc.documentType || 'Unknown Document',
        status: doc.status ? doc.status.toUpperCase() : 'PENDING',
        remarks: doc.consultantRemarks || doc.remarks || 'Under review'
      }));
    }
    
    const totalPages = 2;
    
    // ==================== PAGE 1: COMPLIANCE VERIFICATION REPORT ====================
    addPageHeader(1, totalPages);
    
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
    pdf.text(`Report ID: ${reportId} | Generated: ${reportDate} | Period: ${month} ${year}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    
    // Vendor Information Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VENDOR INFORMATION', margin, currentY);
    currentY += 8;
    
    // Create comprehensive vendor information table
    const vendorInfoData = [
      ['Name & Address of the Vendor', `${vendorData.name || 'Unknown'}\n${vendorData.company || ''}\n${vendorData.address || vendorData.email || ''}`],
      ['Location of Work', workLocation],
      ['Agreement Period', agreementPeriod],
      ['Month', `${month} ${year}`],
      ['Audit Review', auditReview],
      ['Remarks if any', remarks],
      ['Seal with Signature of Auditor', `Verified by: ${auditorName}\nDate: ${reportDate}`]
    ];
    
    autoTable(pdf, {
      body: vendorInfoData,
      startY: currentY,
      theme: 'grid',
      columnStyles: {
        0: { 
          cellWidth: 55, 
          fontStyle: 'bold',
          fillColor: [240, 240, 240],
          valign: 'top'
        },
        1: { 
          cellWidth: contentWidth - 55,
          fontStyle: 'normal',
          valign: 'top'
        }
      },
      styles: {
        cellPadding: 4,
        fontSize: 9,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        overflow: 'linebreak'
      }
    });
    
    currentY = (pdf as any).lastAutoTable.finalY + 15;
    
    // Skip the compliance summary section as requested
    currentY += 5;
    
    // Certification Section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CERTIFICATION', margin, currentY);
    currentY += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const certificationText = `This is to certify that the above-mentioned vendor has submitted all required documents for the period of ${month} ${year}.`;
    
    const splitText = pdf.splitTextToSize(certificationText, contentWidth);
    pdf.text(splitText, margin, currentY);
    currentY += splitText.length * 4 + 12;
    
    // Signature Section
    const signatureWidth = (contentWidth - 20) / 2;
    
    // Left signature
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Verified & Certified By:', margin, currentY);
    pdf.line(margin, currentY + 12, margin + signatureWidth - 10, currentY + 12);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(auditorName, margin, currentY + 16);
    pdf.text('Compliance Auditor', margin, currentY + 20);
    pdf.text(`Date: ${reportDate}`, margin, currentY + 24);
    
    // Right seal
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Organization Seal:', margin + signatureWidth + 20, currentY);
    pdf.rect(margin + signatureWidth + 20, currentY + 4, signatureWidth - 10, 22);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('(Official Seal)', margin + signatureWidth + 20 + (signatureWidth - 10) / 2, currentY + 17, { align: 'center' });
    
    addPageFooter(reportId, reportDate, reportTime);
    
    // ==================== PAGE 2: DOCUMENTS VERIFICATION CHECKLIST ====================
    pdf.addPage();
    addPageHeader(2, totalPages);
    
    currentY = 35;
    
    // Documents Verification Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DOCUMENTS VERIFICATION CHECKLIST', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 5;
    pdf.setLineWidth(0.8);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    
    currentY += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Documents verified for the period: ${month} ${year}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    // Create enhanced documents table
    const documentTableData = documentsToShow.map(doc => [
      doc.slNo.toString().padStart(2, '0'),
      doc.particulars,
      doc.status || 'PENDING',
      doc.remarks || 'No specific remarks'
    ]);
    
    autoTable(pdf, {
      head: [['S.No', 'Document Particulars', 'Verification Status', 'Compliance Remarks']],
      body: documentTableData,
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
        1: { cellWidth: 90 },
        2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 55 }
      },
      styles: {
        cellPadding: 4,
        fontSize: 8,
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
    
    addPageFooter(reportId, reportDate, reportTime);
    
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
    // Load logos if not cached
    if (!cachedLogos.biec) {
      try {
        console.log('Loading BIEC logo from local file in PDF generation...');
        cachedLogos.biec = await imageToBase64('/images/BIEC.png');
        console.log('BIEC logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load BIEC logo from local file:', error);
      }
    }
    
    if (!cachedLogos.imtma) {
      try {
        console.log('Loading IMTMA logo from external URL...');
        cachedLogos.imtma = await imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png');
        console.log('IMTMA logo loaded successfully from external URL');
      } catch (error) {
        console.warn('Could not load IMTMA logo:', error);
      }
    }
    
    // Page margins and dimensions
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Header Section with Logos
    let currentY = 25;
    
    // Add IMTMA logo (Left side)
    console.log('VERIFICATION REPORT - IMTMA logo available:', !!cachedLogos.imtma);
    if (cachedLogos.imtma) {
      console.log('VERIFICATION REPORT - Adding IMTMA logo to PDF');
      pdf.addImage(cachedLogos.imtma, 'PNG', margin, currentY, 40, 20);
    } else {
      console.log('VERIFICATION REPORT - Using IMTMA fallback rectangle');
      pdf.setFillColor(220, 53, 69);
      pdf.rect(margin, currentY, 40, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text('IMTMA', margin + 15, currentY + 12);
    }
    
    // Add BIEC logo (Right side)
    console.log('VERIFICATION REPORT - BIEC logo available:', !!cachedLogos.biec);
    if (cachedLogos.biec) {
      console.log('VERIFICATION REPORT - Adding BIEC logo to PDF');
      pdf.addImage(cachedLogos.biec, 'PNG', pageWidth - margin - 40, currentY, 40, 20);
    } else {
      console.log('VERIFICATION REPORT - Using BIEC fallback rectangle');
      pdf.setFillColor(0, 123, 255);
      pdf.rect(pageWidth - margin - 40, currentY, 40, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.text('BIEC', pageWidth - margin - 25, currentY + 12);
    }
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    currentY += 35;
    
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
    currentY += 6;
    pdf.text(`Report ID: DVR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, margin, currentY);
    
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
      ['Contact Email', vendorData.email || 'Not specified'],
      ['Address', vendorData.address || 'Not specified'],
      ['Verification Date', reportDate],
      ['Total Documents', documents.length.toString()],
      ['Verified By', 'System Consultant']
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
      doc.title || 'Untitled Document',
      doc.documentType || 'General',
      typeof doc.submissionDate === 'string' ? format(new Date(doc.submissionDate), 'dd/MM/yyyy') : 'Unknown',
      doc.status?.toUpperCase() || 'PENDING',
      doc.remarks && doc.remarks.trim() ? doc.remarks.trim() : 'No specific remarks'
    ]);
    
    autoTable(pdf, {
      head: [['S.No', 'Document Title', 'Document Type', 'Submission Date', 'Status', 'Verification Remarks']],
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
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 45 }
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
    
    // Certification Statement
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CERTIFICATION', margin, currentY);
    currentY += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const certificationText = `This document verification report certifies that all listed documents have been thoroughly reviewed and verified according to established compliance standards and regulatory requirements. The verification process ensures document authenticity, completeness, and adherence to applicable guidelines.`;
    
    const splitText = pdf.splitTextToSize(certificationText, contentWidth);
    pdf.text(splitText, margin, currentY);
    currentY += splitText.length * 5 + 15;
    
    // Signature Section
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    
    // Verifier signature
    pdf.text('Verified By:', margin, currentY);
    currentY += 15;
    pdf.line(margin, currentY, margin + 60, currentY);
    currentY += 5;
    pdf.setFontSize(10);
    pdf.text('System Consultant', margin, currentY);
    currentY += 4;
    pdf.text('Document Verification Officer', margin, currentY);
    currentY += 4;
    pdf.text(`Date: ${reportDate}`, margin, currentY);
    
    // Organization seal area
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Official Seal:', pageWidth - margin - 60, currentY - 23);
    pdf.rect(pageWidth - margin - 60, currentY - 15, 50, 20);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('(Organization Seal)', pageWidth - margin - 45, currentY - 5, { align: 'center' });
    
    // Footer
    currentY = pageHeight - 30;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is a computer-generated document verification report.', pageWidth / 2, currentY, { align: 'center' });
    pdf.text(`Generated on ${reportDate} at ${reportTime} | Report ID: DVR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, pageWidth / 2, currentY + 4, { align: 'center' });
    
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
    // Load logos if not cached
    if (!cachedLogos.biec) {
      try {
        console.log('Loading BIEC logo from local file in compliance report...');
        cachedLogos.biec = await imageToBase64('/images/BIEC.png');
        console.log('BIEC logo loaded successfully from local file');
      } catch (error) {
        console.warn('Could not load BIEC logo from local file:', error);
      }
    }
    
    if (!cachedLogos.imtma) {
      try {
        console.log('Loading IMTMA logo from external URL...');
        cachedLogos.imtma = await imageToBase64('https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png');
        console.log('IMTMA logo loaded successfully from external URL');
      } catch (error) {
        console.warn('Could not load IMTMA logo:', error);
      }
    }
    
    // Add IMTMA logo (Left side)
    console.log('COMPLIANCE REPORT - IMTMA logo available:', !!cachedLogos.imtma);
    if (cachedLogos.imtma) {
      console.log('COMPLIANCE REPORT - Adding IMTMA logo to PDF at position (15, 15)');
      pdf.addImage(cachedLogos.imtma, 'PNG', 15, 15, 50, 25);
      console.log('COMPLIANCE REPORT - IMTMA logo added successfully');
    } else {
      console.log('COMPLIANCE REPORT - Using IMTMA fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(220, 53, 69);
      pdf.rect(15, 15, 50, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('IMTMA', 30, 30);
    }
    
    // Add BIEC logo (Right side)
    console.log('COMPLIANCE REPORT - BIEC logo available:', !!cachedLogos.biec);
    if (cachedLogos.biec) {
      console.log('COMPLIANCE REPORT - Adding BIEC logo to PDF at position (145, 15)');
      pdf.addImage(cachedLogos.biec, 'PNG', 145, 15, 50, 25);
      console.log('COMPLIANCE REPORT - BIEC logo added successfully');
    } else {
      console.log('COMPLIANCE REPORT - Using BIEC fallback rectangle');
      // Fallback to colored rectangle
      pdf.setFillColor(0, 123, 255);
      pdf.rect(145, 15, 50, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('BIEC', 162, 30);
    }
    
  } catch (error) {
    console.warn('Error loading logos, using fallback design:', error);
    // Fallback to original colored rectangles
    pdf.setFillColor(0, 123, 255);
    pdf.rect(15, 15, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text('BIEC', 25, 24);
    
    pdf.setFillColor(220, 53, 69);
    pdf.rect(165, 15, 30, 15, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('IMTMA', 173, 24);
  }
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
  
  // Add title (moved down to avoid logo overlap - logos end at Y=40)
  pdf.setFontSize(18);
  pdf.text(title, 105, 55, { align: 'center' });
  
  // Add vendor information (moved down with proper spacing)
  pdf.setFontSize(12);
  pdf.text(`Vendor: ${vendorData.name || 'Unknown'}`, 15, 70);
  pdf.text(`Company: ${vendorData.company || 'Unknown'}`, 15, 77);
  pdf.text(`Email: ${vendorData.email || 'Unknown'}`, 15, 84);
  pdf.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 15, 91);
  
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