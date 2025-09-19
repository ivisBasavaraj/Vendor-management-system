const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/user.model');
const Document = require('./models/document.model');
const DocumentSubmission = require('./models/documentSubmission.model');

// Mock request object
const mockReq = {
  user: null
};

// Mock response object
const mockRes = {
  status: function(code) {
    console.log(`Response status: ${code}`);
    return {
      json: function(data) {
        console.log('Response data:', JSON.stringify(data, null, 2));
      }
    };
  }
};

async function testDashboardEndpoint() {
  try {
    console.log('🧪 Testing Vendor Dashboard Endpoint Logic...\n');

    // Find a vendor to test with
    const vendor = await User.findOne({ role: 'vendor' });
    if (!vendor) {
      console.log('❌ No vendors found in database');
      return;
    }

    console.log(`✅ Testing with vendor: ${vendor.name} (${vendor._id})`);

    // Mock the request with the vendor user
    mockReq.user = {
      _id: vendor._id,
      name: vendor.name,
      role: vendor.role
    };

    // Import the dashboard controller
    const dashboardController = require('./controllers/dashboard.controller');

    // Test the getVendorDashboard function
    console.log('\n📊 Calling getVendorDashboard function...');
    await dashboardController.getVendorDashboard(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    mongoose.connection.close();
  }
}

testDashboardEndpoint();