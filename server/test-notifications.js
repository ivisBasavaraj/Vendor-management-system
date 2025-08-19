const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Notification = require('./models/notification.model');
const User = require('./models/user.model');
const webSocketService = require('./utils/webSocketService');

// Load environment variables
dotenv.config();

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vms');
    console.log('Connected to MongoDB');

    // Find a test user (vendor)
    const vendor = await User.findOne({ role: 'vendor' });
    if (!vendor) {
      console.log('No vendor found in database');
      return;
    }

    // Find a test user (admin)
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('No admin found in database');
      return;
    }

    console.log(`Found vendor: ${vendor.name} (${vendor.email})`);
    console.log(`Found admin: ${admin.name} (${admin.email})`);

    // Create a test notification
    const testNotification = await Notification.create({
      recipient: vendor._id,
      sender: admin._id,
      type: 'system',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      priority: 'medium'
    });

    console.log('✅ Test notification created successfully:', testNotification._id);

    // Check if notification was saved
    const savedNotification = await Notification.findById(testNotification._id)
      .populate('recipient', 'name email')
      .populate('sender', 'name email');

    console.log('✅ Notification retrieved from database:');
    console.log(`  - ID: ${savedNotification._id}`);
    console.log(`  - Recipient: ${savedNotification.recipient.name} (${savedNotification.recipient.email})`);
    console.log(`  - Sender: ${savedNotification.sender.name} (${savedNotification.sender.email})`);
    console.log(`  - Title: ${savedNotification.title}`);
    console.log(`  - Message: ${savedNotification.message}`);
    console.log(`  - Created: ${savedNotification.createdAt}`);

    // Count total notifications
    const totalNotifications = await Notification.countDocuments();
    console.log(`\n📊 Total notifications in database: ${totalNotifications}`);

    // Count unread notifications for vendor
    const unreadCount = await Notification.countDocuments({ 
      recipient: vendor._id, 
      isRead: false 
    });
    console.log(`📊 Unread notifications for ${vendor.name}: ${unreadCount}`);

    // Test WebSocket service (without actual connection)
    console.log('\n🔌 Testing WebSocket service methods:');
    console.log(`  - Connected users: ${webSocketService.getConnectedUsersCount()}`);
    console.log(`  - Connected user IDs: ${webSocketService.getConnectedUserIds()}`);
    console.log(`  - Is vendor connected: ${webSocketService.isUserConnected(vendor._id.toString())}`);

    // Try to send a notification (will fail if no connection, but tests the method)
    const sendResult = webSocketService.sendToUser(vendor._id.toString(), 'test_notification', {
      title: 'Test WebSocket Notification',
      message: 'This is a test WebSocket message'
    });
    console.log(`  - Send notification result: ${sendResult}`);

    console.log('\n✅ Notification system test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Start the client application');
    console.log('  2. Login as a user');
    console.log('  3. Check if WebSocket connection is established');
    console.log('  4. Perform actions that should trigger notifications');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testNotifications();