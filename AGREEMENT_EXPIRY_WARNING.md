# Agreement Expiry Warning Feature

## Overview
This feature adds a warning system to alert vendors when their agreement period is about to expire within the next 30 days. The warning appears on the document submission page (`/documents/submit`) to ensure vendors are aware of upcoming expiry dates.

## Implementation Details

### 1. Agreement Period Parsing
The system parses the `agreementPeriod` field (stored as a string) from the user model to extract contract duration:

**Supported Agreement Period Formats:**
- "Annual Contract" or "Yearly Contract" → 12 months
- "2 Year Contract" → 24 months
- "3 Year Contract" → 36 months
- "6 Month Contract" → 6 months
- "18 Month Contract" → 18 months
- "Permanent" or "Indefinite" → No expiry warning
- Custom formats with numbers (e.g., "5 Year Contract") → Automatically parsed

### 2. End Date Calculation
The system calculates the agreement end date by:
1. Taking the user's `createdAt` timestamp (when the account was created)
2. Adding the parsed duration in months
3. Generating the final expiry date

### 3. Warning Logic
- **Warning Threshold:** 30 days before expiry
- **Warning Conditions:**
  - Days remaining ≤ 30 AND days remaining > 0
  - Valid end date exists (not permanent contracts)

### 4. User Interface Elements

#### A. Warning Banner (Top of Form)
- **Location:** Top of the document submission form
- **Style:** Red background with warning icon
- **Content:** 
  - "Agreement Expiring Soon!" heading
  - Days remaining until expiry
  - Expiry date in readable format
  - "Contact Consultant Now" button with pre-filled email

#### B. Agreement Period Field Enhancement
- **Visual Indicator:** Red border and background when expiring
- **Icon:** Warning triangle icon in the input field
- **Detailed Warning Box:** Shows below the field with:
  - Expiry countdown
  - Contact consultant message
  - Direct email link to consultant

#### C. Contact Integration
- **Email Links:** Pre-filled with:
  - Subject: "Agreement Renewal Request" or "Urgent: Agreement Renewal Request"
  - Body: Pre-written message with expiry date
  - Recipient: Assigned consultant's email

### 5. Code Structure

#### Key Functions:
```typescript
// Parse agreement period string and calculate end date
parseAgreementPeriod(agreementPeriod: string, createdAt: string)

// Check if agreement is expiring within 30 days
checkAgreementExpiry(agreementPeriod: string, createdAt: string)

// Test function for development
testExpiryWarning(days: number)
```

#### State Management:
```typescript
const [agreementExpiryWarning, setAgreementExpiryWarning] = useState<{
  isExpiring: boolean;
  daysRemaining: number;
  endDate: Date | null;
}>({
  isExpiring: false,
  daysRemaining: 0,
  endDate: null
});
```

### 6. Testing

#### External Test Suite
A separate test file `test-agreement-expiry.js` is available to validate the expiry logic:
- **Test 5 Days:** Shows urgent warning
- **Test 15 Days:** Shows moderate warning  
- **Test 30 Days:** Shows boundary case
- **Test 60 Days:** No warning (beyond threshold)
- **Test Expired:** Shows expired state

Run the test with: `node test-agreement-expiry.js`

#### Manual Testing Steps:
1. Navigate to `/documents/submit`
2. Use development test buttons to simulate different scenarios
3. Verify warning appearance and styling
4. Test email links functionality
5. Check responsive design on mobile devices

### 7. Files Modified

#### Frontend:
- `client/src/components/vendor/DocumentSubmissionForm.tsx`
  - Added expiry warning logic
  - Enhanced UI with warning elements
  - Added contact consultant functionality

#### Backend:
- No backend changes required (uses existing user model fields)

### 8. Future Enhancements

#### Potential Improvements:
1. **Email Notifications:** Automated email reminders
2. **Admin Dashboard:** Expiry tracking for all vendors
3. **Bulk Renewal:** Admin tools for bulk contract renewals
4. **Grace Period:** Configurable warning thresholds
5. **Contract History:** Track renewal history

#### Database Schema Enhancement:
Consider adding dedicated date fields to the user model:
```javascript
contractStartDate: {
  type: Date,
  required: true
},
contractEndDate: {
  type: Date,
  required: true
},
renewalHistory: [{
  previousEndDate: Date,
  newEndDate: Date,
  renewedBy: { type: ObjectId, ref: 'User' },
  renewedAt: Date
}]
```

### 9. Security Considerations

- **Email Links:** Pre-filled but user can modify before sending
- **Data Validation:** Client-side validation for date calculations
- **User Permissions:** Only vendors see their own expiry warnings
- **No Sensitive Data:** No sensitive information in URL parameters

### 10. Browser Compatibility

- **Email Links:** Uses `mailto:` protocol (universally supported)
- **Date Formatting:** Uses `toLocaleDateString()` for localization
- **CSS:** Modern CSS with fallbacks for older browsers
- **Icons:** Heroicons for consistent iconography

## Usage Instructions

### For Vendors:
1. Log in to the system
2. Navigate to "Upload Documents" (`/documents/submit`)
3. If your agreement is expiring within 30 days, you'll see:
   - Red warning banner at the top
   - Red-highlighted agreement period field
   - Contact consultant buttons
4. Click "Contact Consultant Now" to send an email request
5. Follow up with your consultant for renewal process

### For Consultants:
1. Monitor for urgent renewal emails from vendors
2. Assist vendors with renewal documentation
3. Coordinate with administrators for contract updates
4. Update vendor records after renewal completion

### For Administrators:
1. Monitor system logs for expiry warnings
2. Update agreement periods after renewals
3. Consider adding proper contract start/end dates
4. Review and approve renewal requests

## Troubleshooting

### Common Issues:
1. **Warning not appearing:** Check user's `agreementPeriod` and `createdAt` fields
2. **Email not working:** Verify consultant email is set in user profile
3. **Incorrect dates:** Check system date calculation logic
4. **Style issues:** Verify Tailwind CSS classes are available

### Debug Information:
Check browser console for debug logs:
```javascript
console.log('Agreement expiry check result:', {
  agreementPeriod: userData.agreementPeriod,
  createdAt: userData.createdAt,
  endDate: expiryInfo.endDate,
  isExpiring: expiryInfo.isExpiring,
  daysRemaining: expiryInfo.daysRemaining
});
```