// Test script to check consultant upload functionality
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testConsultantUpload() {
  try {
    // First, let's test if we can get all submissions
    console.log('Testing getAllSubmissions endpoint...');
    const response = await axios.get('http://localhost:5000/api/document-submissions/admin/all', {
      params: {
        uploadedByConsultant: true
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.length > 0) {
      console.log(`Found ${response.data.data.length} consultant-uploaded submissions`);
      response.data.data.forEach((submission, index) => {
        console.log(`Submission ${index + 1}:`);
        console.log(`  ID: ${submission._id}`);
        console.log(`  Vendor: ${submission.vendor?.name || submission.vendor?.company || 'Unknown'}`);
        console.log(`  Consultant: ${submission.consultant?.name || 'Unknown'}`);
        console.log(`  Upload Period: ${submission.uploadPeriod?.month} ${submission.uploadPeriod?.year}`);
        console.log(`  Documents: ${submission.documents?.length || 0}`);
        console.log(`  Uploaded by Consultant: ${submission.uploadedByConsultant}`);
        console.log('---');
      });
    } else {
      console.log('No consultant-uploaded submissions found');
    }
    
  } catch (error) {
    console.error('Error testing consultant upload:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testConsultantUpload();