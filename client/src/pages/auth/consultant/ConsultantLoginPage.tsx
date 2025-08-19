import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import ModernLoginLayout from '../../../components/auth/ModernLoginLayout';
import MathCaptcha from '../../../components/auth/MathCaptcha';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

const ConsultantLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const { login, error, clearError, loading, setError } = useAuth();
  const navigate = useNavigate();

  // Handle captcha validation
  const handleCaptchaValidation = (isValid: boolean) => {
    setIsCaptchaVerified(isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Check if captcha is verified
    if (!isCaptchaVerified) {
      setError('Please complete the security check');
      return;
    }
    
    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Consultant login successful, navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Consultant login error:', err);
      // The error will be set by the AuthContext
    }
  };

  return (
    <ModernLoginLayout
      title="Consultant Login"
      subtitle="Access your consultant portal to review and approve documents"
      backgroundImage=""
      userType="consultant"
      showDecorations={true}
    >
      {error && (
        <div className="mb-3 bg-red-50 border-l-4 border-red-500 p-3 dark:bg-red-900/30 dark:border-red-500" role="alert">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded dark:border-gray-700"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password?returnTo=consultant"
              className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        
        {/* Math Captcha */}
        <MathCaptcha onValidationChange={handleCaptchaValidation} />

        <div>
          <button
            type="submit"
            disabled={loading || !isCaptchaVerified}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-purple-700 dark:hover:bg-purple-600"
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p>Don't have an account? Contact your administrator to get access.</p>
        </div>
      </form>
    </ModernLoginLayout>
  );
};

export default ConsultantLoginPage;
