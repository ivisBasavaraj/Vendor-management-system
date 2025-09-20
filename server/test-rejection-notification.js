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

// Define schemas (minimal for testing)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
});

const DocumentSubmissionSchema = new mongoose.Schema({
  vendor: mongoose.Schema.Types.ObjectId,
  documents: [{
    documentType: String,
    documentName: String,
    status: String
  }],
  createdAt: Date
});

const NotificationSchema = new mongoose.Schema({
  recipient: mongoose.Schema.Types.ObjectId,
  type: String,
  title: String,
  message: String,
  createdAt: Date
});

const User = mongoose.model('User', UserSchema);
const DocumentSubmission = mongoose.model('DocumentSubmission', DocumentSubmissionSchema);
const Notification = mongoose.model('Notification', NotificationSchema);

async function testRejectionNotification() {
  try {
    console.log('=== TESTING REJECTION NOTIFICATION ===');

    // Find a vendor with documents
    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors`);

    // Find vendor with documents (Basava raja should have documents)
    const vendorWithDocs = vendors.find(v => v.name === 'Basava raja');
    if (!vendorWithDocs) {
      console.log('No vendor with documents found');
      return;
    }

    console.log(`Testing with vendor: ${vendorWithDocs.name} (${vendorWithDocs._id})`);

    // Find their submissions
    const submissions = await DocumentSubmission.find({ vendor: vendorWithDocs._id });
    console.log(`Found ${submissions.length} submissions`);

    if (submissions.length === 0) {
      console.log('No submissions found for this vendor');
      return;
    }

    // Get the first submission
    const submission = submissions[0];
    console.log(`Testing with submission: ${submission._id}`);

    // Find a document that can be rejected (not already rejected)
    const rejectableDoc = submission.documents.find(doc => doc.status !== 'rejected');
    if (!rejectableDoc) {
      console.log('No documents available for rejection in this submission');
      return;
    }

    console.log(`Will test rejection of document: "${rejectableDoc.documentName}" (${rejectableDoc.documentType})`);

    // Simulate the notification message creation (same logic as in controller)
    const status = 'rejected';
    const remarks = 'Test rejection for notification verification';
    const notificationMessage = `Your document "${rejectableDoc.documentName}" (${rejectableDoc.documentType}) has been ${status}${remarks ? '. Remarks: ' + remarks : ''}`;

    console.log('Expected notification message:');
    console.log(notificationMessage);

    // Check if there are any existing rejection notifications
    const existingNotifications = await Notification.find({
      recipient: vendorWithDocs._id,
      type: 'document_rejected'
    }).sort({ createdAt: -1 }).limit(3);

    console.log(`\nExisting rejection notifications for this vendor: ${existingNotifications.length}`);
    existingNotifications.forEach(notif => {
      console.log(`- ${notif.title}: ${notif.message} (${notif.createdAt})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testRejectionNotification();