const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Define schemas
const DocumentSchema = new mongoose.Schema({
  vendor: mongoose.Schema.Types.ObjectId,
  status: String,
  title: String,
  createdAt: Date
});

const DocumentSubmissionSchema = new mongoose.Schema({
  vendor: mongoose.Schema.Types.ObjectId,
  documents: [{
    status: String,
    title: String,
    _id: mongoose.Schema.Types.ObjectId
  }],
  createdAt: Date
});

const Document = mongoose.model('Document', DocumentSchema);
const DocumentSubmission = mongoose.model('DocumentSubmission', DocumentSubmissionSchema);

// Get all vendors first
async function getVendors() {
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    role: String
  }));

  const vendors = await User.find({ role: 'vendor' });
  console.log('Available vendors:');
  vendors.forEach(vendor => {
    console.log(`- ${vendor.name} (${vendor.email}): ${vendor._id}`);
  });

  return vendors;
}

async function debugDashboard(vendorId) {
  try {
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Vendor ID:', vendorId);

    // Get all documents for this vendor
    const allDocuments = await Document.find({ vendor: vendorId });
    console.log(`\nTotal documents in Document model: ${allDocuments.length}`);
    console.log('Document statuses:');
    const statusCounts = {};
    allDocuments.forEach(doc => {
      statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;
    });
    console.log(statusCounts);

    // Count by status
    const total = await Document.countDocuments({ vendor: vendorId });
    const pending = await Document.countDocuments({ vendor: vendorId, status: 'pending' });
    const underReview = await Document.countDocuments({ vendor: vendorId, status: 'under_review' });
    const approved = await Document.countDocuments({
      vendor: vendorId,
      status: { $in: ['approved', 'consultant_approved', 'final_approved'] }
    });
    const rejected = await Document.countDocuments({
      vendor: vendorId,
      status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
    });

    console.log('\nCounts from Document model:');
    console.log(`Total: ${total}`);
    console.log(`Pending: ${pending}`);
    console.log(`Under Review: ${underReview}`);
    console.log(`Approved: ${approved}`);
    console.log(`Rejected: ${rejected}`);

    // Check DocumentSubmission model
    const submissions = await DocumentSubmission.find({ vendor: vendorId });
    console.log(`\nTotal submissions in DocumentSubmission model: ${submissions.length}`);

    let totalFromSubs = 0;
    let pendingFromSubs = 0;
    let underReviewFromSubs = 0;
    let approvedFromSubs = 0;
    let rejectedFromSubs = 0;

    submissions.forEach(submission => {
      submission.documents.forEach(doc => {
        totalFromSubs++;
        switch (doc.status) {
          case 'pending':
          case 'uploaded':
            pendingFromSubs++;
            break;
          case 'under_review':
            underReviewFromSubs++;
            break;
          case 'approved':
            approvedFromSubs++;
            break;
          case 'rejected':
            rejectedFromSubs++;
            break;
        }
      });
    });

    console.log('\nCounts from DocumentSubmission model:');
    console.log(`Total: ${totalFromSubs}`);
    console.log(`Pending: ${pendingFromSubs}`);
    console.log(`Under Review: ${underReviewFromSubs}`);
    console.log(`Approved: ${approvedFromSubs}`);
    console.log(`Rejected: ${rejectedFromSubs}`);

    // Check for any notifications
    const Notification = mongoose.model('Notification', new mongoose.Schema({
      recipient: mongoose.Schema.Types.ObjectId,
      type: String,
      title: String,
      message: String,
      createdAt: Date
    }));

    const notifications = await Notification.find({
      recipient: vendorId,
      type: 'document_rejection'
    }).sort({ createdAt: -1 });

    console.log(`\nDocument rejection notifications: ${notifications.length}`);
    notifications.forEach(notif => {
      console.log(`- ${notif.title}: ${notif.message} (${notif.createdAt})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Main execution
async function main() {
  try {
    const vendors = await getVendors();
    if (vendors.length > 0) {
      for (const vendor of vendors) {
        console.log(`\n=== DASHBOARD FOR ${vendor.name} ===`);
        await debugDashboard(vendor._id);
        console.log('=====================================\n');
      }
    }
  } finally {
    mongoose.connection.close();
  }
}

main();