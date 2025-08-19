const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('./models/notification.model');
const User = require('./models/user.model');

// Load environment variables
dotenv.config();

async function createTestNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vms');
    console.log('Connected to MongoDB');

    // Find users
    const admin = await User.findOne({ role: 'admin' });
    const vendor = await User.findOne({ role: 'vendor' });
    const consultant = await User.findOne({ role: 'consultant' });

    if (!admin) {
      console.log('❌ No admin user found');
      return;
    }

    console.log(`Found admin: ${admin.name} (${admin.email})`);
    if (vendor) console.log(`Found vendor: ${vendor.name} (${vendor.email})`);
    if (consultant) console.log(`Found consultant: ${consultant.name} (${consultant.email})`);

    // Create test notifications for admin
    const adminNotifications = [
      {
        recipient: admin._id,
        sender: vendor ? vendor._id : admin._id,
        type: 'document_submission',
        title: 'New Document Submitted',
        message: 'A vendor has submitted new documents for review.',
        priority: 'medium'
      },
      {
        recipient: admin._id,
        sender: consultant ? consultant._id : admin._id,
        type: 'workflow_update',
        title: 'Document Review Completed',
        message: 'A consultant has completed reviewing vendor documents.',
        priority: 'low'
      },
      {
        recipient: admin._id,
        sender: admin._id,
        type: 'system',
        title: 'System Maintenance',
        message: 'System maintenance is scheduled for tonight at 2 AM.',
        priority: 'high'
      }
    ];

    // Create notifications for vendor if exists
    const vendorNotifications = vendor ? [
      {
        recipient: vendor._id,
        sender: admin._id,
        type: 'document_approved',
        title: 'Document Approved',
        message: 'Your submitted document has been approved.',
        priority: 'medium'
      },
      {
        recipient: vendor._id,
        sender: consultant ? consultant._id : admin._id,
        type: 'document_review',
        title: 'Document Requires Changes',
        message: 'Please review and update your submitted document.',
        priority: 'high'
      }
    ] : [];

    // Create notifications for consultant if exists
    const consultantNotifications = consultant ? [
      {
        recipient: consultant._id,
        sender: admin._id,
        type: 'workflow_update',
        title: 'New Assignment',
        message: 'You have been assigned new documents to review.',
        priority: 'medium'
      }
    ] : [];

    // Combine all notifications
    const allNotifications = [...adminNotifications, ...vendorNotifications, ...consultantNotifications];

    // Insert notifications
    const createdNotifications = await Notification.insertMany(allNotifications);
    
    console.log(`\n✅ Created ${createdNotifications.length} test notifications:`);
    
    // Group by recipient
    const notificationsByUser = {};
    for (const notification of createdNotifications) {
      const user = await User.findById(notification.recipient, 'name email role');
      const userKey = `${user.name} (${user.role})`;
      
      if (!notificationsByUser[userKey]) {
        notificationsByUser[userKey] = [];
      }
      notificationsByUser[userKey].push(notification);
    }

    // Display results
    for (const [userKey, notifications] of Object.entries(notificationsByUser)) {
      console.log(`\n📧 ${userKey}: ${notifications.length} notifications`);
      notifications.forEach((notification, index) => {
        console.log(`  ${index + 1}. ${notification.title} (${notification.type})`);
      });
    }

    // Check total notifications in database
    const totalNotifications = await Notification.countDocuments();
    console.log(`\n📊 Total notifications in database: ${totalNotifications}`);

    // Check notifications for admin specifically
    const adminNotificationCount = await Notification.countDocuments({ recipient: admin._id });
    console.log(`📊 Admin notifications: ${adminNotificationCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function
createTestNotifications();