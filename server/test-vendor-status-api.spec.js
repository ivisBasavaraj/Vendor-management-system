// Integration-like tests for vendor-status endpoint logic
// These scripts run against a dev DB and exercise the controller logic indirectly
// Uses direct model calls and controller function simulation where useful

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user.model');
const DocumentSubmission = require('./models/documentSubmission.model');
const Document = require('./models/document.model');

async function run() {
  // Connect
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vendor-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    console.log('=== vendor-status API checks ===');

    // 1) Invalid vendorId format should be rejected (400 in API)
    const invalidIds = ['abc', '123', 'not-an-objectid', '68b000ac85a3f42eb56e2b5a'];
    for (const id of invalidIds) {
      const isValid = mongoose.Types.ObjectId.isValid(id);
      console.log(`[invalid vendorId check] ${id} -> valid? ${isValid}`);
    }

    // 2) Month normalization map sanity checks
    const monthMap = {
      'january': 'Jan', 'jan': 'Jan', '1': 'Jan', '01': 'Jan',
      'february': 'Feb', 'feb': 'Feb', '2': 'Feb', '02': 'Feb',
      'march': 'Mar', 'mar': 'Mar', '3': 'Mar', '03': 'Mar',
      'april': 'Apr', 'apr': 'Apr', '4': 'Apr', '04': 'Apr',
      'may': 'May', '5': 'May', '05': 'May',
      'june': 'Jun', 'jun': 'Jun', '6': 'Jun', '06': 'Jun',
      'july': 'Jul', 'jul': 'Jul', '7': 'Jul', '07': 'Jul',
      'august': 'Aug', 'aug': 'Aug', '8': 'Aug', '08': 'Aug',
      'september': 'Sep', 'sep': 'Sep', '9': 'Sep', '09': 'Sep',
      'october': 'Oct', 'oct': 'Oct', '10': 'Oct',
      'november': 'Nov', 'nov': 'Nov', '11': 'Nov',
      'december': 'Dec', 'dec': 'Dec', '12': 'Dec'
    };

    const tests = ['January', 'JAN', '1', '01', 'feb', '02', 'Dec', '12'];
    for (const m of tests) {
      const key = String(m).toLowerCase();
      const normalized = monthMap[key] || m;
      console.log(`[month normalize] ${m} -> ${normalized}`);
    }

    // 3) Empty documents handling: ensure no crash when documents missing
    const anyVendor = await User.findOne({ role: 'vendor' });
    if (!anyVendor) {
      console.log('No vendor in DB to run empty-docs check. Skipping.');
    } else {
      // Create a lightweight submission with no documents array
      const y = 2025; const mon = 'Jan';
      const sub = new DocumentSubmission({
        submissionId: `TEST-${Date.now()}`,
        vendor: anyVendor._id,
        uploadPeriod: { year: y, month: mon },
        consultant: { name: 'Test', email: 'test@example.com' },
        workLocation: 'IMTMA, Bengaluru',
        invoiceNo: 'INV-TEST-001',
        documents: null, // intentionally null to simulate edge
      });
      await sub.save();

      const fetched = await DocumentSubmission.findById(sub._id);
      const docs = Array.isArray(fetched.documents) ? fetched.documents : [];
      console.log(`[empty docs safe] fetched docs length -> ${docs.length}`);

      // cleanup
      await DocumentSubmission.deleteOne({ _id: sub._id });
    }

    console.log('Completed checks. Note: These are harness logs; API 400/200 would be asserted in supertest/Jest.');
  } catch (e) {
    console.error('Test runner error:', e);
  } finally {
    await mongoose.connection.close();
  }
}

run();