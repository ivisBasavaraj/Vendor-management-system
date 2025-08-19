require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const User = require('./models/user.model');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise-based readline question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

// Connect to MongoDB
async function connectToDatabase() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management';
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return false;
  }
}

// Display main menu
async function displayMenu() {
  console.log('\n====== User Management System ======');
  console.log('1. Create Admin User');
  console.log('2. Create Consultant User');
  console.log('3. Create Vendor User');
  console.log('4. List All Users');
  console.log('5. Delete User');
  console.log('6. Exit');
  
  const choice = await question('Enter your choice (1-6): ');
  
  switch (choice) {
    case '1':
      await createUser('admin');
      break;
    case '2':
      await createUser('consultant');
      break;
    case '3':
      await createUser('vendor');
      break;
    case '4':
      await listUsers();
      break;
    case '5':
      await deleteUser();
      break;
    case '6':
      await disconnectAndExit();
      break;
    default:
      console.log('Invalid choice. Please try again.');
      await displayMenu();
  }
}

// Create user with specified role
async function createUser(role) {
  console.log(`\n------ Creating ${role.toUpperCase()} User ------`);
  
  const name = await question('Enter name: ');
  const email = await question('Enter email: ');
  const password = await question('Enter password: ');
  
  let userData = {
    name,
    email,
    password,
    role
  };
  
  if (role === 'vendor') {
    const company = await question('Enter company name: ');
    userData.company = company;
    
    const requiresApproval = await question('Require login approval? (y/n): ');
    userData.requiresLoginApproval = requiresApproval.toLowerCase() === 'y';
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log(`\nUser with email ${email} already exists.`);
    } else {
      // Create the user
      const user = await User.create(userData);
      console.log('\n-------------------------------------------');
      console.log(`${role.toUpperCase()} user created successfully!`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      if (user.role === 'vendor') {
        console.log(`Company: ${user.company}`);
        console.log(`Requires Login Approval: ${user.requiresLoginApproval ? 'Yes' : 'No'}`);
      }
      console.log('-------------------------------------------');
    }
  } catch (error) {
    console.error(`Error creating ${role} user:`, error.message);
  }
  
  await displayMenu();
}

// List all users
async function listUsers() {
  console.log('\n------ User List ------');
  
  try {
    const users = await User.find().select('-password');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        if (user.role === 'vendor') {
          console.log(`   Company: ${user.company}`);
          console.log(`   Requires Login Approval: ${user.requiresLoginApproval ? 'Yes' : 'No'}`);
        }
      });
      console.log(`\nTotal users: ${users.length}`);
    }
  } catch (error) {
    console.error('Error listing users:', error.message);
  }
  
  await displayMenu();
}

// Delete user
async function deleteUser() {
  console.log('\n------ Delete User ------');
  
  const email = await question('Enter email of user to delete: ');
  
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`\nUser with email ${email} not found.`);
    } else {
      await User.deleteOne({ email });
      console.log(`\nUser ${user.name} (${user.email}) deleted successfully.`);
    }
  } catch (error) {
    console.error('Error deleting user:', error.message);
  }
  
  await displayMenu();
}

// Disconnect from database and exit
async function disconnectAndExit() {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
  }
  
  rl.close();
  console.log('Exiting program. Goodbye!');
}

// Main function
async function main() {
  const connected = await connectToDatabase();
  
  if (connected) {
    await displayMenu();
  } else {
    rl.close();
  }
}

// Start the program
main(); 