const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/user.model');
const DocModel = require('./models/document.model');

async function testConsultantEndpoint() {
  try {
    console.log('=== TESTING CONSULTANT ENDPOINT LOGIC ===');
    
    // Find Pooja (the consultant with assigned vendors)
    const consultant = await User.findOne({ 
      email: 'pooja@gmail.com',
      role: 'consultant' 
    });
    
    if (!consultant) {
      console.log('Consultant Pooja not found');
      return;
    }
    
    console.log('Found consultant:', {
      id: consultant._id,
      name: consultant.name,
      email: consultant.email
    });
    
    // Find vendors assigned to this consultant
    const vendors = await User.find({ 
      role: 'vendor',
      assignedConsultant: consultant._id
    })
    .select('-password')
    .populate('assignedConsultant', 'name email')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${vendors.length} assigned vendors:`);
    
    // Add analytics data for each vendor
    const vendorsWithAnalytics = await Promise.all(vendors.map(async (vendor) => {
      const vendorObj = vendor.toObject();
      
      console.log(`\nProcessing vendor: ${vendor.name} (${vendor._id})`);
      
      try {
        // Get document counts from the Document model
        const totalDocuments = await DocModel.countDocuments({ vendor: vendor._id });
        const approvedDocuments = await DocModel.countDocuments({ 
          vendor: vendor._id,
          status: { $in: ['approved', 'consultant_approved', 'final_approved'] }
        });
        const pendingDocuments = await DocModel.countDocuments({ 
          vendor: vendor._id,
          status: { $in: ['pending', 'under_review'] }
        });
        const rejectedDocuments = await DocModel.countDocuments({ 
          vendor: vendor._id,
          status: { $in: ['rejected', 'consultant_rejected', 'final_rejected'] }
        });
        
        // Calculate compliance rate
        const complianceRate = totalDocuments > 0 
          ? Math.round((approvedDocuments / totalDocuments) * 100) 
          : 0;
        
        // Get last activity date
        const latestDocument = await DocModel.findOne({ vendor: vendor._id })
          .sort({ updatedAt: -1 })
          .select('updatedAt');
        
        vendorObj.analytics = {
          totalDocuments,
          approvedDocuments,
          pendingDocuments,
          rejectedDocuments,
          complianceRate,
          lastActivity: latestDocument ? latestDocument.updatedAt : vendor.createdAt
        };
        
        console.log(`Analytics for vendor ${vendor.name}:`, vendorObj.analytics);
        
        // Also show the actual documents
        const docs = await DocModel.find({ vendor: vendor._id }).select('title status createdAt');
        console.log(`Documents for ${vendor.name}:`, docs.map(d => ({
          title: d.title,
          status: d.status,
          created: d.createdAt
        })));
        
      } catch (err) {
        console.error(`Error getting analytics for vendor ${vendor._id}:`, err);
        vendorObj.analytics = {
          totalDocuments: 0,
          approvedDocuments: 0,
          pendingDocuments: 0,
          rejectedDocuments: 0,
          complianceRate: 0,
          lastActivity: vendor.createdAt
        };
      }
      
      return vendorObj;
    }));
    
    console.log('\n=== FINAL RESULT ===');
    console.log('Vendors with analytics:', vendorsWithAnalytics.map(v => ({
      name: v.name,
      email: v.email,
      analytics: v.analytics
    })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testConsultantEndpoint();