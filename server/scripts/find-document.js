/**
 * Script to find a document by ID across all collections in the database
 * 
 * Usage: 
 * 1. Make sure MongoDB connection string is correct in .env file
 * 2. Run with: node scripts/find-document.js <documentId>
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Document ID to search for
const documentId = process.argv[2] || '684dd0b1e762c58795112b32';

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management';

console.log(`Searching for document with ID: ${documentId}`);
console.log(`Using MongoDB connection: ${MONGO_URI}`);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all collection names in the database
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`Found ${collections.length} collections in the database`);
      
      let documentFound = false;
      
      // Search each collection for the document ID
      for (const collection of collections) {
        const collectionName = collection.name;
        console.log(`Searching in collection: ${collectionName}`);
        
        try {
          // Try to find the document by its ID
          const result = await mongoose.connection.db.collection(collectionName).findOne({
            $or: [
              { _id: mongoose.Types.ObjectId(documentId) },  // Search by _id
              { 'documents._id': mongoose.Types.ObjectId(documentId) },  // Search in documents array
              { 'files._id': mongoose.Types.ObjectId(documentId) }  // Search in files array
            ]
          });
          
          if (result) {
            console.log(`✅ DOCUMENT FOUND in collection: ${collectionName}`);
            console.log('Document data:', JSON.stringify(result, null, 2));
            documentFound = true;
          }
        } catch (err) {
          console.error(`Error searching in collection ${collectionName}:`, err.message);
        }
      }
      
      if (!documentFound) {
        console.log(`❌ Document with ID ${documentId} was not found in any collection`);
        console.log('Possible reasons:');
        console.log('1. The document has been deleted');
        console.log('2. The document ID is incorrect');
        console.log('3. The document is in a different database');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      // Close the MongoDB connection
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });