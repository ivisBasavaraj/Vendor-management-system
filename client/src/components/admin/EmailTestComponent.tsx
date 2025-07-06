import React, { useState } from 'react';
import clientEmailService from '../../utils/emailService';

interface EmailTestProps {
  onClose?: () => void;
}

const EmailTestComponent: React.FC<EmailTestProps> = ({ onClose }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [testEmail, setTestEmail] = useState('');

  const runEmailTests = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    setTesting(true);
    setResults([]);

    const testResults = [];

    // Test 1: Configuration Test
    try {
      const configTest = await clientEmailService.testConfiguration();
      testResults.push({
        test: 'Configuration Test',
        success: configTest.success,
        message: configTest.message,
        error: configTest.error
      });
    } catch (error: any) {
      testResults.push({
        test: 'Configuration Test',
        success: false,
        message: 'Failed to test configuration',
        error: error.message
      });
    }

    // Test 2: Vendor Welcome Email
    try {
      const welcomeTest = await clientEmailService.sendVendorWelcomeEmail({
        to_email: testEmail,
        to_name: 'Test Vendor',
        vendor_name: 'Test Vendor',
        vendor_email: testEmail,
        vendor_password: 'temp123456',
        company_name: 'Test Company Ltd',
        consultant_name: 'Test Consultant',
        consultant_email: 'consultant@test.com',
        login_url: window.location.origin + '/login',
        subject: 'Welcome to Vendor Management System - Test Email'
      });

      testResults.push({
        test: 'Vendor Welcome Email',
        success: welcomeTest.success,
        message: welcomeTest.message,
        error: welcomeTest.error
      });
    } catch (error: any) {
      testResults.push({
        test: 'Vendor Welcome Email',
        success: false,
        message: 'Failed to send welcome email',
        error: error.message
      });
    }

    // Test 3: Document Upload Confirmation
    try {
      const uploadTest = await clientEmailService.sendDocumentUploadConfirmationEmail({
        to_email: testEmail,
        to_name: 'Test Vendor',
        vendor_name: 'Test Vendor',
        document_title: 'Test Document',
        document_type: 'Contract',
        upload_date: new Date().toLocaleDateString(),
        upload_time: new Date().toLocaleTimeString(),
        document_id: 'test-doc-123',
        status: 'Successfully Uploaded',
        subject: 'Document Upload Confirmation - Test Email'
      });

      testResults.push({
        test: 'Document Upload Confirmation',
        success: uploadTest.success,
        message: uploadTest.message,
        error: uploadTest.error
      });
    } catch (error: any) {
      testResults.push({
        test: 'Document Upload Confirmation',
        success: false,
        message: 'Failed to send upload confirmation',
        error: error.message
      });
    }

    // Test 4: Document Review Result
    try {
      const reviewTest = await clientEmailService.sendDocumentReviewResultEmail({
        to_email: testEmail,
        to_name: 'Test Vendor',
        vendor_name: 'Test Vendor',
        document_title: 'Test Document',
        document_type: 'Contract',
        status: 'Approved',
        status_color: 'green',
        consultant_name: 'Test Consultant',
        review_date: new Date().toLocaleDateString(),
        review_time: new Date().toLocaleTimeString(),
        review_comments: 'Document looks good and meets all requirements.',
        next_steps: 'Your document has been successfully approved and is now part of your compliance record.',
        document_url: window.location.origin + '/documents/test-doc-123',
        subject: 'Document Approved - Test Email'
      });

      testResults.push({
        test: 'Document Review Result',
        success: reviewTest.success,
        message: reviewTest.message,
        error: reviewTest.error
      });
    } catch (error: any) {
      testResults.push({
        test: 'Document Review Result',
        success: false,
        message: 'Failed to send review result',
        error: error.message
      });
    }

    // Test 5: Custom Email
    try {
      const customTest = await clientEmailService.sendCustomEmail({
        to_email: testEmail,
        to_name: 'Test User',
        subject: 'Custom Test Email',
        message: 'This is a custom test email sent from the Vendor Management System email testing component.',
        additional_info: 'All email types are working correctly!'
      });

      testResults.push({
        test: 'Custom Email',
        success: customTest.success,
        message: customTest.message,
        error: customTest.error
      });
    } catch (error: any) {
      testResults.push({
        test: 'Custom Email',
        success: false,
        message: 'Failed to send custom email',
        error: error.message
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">EmailJS Test Suite</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email to receive test emails"
          />
        </div>

        <div className="mb-6">
          <button
            onClick={runEmailTests}
            disabled={testing || !testEmail}
            className={`px-6 py-3 rounded-md font-medium ${
              testing || !testEmail
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {testing ? 'Running Tests...' : 'Run Email Tests'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{result.test}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.success ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.error && (
                  <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
                    Error: {result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Configuration Status</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>
              Service ID: {clientEmailService.isReady() ? '✅ Configured' : '❌ Missing'}
            </p>
            <p>
              Template ID: {clientEmailService.isReady() ? '✅ Configured' : '❌ Missing'}
            </p>
            <p>
              User ID: {clientEmailService.isReady() ? '✅ Configured' : '❌ Missing'}
            </p>
          </div>
          {!clientEmailService.isReady() && (
            <p className="text-sm text-red-600 mt-2">
              Please check your environment variables and make sure EmailJS is properly configured.
            </p>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Usage Instructions</h4>
          <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
            <li>Enter your email address in the field above</li>
            <li>Click "Run Email Tests" to send test emails for all email types</li>
            <li>Check your email inbox for the test messages</li>
            <li>Verify that all email types are formatted correctly</li>
            <li>Check the test results above for any configuration issues</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default EmailTestComponent;