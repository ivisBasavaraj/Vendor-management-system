const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management');

const Notification = require('./models/notification.model');

async function checkNotifications() {
  try {
    console.log('Checking notifications...');

    const rejectionNotifications = await Notification.find({ type: 'document_rejected' }).sort({ createdAt: -1 });
    console.log('Document rejection notifications:', rejectionNotifications.length);
    rejectionNotifications.forEach(n => {
      console.log(`- ${n.title}: ${n.message} | To: ${n.recipient} | Created: ${n.createdAt}`);
    });

    const allNotifications = await Notification.find({}).sort({ createdAt: -1 }).limit(20);
    console.log('\nRecent notifications (last 20):', allNotifications.length);
    allNotifications.forEach(n => {
      console.log(`- ${n.type}: ${n.title} | To: ${n.recipient} | Created: ${n.createdAt}`);
    });

  } catch (e) {
    console.error('Error:', e);
  } finally {
    mongoose.connection.close();
  }
}

checkNotifications();