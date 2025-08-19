/**
 * EmailJS Configuration
 * Fallback configuration if environment variables don't work properly
 */

export const emailjsConfig = {
  serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_5oxyeaa',
  templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_yajf9hf',
  userId: process.env.REACT_APP_EMAILJS_USER_ID || 'o3dwpHGpHKdlNsieC' // Fallback to your actual User ID
};

// Debug function to check configuration
export const debugEmailjsConfig = () => {
  console.log('🔧 EmailJS Configuration Debug:');
  console.log('Service ID:', emailjsConfig.serviceId);
  console.log('Template ID:', emailjsConfig.templateId);
  console.log('User ID:', emailjsConfig.userId ? 'CONFIGURED' : 'MISSING');
  console.log('Environment variables:', {
    REACT_APP_EMAILJS_SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'NOT SET',
    REACT_APP_EMAILJS_TEMPLATE_ID: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'NOT SET',
    REACT_APP_EMAILJS_USER_ID: process.env.REACT_APP_EMAILJS_USER_ID ? 'SET' : 'NOT SET'
  });
};

export default emailjsConfig;