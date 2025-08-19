import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import MathCaptcha from '../../components/auth/MathCaptcha';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  ExclamationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const { login, error, clearError, isAuthenticated, pendingLoginApproval, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Get the intended location from state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      // The AuthContext login function now handles the redirection
      // This is just a fallback in case the user navigates directly to the login page
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // If there's a pending login approval, redirect to the waiting page
  useEffect(() => {
    if (pendingLoginApproval) {
      navigate(`/login-status/${pendingLoginApproval.id}`, { replace: true });
    }
  }, [pendingLoginApproval, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Basic validation
    if (!email || !password) {
      return;
    }

    // Check if captcha is verified
    if (!isCaptchaVerified) {
      setError('Please complete the security check');
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();
      
      const result = await login(email, password);
      
      // If login requires approval, redirect to waiting screen
      if (result.success && result.requiresApproval && result.loginApprovalId) {
        navigate(`/login-status/${result.loginApprovalId}`, { replace: true });
      }
      
      // If login successful without approval, navigate will happen in the useEffect
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle captcha validation
  const handleCaptchaValidation = (isValid: boolean) => {
    setIsCaptchaVerified(isValid);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-900 dark:to-primary-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-0 left-0 p-4 sm:p-6">
        <Link to="/" className="flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span>Back to home</span>
        </Link>
      </div>
    
      <motion.div 
        className="sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png" 
            alt="IMTMA Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Please contact an administrator if you need an account
        </p>
      </motion.div>

      <motion.div 
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white dark:bg-neutral-800 py-8 px-4 shadow-card sm:rounded-xl sm:px-10 border border-neutral-200 dark:border-neutral-700">
          {error && (
            <motion.div 
              className="mb-4 bg-danger-50 dark:bg-danger-900/30 border-l-4 border-danger-500 p-4 rounded-md"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-danger-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              leftIcon={<LockClosedIcon className="h-5 w-5" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded dark:border-neutral-600 dark:bg-neutral-700"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-700 dark:text-neutral-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  Forgot your password?
                </Link>
              </div>
            </div>
            
            {/* Math Captcha */}
            <MathCaptcha onValidationChange={handleCaptchaValidation} />

            <div>
              <Button
                type="submit"
                isLoading={isSubmitting}
                variant="primary"
                fullWidth
                disabled={!isCaptchaVerified}
              >
                Sign in
              </Button>
            </div>
          </form>

          {/* Registration section removed - only admins can create users */}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-600 dark:text-neutral-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage; 