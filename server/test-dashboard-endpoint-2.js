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

async function testDashboardEndpointWithDocumentModel() {
  try {
    console.log('🧪 Testing Vendor Dashboard with Document Model...\n');

    // Find a vendor that has documents in the Document model
    const vendors = await User.find({ role: 'vendor' });
    let testVendor = null;

    for (const vendor of vendors) {
      const docCount = await Document.countDocuments({ vendor: vendor._id });
      if (docCount > 0) {
        testVendor = vendor;
        break;
      }
    }

    if (!testVendor) {
      console.log('❌ No vendors with documents in Document model found');
      return;
    }

    console.log(`✅ Testing with vendor: ${testVendor.name} (${testVendor._id})`);

    // Mock the request with the vendor user
    mockReq.user = {
      _id: testVendor._id,
      name: testVendor.name,
      role: testVendor.role
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

testDashboardEndpointWithDocumentModel();