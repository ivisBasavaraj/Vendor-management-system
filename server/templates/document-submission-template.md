# Document Submission Notification Template

## Template ID: template_ojv7u88

This template is specifically designed for notifying consultants when vendors submit documents for review.

## EmailJS Template HTML Content

**IMPORTANT**: You must create a template in EmailJS with ID `template_ojv7u88` and copy this exact HTML content:

### Step-by-Step Setup:
1. Go to https://www.emailjs.com/
2. Login to your account
3. Go to "Email Templates"
4. Click "Create New Template"
5. Set Template ID to: `template_ojv7u88`
6. Set Template Name to: "Document Submission Notification"
7. Copy and paste this HTML content:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Submission Notification</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            line-height: 1.6;
        }
        .container {
            max-width: 650px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .notification-box {
            background-color: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .notification-box h3 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 18px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 25px 0;
        }
        .info-card {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .info-card h4 {
            margin: 0 0 12px 0;
            color: #374151;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-card p {
            margin: 0;
            color: #1f2937;
            font-size: 16px;
            font-weight: 500;
        }
        .documents-section {
            background-color: #fefefe;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
        }
        .documents-section h3 {
            margin: 0 0 20px 0;
            color: #1f2937;
            font-size: 18px;
            display: flex;
            align-items: center;
        }
        .document-count {
            background-color: #2563eb;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            margin-left: 10px;
        }
        .document-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .document-item {
            background-color: #f8fafc;
            padding: 15px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 3px solid #10b981;
            display: flex;
            align-items: center;
        }
        .document-icon {
            width: 12px;
            height: 12px;
            background-color: #10b981;
            border-radius: 50%;
            margin-right: 12px;
        }
        .action-buttons {
            text-align: center;
            margin: 30px 0;
        }
        .btn {
            display: inline-block;
            padding: 14px 28px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background-color: #2563eb;
            color: white;
        }
        .btn-primary:hover {
            background-color: #1d4ed8;
        }
        .btn-secondary {
            background-color: #6b7280;
            color: white;
        }
        .btn-secondary:hover {
            background-color: #4b5563;
        }
        .footer {
            background-color: #f9fafb;
            padding: 25px 30px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
        }
        .footer .company {
            font-weight: 600;
            color: #1f2937;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 8px;
            }
            .info-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            .content {
                padding: 20px;
            }
            .btn {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 New Document Submission</h1>
            <p>IMTMA Vendor Management System</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello {{consultant_name}},
            </div>
            
            <div class="notification-box">
                <h3>🔔 New Submission Alert</h3>
                <p>A vendor has submitted documents for your review. Please find the details below and take appropriate action.</p>
            </div>
            
            <div class="info-grid">
                <div class="info-card">
                    <h4>Vendor Information</h4>
                    <p><strong>{{vendor_name}}</strong></p>
                    <p>{{vendor_company}}</p>
                    <p>📧 {{vendor_email}}</p>
                    <p>📞 {{vendor_phone}}</p>
                </div>
                
                <div class="info-card">
                    <h4>Submission Details</h4>
                    <p><strong>ID:</strong> {{submission_id}}</p>
                    <p><strong>Period:</strong> {{upload_period}}</p>
                    <p><strong>Date:</strong> {{submission_date}}</p>
                    <p><strong>Time:</strong> {{submission_time}}</p>
                </div>
                
                <div class="info-card">
                    <h4>Agreement Details</h4>
                    <p><strong>Period:</strong> {{agreement_period}}</p>
                    <p><strong>Location:</strong> {{work_location}}</p>
                    <p><strong>Invoice:</strong> {{invoice_no}}</p>
                </div>
                
                <div class="info-card">
                    <h4>Document Summary</h4>
                    <p><strong>Total Documents:</strong> {{document_count}}</p>
                    <p><strong>Status:</strong> Pending Review</p>
                    <p><strong>Priority:</strong> Normal</p>
                </div>
            </div>
            
            <div class="documents-section">
                <h3>
                    📋 Submitted Documents
                    <span class="document-count">{{document_count}}</span>
                </h3>
                <ul class="document-list">
                    {{#document_types}}
                    <li class="document-item">
                        <div class="document-icon"></div>
                        <span>{{.}}</span>
                    </li>
                    {{/document_types}}
                </ul>
            </div>
            
            <div class="action-buttons">
                <a href="{{review_url}}" class="btn btn-primary">
                    🔍 Review Documents
                </a>
                <a href="{{dashboard_url}}" class="btn btn-secondary">
                    📊 Go to Dashboard
                </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
                <strong>Next Steps:</strong><br>
                1. Click "Review Documents" to examine each submitted file<br>
                2. Approve or reject documents with appropriate comments<br>
                3. Notify the vendor of your decision through the system
            </p>
        </div>
        
        <div class="footer">
            <p class="company">IMTMA Vendor Management System</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
            <p>For support, contact your system administrator.</p>
            <p style="margin-top: 15px; font-size: 12px;">
                © 2025 IMTMA. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
```

## Template Variables Used

The following variables are automatically populated by the system:

### Recipient Information
- `{{consultant_name}}` - Name of the assigned consultant
- `{{to_email}}` - Consultant's email address
- `{{to_name}}` - Consultant's name (same as consultant_name)

### Vendor Information
- `{{vendor_name}}` - Vendor's full name
- `{{vendor_company}}` - Vendor's company name
- `{{vendor_email}}` - Vendor's email address
- `{{vendor_phone}}` - Vendor's phone number

### Submission Details
- `{{submission_id}}` - Unique submission identifier (e.g., SUB-2025-Jan-ABC123)
- `{{submission_date}}` - Date when documents were submitted (formatted)
- `{{submission_time}}` - Time when documents were submitted (formatted)
- `{{upload_period}}` - Period for which documents are submitted (e.g., "Jan 2025")

### Agreement & Work Information
- `{{agreement_period}}` - Contract agreement period
- `{{work_location}}` - Work location (default: "IMTMA, Bengaluru")
- `{{invoice_no}}` - Invoice number associated with the submission

### Document Information
- `{{document_count}}` - Total number of documents submitted
- `{{document_types}}` - Array of document types (for iteration in template)
- `{{document_list}}` - Comma-separated list of document types

### System URLs
- `{{review_url}}` - Direct link to review the submission
- `{{dashboard_url}}` - Link to consultant dashboard

### Email Metadata
- `{{subject}}` - Email subject line
- `{{email_type}}` - Set to "document_submission_notification"

## Setup Instructions

1. **Login to EmailJS Dashboard**
   - Go to https://www.emailjs.com/
   - Login to your account

2. **Create/Edit Template**
   - Navigate to Email Templates
   - Find template with ID: `template_ojv7u88`
   - If it doesn't exist, create a new template with this ID

3. **Copy Template Content**
   - Copy the entire HTML content above
   - Paste it into the EmailJS template editor

4. **Configure Template Settings**
   - Set template name: "Document Submission Notification"
   - Ensure template ID is: `template_ojv7u88`
   - Save the template

5. **Test the Template**
   - Use EmailJS test feature to verify variables render correctly
   - Check email formatting in different email clients

## Environment Variables Required

Ensure these are set in your server's `.env` file:

```env
EMAILJS_SERVICE_ID=service_pmod9cv
EMAILJS_TEMPLATE_ID=template_ojv7u88
EMAILJS_PUBLIC_KEY=tvqapjUgFzWLxpwN9
EMAILJS_PRIVATE_KEY=your_private_key_here
CLIENT_URL=http://localhost:3000
```

## Testing

To test the email functionality:

1. Create a vendor account
2. Upload documents as the vendor
3. Submit the documents for review
4. Check that the consultant receives the notification email
5. Verify all variables are populated correctly
6. Test the review and dashboard links

## Troubleshooting

### Common Issues:
- **Variables not showing**: Check variable names match exactly
- **Email not sending**: Verify EmailJS credentials and template ID
- **Formatting issues**: Test in different email clients
- **Links not working**: Ensure CLIENT_URL is set correctly

### Debug Steps:
1. Check server logs for EmailJS responses
2. Verify template ID matches in code and EmailJS dashboard
3. Test with EmailJS playground first
4. Ensure all required environment variables are set