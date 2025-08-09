const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user.model');

// Load environment variables
dotenv.config();

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vms');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({}, 'name email role isActive').limit(10);
    
    console.log('\n👥 Users in database:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log('');
    });

    console.log(`📊 Total users found: ${users.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the check
checkUsers();