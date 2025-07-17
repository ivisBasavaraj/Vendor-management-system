// Debug script to test navigation
// Run this in browser console to test navigation

console.log('Testing navigation...');
console.log('Current location:', window.location.pathname);

// Test direct navigation
const testId = '6875e2388370b2bdb855bef1';
const testPath = `/admin/vendors/${testId}`;

console.log('Testing navigation to:', testPath);

// Method 1: Using window.location
console.log('Method 1: window.location');
// window.location.href = testPath;

// Method 2: Using history API  
console.log('Method 2: history.pushState');
// window.history.pushState(null, '', testPath);

// Method 3: Check if React Router is available
console.log('Method 3: React Router');
if (window.React) {
  console.log('React is available');
} else {
  console.log('React is not available in window');
}

// Method 4: Simulate click on link
console.log('Method 4: Simulate click on existing link');
const links = document.querySelectorAll(`a[href="${testPath}"]`);
console.log('Found links:', links.length);
links.forEach((link, index) => {
  console.log(`Link ${index}:`, link);
});

// Method 5: Check for form interference
console.log('Method 5: Check for forms');
const forms = document.querySelectorAll('form');
console.log('Found forms:', forms.length);

// Method 6: Check for event listeners
console.log('Method 6: Check for event listeners');
const buttons = document.querySelectorAll('button');
console.log('Found buttons:', buttons.length);

console.log('Debug completed. Check network tab for any failed requests.');