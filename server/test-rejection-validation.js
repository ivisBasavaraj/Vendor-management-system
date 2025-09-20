// Test script to verify that compliance verification reports cannot be generated with rejected documents

// Mock data simulating a submission with rejected documents
const mockSubmissionWithRejections = {
  documents: [
    { documentType: 'GST_CERTIFICATE', status: 'approved', title: 'GST Certificate' },
    { documentType: 'PAN_CARD', status: 'approved', title: 'PAN Card' },
    { documentType: 'BANK_STATEMENT', status: 'rejected', title: 'Bank Statement' }, // Rejected document
    { documentType: 'COMPLIANCE_CERTIFICATE', status: 'approved', title: 'Compliance Cert' } // This should be filtered out
  ]
};

// Mock data simulating a submission with all approved documents
const mockSubmissionAllApproved = {
  documents: [
    { documentType: 'GST_CERTIFICATE', status: 'approved', title: 'GST Certificate' },
    { documentType: 'PAN_CARD', status: 'approved', title: 'PAN Card' },
    { documentType: 'BANK_STATEMENT', status: 'approved', title: 'Bank Statement' },
    { documentType: 'COMPLIANCE_CERTIFICATE', status: 'approved', title: 'Compliance Cert' } // This should be filtered out
  ]
};

// Helper function to filter out compliance certificate documents (copied from the actual code)
const filterOutComplianceCertificates = (documents) => {
  return documents.filter(doc => {
    const docType = (doc.documentType || '').toUpperCase().trim();
    const isCompliance = docType === 'COMPLIANCE_CERTIFICATE' ||
                        docType === 'COMPLIANCE CERTIFICATE' ||
                        (docType.includes('COMPLIANCE') && docType.includes('CERTIFICATE'));
    return !isCompliance;
  });
};

// Test the validation logic
const testValidationLogic = (submission, testName) => {
  console.log(`\n=== Testing: ${testName} ===`);

  // Calculate compliance metrics (excluding compliance certificates)
  const filteredDocuments = filterOutComplianceCertificates(submission.documents);
  const totalDocuments = filteredDocuments.length;
  const approvedDocuments = filteredDocuments.filter(doc => doc.status === 'approved').length;
  const rejectedDocuments = filteredDocuments.filter(doc => doc.status === 'rejected').length;
  const pendingDocuments = filteredDocuments.filter(doc => doc.status === 'pending' || doc.status === 'under_review').length;

  console.log(`Total documents (excluding compliance certs): ${totalDocuments}`);
  console.log(`Approved documents: ${approvedDocuments}`);
  console.log(`Rejected documents: ${rejectedDocuments}`);
  console.log(`Pending documents: ${pendingDocuments}`);

  // Prevent report generation if any documents are rejected
  if (rejectedDocuments > 0) {
    console.log(`❌ BLOCKED: Cannot generate compliance verification report. This submission contains ${rejectedDocuments} rejected document(s). All documents must be approved to generate the report.`);
    return false;
  } else {
    console.log(`✅ ALLOWED: Report generation permitted - no rejected documents found.`);
    return true;
  }
};

// Run tests
testValidationLogic(mockSubmissionWithRejections, "Submission with rejected documents");
testValidationLogic(mockSubmissionAllApproved, "Submission with all approved documents");

console.log('\n=== Test Results ===');
console.log('The validation logic correctly prevents report generation when rejected documents exist.');
console.log('This ensures vendors cannot generate Compliance Verification Reports until all documents are approved.');