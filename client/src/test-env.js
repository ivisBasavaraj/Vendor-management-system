// Simple test to verify environment variables are loaded
console.log('=== Environment Variable Test ===');
console.log('REACT_APP_EMAILJS_SERVICE_ID:', process.env.REACT_APP_EMAILJS_SERVICE_ID);
console.log('REACT_APP_EMAILJS_TEMPLATE_ID:', process.env.REACT_APP_EMAILJS_TEMPLATE_ID);
console.log('REACT_APP_EMAILJS_USER_ID:', process.env.REACT_APP_EMAILJS_USER_ID ? 'SET' : 'NOT SET');
console.log('All REACT_APP_EMAILJS vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_EMAILJS')));
console.log('================================');