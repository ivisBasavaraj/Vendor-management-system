# Document Submission Email Notification Setup

This guide will help you set up EmailJS to send automatic email notifications to consultants when vendors submit documents.

## 🎯 What's Implemented

When a vendor submits documents for review, the assigned consultant will automatically receive an email notification containing:

- **Vendor Information**: Name, company, email, phone
- **Submission Details**: Submission ID, date, time, period
- **Agreement Information**: Contract period, work location, invoice number
- **Document List**: All submitted document types
- **Action Buttons**: Direct links to review documents and dashboard

## 📧 EmailJS Template Setup

### Step 1: Access EmailJS Dashboard
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Login to your EmailJS account
3. Navigate to **Email Templates**

### Step 2: Create/Update Template
1. Look for template with ID: `template_ojv7u88`
2. If it doesn't exist, create a new template with this exact ID
3. Copy the HTML content from `server/templates/document-submission-template.md`
4. Paste it into the EmailJS template editor
5. Save the template

### Step 3: Verify Template Variables
Ensure these variables are properly configured in your template:
- `{{consultant_name}}` - Consultant's name
- `{{vendor_name}}` - Vendor's name  
- `{{vendor_company}}` - Vendor's company
- `{{submission_id}}` - Unique submission ID
- `{{document_count}}` - Number of documents
- `{{document_types}}` - List of document types
- `{{review_url}}` - Link to review documents
- `{{dashboard_url}}` - Link to dashboard

## 🔧 Environment Configuration

### Server Environment Variables
Ensure these are set in your `server/.env` file:

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=service_pmod9cv
EMAILJS_TEMPLATE_ID=template_ojv7u88
EMAILJS_PUBLIC_KEY=tvqapjUgFzWLxpwN9
EMAILJS_PRIVATE_KEY=your_private_key_here

# Client URL for links in emails
CLIENT_URL=http://localhost:3000
```

### Getting Your Private Key
1. Go to EmailJS Dashboard → Account
2. Copy your **Private Key** (different from Public Key)
3. Add it to your `.env` file as `EMAILJS_PRIVATE_KEY`

## 🧪 Testing the Implementation

### Method 1: Use Test Script
```bash
# Run the test script
node test-document-submission-email.js
```

This will:
- Check all environment variables
- Send a test email with mock data
- Show detailed results and troubleshooting info

### Method 2: Manual Testing
1. Create a vendor account in your system
2. Login as the vendor
3. Upload some documents
4. Submit the documents for review
5. Check that the consultant receives the email notification

## 📋 Code Changes Made

### 1. Enhanced Email Service (`server/utils/emailService.js`)
- Added `sendDocumentSubmissionNotification()` function
- Handles template variable mapping
- Includes fallback to SMTP if EmailJS fails
- Comprehensive error handling and logging

### 2. Updated Document Submission Controller (`server/controllers/documentSubmission.controller.js`)
- Modified `submitForReview()` function
- Added email notification after successful submission
- Finds appropriate consultant (assigned or any available)
- Includes vendor and submission data retrieval

### 3. Template Content (`server/templates/document-submission-template.md`)
- Professional HTML email template
- Responsive design for mobile devices
- All required template variables
- Action buttons for consultant workflow

## 🔍 How It Works

1. **Vendor Submits Documents**: Vendor uploads and submits documents through the system
2. **System Processing**: `submitForReview()` function processes the submission
3. **Data Gathering**: System retrieves vendor, consultant, and submission details
4. **Email Generation**: EmailJS template is populated with submission data
5. **Email Delivery**: Notification is sent to the assigned consultant
6. **Consultant Action**: Consultant receives email and can click to review documents

## 🛠️ Troubleshooting

### Email Not Sending
- ✅ Check EmailJS credentials in `.env` file
- ✅ Verify template ID matches: `template_ojv7u88`
- ✅ Ensure EmailJS service is active
- ✅ Check server logs for error messages

### Template Variables Not Showing
- ✅ Verify variable names match exactly (case-sensitive)
- ✅ Check template syntax in EmailJS editor
- ✅ Test template with EmailJS playground

### Links Not Working
- ✅ Ensure `CLIENT_URL` is set correctly in `.env`
- ✅ Check that frontend routes exist for review and dashboard
- ✅ Verify URL formatting in template

### Consultant Not Receiving Emails
- ✅ Check spam/junk folder
- ✅ Verify consultant email address is correct
- ✅ Ensure consultant exists in database
- ✅ Check EmailJS delivery logs

## 📊 Email Template Preview

The email includes:

```
📄 New Document Submission
IMTMA Vendor Management System

Hello [Consultant Name],

🔔 New Submission Alert
A vendor has submitted documents for your review...

[Vendor Info Card] [Submission Details Card]
[Agreement Details] [Document Summary]

📋 Submitted Documents (5)
• Invoice (January_Invoice_2025.pdf)
• Form T Muster Roll (Muster_Roll_Jan_2025.xlsx)
• Bank Statement (Bank_Statement_Jan_2025.pdf)
• ECR (ECR_January_2025.xlsx)
• PF Combined Challan (PF_Challan_Jan_2025.pdf)

[🔍 Review Documents] [📊 Go to Dashboard]

Next Steps:
1. Click "Review Documents" to examine each file
2. Approve or reject with appropriate comments
3. Notify vendor through the system
```

## 🚀 Next Steps

1. **Setup EmailJS Template**: Copy the HTML template to EmailJS
2. **Configure Environment**: Set all required environment variables
3. **Test Implementation**: Run the test script or manual test
4. **Monitor Delivery**: Check EmailJS dashboard for delivery status
5. **Train Users**: Inform consultants about the new notification system

## 📞 Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Use the test script to diagnose problems
3. Verify EmailJS dashboard for delivery status
4. Ensure all environment variables are correctly set

The implementation includes comprehensive error handling and fallback mechanisms to ensure reliable email delivery.