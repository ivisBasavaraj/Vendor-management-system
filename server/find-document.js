/**
 * Script to find a document by ID across specific collections
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Document ID to search for
const documentId = '684dd0b1e762c58795112b32';

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vendor-management';

console.log(`Searching for document with ID: ${documentId}`);
console.log(`Using MongoDB connection: ${MONGO_URI}`);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Collections to search based on the application code
      const collectionsToSearch = [
        'documents',
        'documentsubmissions',
        'users',
        'workflows'
      ];
      
      let documentFound = false;
      
      // Search each collection for the document ID
      for (const collectionName of collectionsToSearch) {
        console.log(`Searching in collection: ${collectionName}`);
        
        try {
          // Try to find the document by its ID
          const result = await mongoose.connection.db.collection(collectionName).findOne({
            $or: [
              { _id: new mongoose.Types.ObjectId(documentId) },  // Search by _id
              { 'documents._id': new mongoose.Types.ObjectId(documentId) },  // Search in documents array
              { 'files._id': new mongoose.Types.ObjectId(documentId) }  // Search in files array
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
        console.log('3. The document is in a different collection');
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