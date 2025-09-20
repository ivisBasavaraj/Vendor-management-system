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

async function checkRejections() {
  try {
    console.log('=== CHECKING FOR REJECTIONS ===');

    // Check Document model for any rejected statuses
    const rejectedDocs = await Document.find({
      status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
    });

    console.log(`Documents with rejected status in Document model: ${rejectedDocs.length}`);
    rejectedDocs.forEach(doc => {
      console.log(`- ${doc.title}: ${doc.status} (Vendor: ${doc.vendor})`);
    });

    // Check all statuses in Document model
    const allStatuses = await Document.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\nAll statuses in Document model:');
    allStatuses.forEach(status => {
      console.log(`${status._id}: ${status.count}`);
    });

    // Check DocumentSubmission model
    const submissions = await DocumentSubmission.find({});
    let totalRejectedInSubs = 0;

    console.log(`\nChecking ${submissions.length} submissions for rejected documents:`);

    submissions.forEach(submission => {
      submission.documents.forEach(doc => {
        if (doc.status === 'rejected') {
          totalRejectedInSubs++;
          console.log(`- Submission ${submission._id}: ${doc.title} is rejected`);
        }
      });
    });

    console.log(`\nTotal rejected documents in submissions: ${totalRejectedInSubs}`);

    // Check notifications
    const Notification = mongoose.model('Notification', new mongoose.Schema({
      recipient: mongoose.Schema.Types.ObjectId,
      type: String,
      title: String,
      message: String,
      createdAt: Date
    }));

    const rejectionNotifications = await Notification.find({
      type: 'document_rejection'
    });

    console.log(`\nDocument rejection notifications: ${rejectionNotifications.length}`);
    rejectionNotifications.forEach(notif => {
      console.log(`- ${notif.title}: ${notif.message} (Recipient: ${notif.recipient})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkRejections();