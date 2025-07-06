# EmailJS Template Configuration Guide

This guide will help you set up the EmailJS template to work with all the different email types in the Vendor Management System.

## EmailJS Template Setup

### 1. Create a Service
- Go to https://www.emailjs.com/
- Create an account and add a service (e.g., Gmail, Outlook, SendGrid)
- Note your Service ID: `service_5oxyeaa`

### 2. Create a Template
- Create a new template with Template ID: `template_yajf9hf`
- Use the template HTML below

### 3. Get User ID
- Go to your EmailJS account settings
- Copy your User ID (Public Key)

## HTML Template for EmailJS

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .content { line-height: 1.6; color: #333; }
        .status-approved { color: #059669; font-weight: bold; }
        .status-rejected { color: #dc2626; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
        .document-list { background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .document-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .credentials { background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Vendor Management System</div>
            <h2>{{subject}}</h2>
        </div>
        
        <div class="content">
            <p>Dear {{to_name}},</p>
            
            <!-- Vendor Welcome Email -->
            {{#email_type == 'vendor_welcome'}}
            <p>Welcome to the Vendor Management System! Your account has been created successfully.</p>
            
            <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> {{vendor_email}}</p>
                <p><strong>Temporary Password:</strong> {{vendor_password}}</p>
                <p><strong>Company:</strong> {{company_name}}</p>
            </div>
            
            <p>Your assigned consultant is <strong>{{consultant_name}}</strong> ({{consultant_email}}).</p>
            
            <p>Please log in and change your password as soon as possible.</p>
            <a href="{{login_url}}" class="button">Login to Your Account</a>
            {{/email_type}}
            
            <!-- Consultant Vendor Assignment -->
            {{#email_type == 'consultant_vendor_assignment'}}
            <p>A new vendor has been assigned to you for consultation and document review.</p>
            
            <div class="document-list">
                <h3>Vendor Details:</h3>
                <p><strong>Name:</strong> {{vendor_name}}</p>
                <p><strong>Email:</strong> {{vendor_email}}</p>
                <p><strong>Company:</strong> {{vendor_company}}</p>
                <p><strong>Phone:</strong> {{vendor_phone}}</p>
                <p><strong>Address:</strong> {{vendor_address}}</p>
                <p><strong>Assignment Date:</strong> {{assignment_date}}</p>
            </div>
            
            <p>Please reach out to the vendor to begin the onboarding process.</p>
            {{/email_type}}
            
            <!-- Document Upload Confirmation -->
            {{#email_type == 'document_upload_confirmation'}}
            <p>Your document has been uploaded successfully and is now pending review.</p>
            
            <div class="document-list">
                <h3>Document Details:</h3>
                <p><strong>Title:</strong> {{document_title}}</p>
                <p><strong>Type:</strong> {{document_type}}</p>
                <p><strong>Upload Date:</strong> {{upload_date}} at {{upload_time}}</p>
                <p><strong>Status:</strong> {{status}}</p>
                <p><strong>Document ID:</strong> {{document_id}}</p>
            </div>
            
            <p>{{next_steps}}</p>
            {{/email_type}}
            
            <!-- Document Review Notification -->
            {{#email_type == 'document_review_notification'}}
            <p>A new document has been submitted for your review.</p>
            
            <div class="document-list">
                <h3>Document Details:</h3>
                <p><strong>Vendor:</strong> {{vendor_name}} ({{vendor_company}})</p>
                <p><strong>Document Title:</strong> {{document_title}}</p>
                <p><strong>Document Type:</strong> {{document_type}}</p>
                <p><strong>Upload Date:</strong> {{upload_date}} at {{upload_time}}</p>
                <p><strong>Document ID:</strong> {{document_id}}</p>
            </div>
            
            <p>Please review this document at your earliest convenience.</p>
            <a href="{{review_url}}" class="button">Review Document</a>
            {{/email_type}}
            
            <!-- Document Review Result -->
            {{#email_type == 'document_review_result'}}
            <p>Your document has been reviewed by {{consultant_name}}.</p>
            
            <div class="document-list">
                <h3>Review Details:</h3>
                <p><strong>Document Title:</strong> {{document_title}}</p>
                <p><strong>Document Type:</strong> {{document_type}}</p>
                <p><strong>Status:</strong> <span class="status-{{status_color}}">{{status}}</span></p>
                <p><strong>Review Date:</strong> {{review_date}} at {{review_time}}</p>
                <p><strong>Reviewer:</strong> {{consultant_name}}</p>
            </div>
            
            {{#review_comments}}
            <div class="document-list">
                <h3>Review Comments:</h3>
                <p>{{review_comments}}</p>
            </div>
            {{/review_comments}}
            
            <p>{{next_steps}}</p>
            <a href="{{document_url}}" class="button">View Document</a>
            {{/email_type}}
            
            <!-- Vendor Reminder -->
            {{#email_type == 'vendor_reminder'}}
            <p>This is a reminder that you have {{pending_count}} pending document(s) that require your attention.</p>
            
            <div class="document-list">
                <h3>Pending Documents:</h3>
                {{#pending_documents}}
                <div class="document-item">
                    <p><strong>{{title}}</strong> ({{type}})</p>
                    <p>Status: {{status}} | Days Pending: {{days_pending}}</p>
                </div>
                {{/pending_documents}}
            </div>
            
            <p>Please log in to your dashboard to take action on these documents.</p>
            <a href="{{dashboard_url}}" class="button">Go to Dashboard</a>
            {{/email_type}}
            
            <!-- Custom Notification -->
            {{#email_type == 'custom_notification'}}
            <p>{{message}}</p>
            {{/email_type}}
            
            <!-- Test Email -->
            {{#email_type == 'test'}}
            <p>{{message}}</p>
            <p>If you're receiving this email, your EmailJS configuration is working correctly!</p>
            {{/email_type}}
        </div>
        
        <div class="footer">
            <p>This email was sent from the Vendor Management System.</p>
            <p>If you have any questions, please contact your system administrator.</p>
            <p>Sent on {{sent_date}} at {{sent_time}}</p>
        </div>
    </div>
</body>
</html>
```

## Template Variables

The template uses the following variables that are automatically populated:

### Common Variables
- `{{subject}}` - Email subject line
- `{{to_name}}` - Recipient's name
- `{{to_email}}` - Recipient's email
- `{{email_type}}` - Type of email being sent
- `{{sent_date}}` - Date email was sent
- `{{sent_time}}` - Time email was sent

### Vendor Welcome Email
- `{{vendor_name}}` - Vendor's name
- `{{vendor_email}}` - Vendor's email
- `{{vendor_password}}` - Generated password
- `{{company_name}}` - Vendor's company
- `{{consultant_name}}` - Assigned consultant name
- `{{consultant_email}}` - Assigned consultant email
- `{{login_url}}` - Login page URL

### Document Upload/Review
- `{{document_title}}` - Document title
- `{{document_type}}` - Type of document
- `{{upload_date}}` - Upload date
- `{{upload_time}}` - Upload time
- `{{document_id}}` - Document ID
- `{{status}}` - Document status
- `{{review_comments}}` - Consultant's comments
- `{{consultant_name}}` - Reviewer's name

### Vendor Reminders
- `{{pending_count}}` - Number of pending documents
- `{{pending_documents}}` - Array of pending documents
- `{{dashboard_url}}` - Dashboard URL

## Environment Variables

Set these in your `.env` files:

### Server (.env)
```
EMAILJS_SERVICE_ID=service_5oxyeaa
EMAILJS_TEMPLATE_ID=template_yajf9hf
EMAILJS_USER_ID=your_user_id_here
CLIENT_URL=http://localhost:3000
```

### Client (.env)
```
REACT_APP_EMAILJS_SERVICE_ID=service_5oxyeaa
REACT_APP_EMAILJS_TEMPLATE_ID=template_yajf9hf
REACT_APP_EMAILJS_USER_ID=your_user_id_here
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLIENT_URL=http://localhost:3000
```

## CORS Configuration

For localhost development, ensure CORS is properly configured in your server:

```javascript
// In your server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

## Testing

1. Start your development server
2. Check the browser console for EmailJS initialization messages
3. Create a test vendor to verify welcome emails
4. Upload a test document to verify upload notifications
5. Review a document to verify review result emails

## Troubleshooting

### Common Issues:
1. **Email not sending**: Check your User ID and service configuration
2. **Template not rendering**: Verify template ID and variable names
3. **CORS errors**: Ensure localhost is allowed in EmailJS dashboard
4. **Variables not showing**: Check template variable syntax and EmailJS template editor

### Debug Steps:
1. Enable console logging to see EmailJS responses
2. Test with EmailJS playground first
3. Verify all environment variables are set
4. Check EmailJS dashboard for delivery status