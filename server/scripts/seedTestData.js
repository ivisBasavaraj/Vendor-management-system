const mongoose = require('mongoose');
const User = require('../models/user.model');
const Document = require('../models/document.model');
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

// Seed test data
const seedTestData = async () => {
  try {
    console.log('Starting to seed test data...');

    // Create test consultants
    const consultants = [
      {
        name: 'John Smith',
        email: 'john.smith@consultant.com',
        password: await bcrypt.hash('password123', 10),
        role: 'consultant',
        isActive: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@consultant.com',
        password: await bcrypt.hash('password123', 10),
        role: 'consultant',
        isActive: true
      }
    ];

    // Insert consultants
    const createdConsultants = await User.insertMany(consultants);
    console.log(`Created ${createdConsultants.length} consultants`);

    // Create test vendors
    const vendors = [
      {
        name: 'ABC Supplies',
        email: 'contact@abcsupplies.com',
        password: await bcrypt.hash('password123', 10),
        role: 'vendor',
        company: 'ABC Supplies Ltd.',
        vendorId: 'VND001',
        assignedConsultant: createdConsultants[0]._id,
        isActive: true
      },
      {
        name: 'XYZ Manufacturing',
        email: 'info@xyzmanufacturing.com',
        password: await bcrypt.hash('password123', 10),
        role: 'vendor',
        company: 'XYZ Manufacturing Inc.',
        vendorId: 'VND002',
        assignedConsultant: createdConsultants[1]._id,
        isActive: true
      },
      {
        name: 'Global Logistics',
        email: 'admin@globallogistics.com',
        password: await bcrypt.hash('password123', 10),
        role: 'vendor',
        company: 'Global Logistics Corp.',
        vendorId: 'VND003',
        assignedConsultant: createdConsultants[0]._id,
        isActive: true
      },
      {
        name: 'Tech Solutions',
        email: 'support@techsolutions.com',
        password: await bcrypt.hash('password123', 10),
        role: 'vendor',
        company: 'Tech Solutions Ltd.',
        vendorId: 'VND004',
        assignedConsultant: createdConsultants[1]._id,
        isActive: true
      },
      {
        name: 'Industrial Parts',
        email: 'orders@industrialparts.com',
        password: await bcrypt.hash('password123', 10),
        role: 'vendor',
        company: 'Industrial Parts Co.',
        vendorId: 'VND005',
        assignedConsultant: createdConsultants[0]._id,
        isActive: true
      }
    ];

    // Insert vendors
    const createdVendors = await User.insertMany(vendors);
    console.log(`Created ${createdVendors.length} vendors`);

    // Create test documents
    const documents = [
      // Recent compliance document for ABC Supplies
      {
        title: 'Quality Certificate 2024',
        description: 'Annual quality compliance certificate',
        vendor: createdVendors[0]._id,
        vendorName: createdVendors[0].name,
        companyName: createdVendors[0].company,
        documentType: 'compliance',
        status: 'approved',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        files: [{
          path: '/uploads/quality-cert-abc.pdf',
          originalName: 'quality-certificate.pdf',
          mimeType: 'application/pdf',
          size: 1024000
        }]
      },
      // Old compliance document for XYZ Manufacturing
      {
        title: 'Compliance Certificate 2023',
        description: 'Previous year compliance certificate',
        vendor: createdVendors[1]._id,
        vendorName: createdVendors[1].name,
        companyName: createdVendors[1].company,
        documentType: 'compliance',
        status: 'approved',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        files: [{
          path: '/uploads/compliance-cert-xyz.pdf',
          originalName: 'compliance-certificate.pdf',
          mimeType: 'application/pdf',
          size: 2048000
        }]
      },
      // Recent compliance document for Global Logistics
      {
        title: 'Quality Assurance Certificate',
        description: 'Current quality assurance compliance',
        vendor: createdVendors[2]._id,
        vendorName: createdVendors[2].name,
        companyName: createdVendors[2].company,
        documentType: 'compliance',
        status: 'approved',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        files: [{
          path: '/uploads/qa-cert-global.pdf',
          originalName: 'qa-certificate.pdf',
          mimeType: 'application/pdf',
          size: 1536000
        }]
      },
      // Very old compliance document for Industrial Parts
      {
        title: 'Old Compliance Document',
        description: 'Outdated compliance certificate',
        vendor: createdVendors[4]._id,
        vendorName: createdVendors[4].name,
        companyName: createdVendors[4].company,
        documentType: 'compliance',
        status: 'approved',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        files: [{
          path: '/uploads/old-compliance-industrial.pdf',
          originalName: 'old-compliance.pdf',
          mimeType: 'application/pdf',
          size: 1024000
        }]
      },
      // Non-compliance document for Tech Solutions (no compliance docs)
      {
        title: 'Technical Specification',
        description: 'Technical documentation',
        vendor: createdVendors[3]._id,
        vendorName: createdVendors[3].name,
        companyName: createdVendors[3].company,
        documentType: 'technical',
        status: 'approved',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        files: [{
          path: '/uploads/tech-spec-tech.pdf',
          originalName: 'tech-specification.pdf',
          mimeType: 'application/pdf',
          size: 3072000
        }]
      }
    ];

    // Insert documents
    const createdDocuments = await Document.insertMany(documents);
    console.log(`Created ${createdDocuments.length} documents`);

    console.log('Test data seeded successfully!');
    console.log('Summary:');
    console.log(`- ${createdConsultants.length} consultants created`);
    console.log(`- ${createdVendors.length} vendors created`);
    console.log(`- ${createdDocuments.length} documents created`);

  } catch (error) {
    console.error('Error seeding test data:', error);
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedTestData();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

runSeed();