const mongoose = require('mongoose');
const User = require('../models/user.model');
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

// Create admin user
const createAdmin = async () => {
  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@imtma.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = {
      name: 'IMTMA Admin',
      email: 'admin@imtma.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      company: 'IMTMA',
      isActive: true
    };

    const createdAdmin = await User.create(adminUser);
    console.log('Admin user created successfully!');
    console.log('Email: admin@imtma.com');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Run the creation
const runCreate = async () => {
  await connectDB();
  await createAdmin();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

runCreate();