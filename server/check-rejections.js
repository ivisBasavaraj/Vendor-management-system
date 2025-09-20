const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management');

const Document = require('./models/document.model');
const DocumentSubmission = require('./models/documentSubmission.model');

async function checkRejections() {
  try {
    console.log('Checking for rejected documents...');

    // Check Document model
    const rejectedDocs = await Document.find({
      status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
    });
    console.log('Rejected documents in Document model:', rejectedDocs.length);
    rejectedDocs.forEach(doc => {
      console.log(`- ${doc.title} | Vendor: ${doc.vendor} | Status: ${doc.status}`);
    });

    // Check DocumentSubmission model
    const submissions = await DocumentSubmission.find({});
    let rejectedInSubmissions = 0;
    let totalInSubmissions = 0;

    submissions.forEach(sub => {
      sub.documents.forEach(doc => {
        totalInSubmissions++;
        if (doc.status === 'rejected') {
          rejectedInSubmissions++;
          console.log(`- Submission: ${sub._id} | Doc: ${doc.documentName} | Vendor: ${sub.vendor} | Status: ${doc.status}`);
        }
      });
    });

    console.log('Total documents in submissions:', totalInSubmissions);
    console.log('Rejected documents in DocumentSubmission model:', rejectedInSubmissions);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    mongoose.connection.close();
  }
}

checkRejections();