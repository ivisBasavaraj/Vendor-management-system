const mongoose = require('mongoose');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkAdmin = async () => {
  try {
    await connectDB();
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@imtma.com' });
    if (admin) {
      console.log('Admin user found:');
      console.log('Email:', admin.email);
      console.log('Role:', admin.role);
      console.log('Active:', admin.isActive);
      console.log('Password hash:', admin.password);
      
      // Test password
      const isMatch = await bcrypt.compare('admin123', admin.password);
      console.log('Password test (admin123):', isMatch);
    } else {
      console.log('Admin user not found');
    }
    
    // List all users
    const users = await User.find({});
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkAdmin();