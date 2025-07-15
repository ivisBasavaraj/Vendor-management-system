import React, { ReactNode, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ModernLoginLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  logoUrl?: string;
  userType: 'admin' | 'vendor' | 'consultant';
  showDecorations?: boolean;
}

const ModernLoginLayout: React.FC<ModernLoginLayoutProps> = ({
  children,
  title,
  subtitle,
  backgroundImage = '', // Default background
  logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/d8/IMTMA.png',
  userType,
  showDecorations = true
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        when: "beforeChildren",
        staggerChildren: 0.15,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Get color scheme based on user type
  const getColorScheme = () => {
    switch (userType) {
      case 'admin':
        return {
          primary: 'from-blue-600 to-indigo-700',
          button: 'bg-blue-600 hover:bg-blue-700',
          accent: 'border-blue-500',
          fallbackBg: 'bg-gradient-to-br from-blue-600 to-indigo-700'
        };
      case 'vendor':
        return {
          primary: 'from-green-600 to-teal-700',
          button: 'bg-green-600 hover:bg-green-700',
          accent: 'border-green-500',
          fallbackBg: 'bg-gradient-to-br from-green-600 to-teal-700'
        };
      case 'consultant':
        return {
          primary: 'from-purple-600 to-indigo-700',
          button: 'bg-purple-600 hover:bg-purple-700',
          accent: 'border-purple-500',
          fallbackBg: 'bg-gradient-to-br from-purple-600 to-indigo-700'
        };
      default:
        return {
          primary: 'from-blue-600 to-indigo-700',
          button: 'bg-blue-600 hover:bg-blue-700',
          accent: 'border-blue-500',
          fallbackBg: 'bg-gradient-to-br from-blue-600 to-indigo-700'
        };
    }
  };

  const colorScheme = getColorScheme();

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Left Panel - 3D Floor Image and Branding */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div 
          className={`absolute inset-0 bg-cover bg-center ${colorScheme.fallbackBg}`}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          {/* Overlay gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.primary} opacity-80`}></div>
          
          {/* 3D Floating Elements */}
          {showDecorations && (
            <>
              <div className="absolute top-[15%] left-[10%] w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full transform animate-float-slow"></div>
              <div className="absolute top-[35%] right-[15%] w-24 h-24 bg-white/5 backdrop-blur-sm rounded-full transform animate-float-medium"></div>
              <div className="absolute bottom-[20%] left-[20%] w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full transform animate-float-fast"></div>
              <div className="absolute top-[60%] right-[25%] w-12 h-12 bg-white/15 backdrop-blur-sm rounded-full transform animate-float-slow"></div>
            </>
          )}
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-6 lg:p-8 text-white w-full h-full">
          {/* Logos at the top-left corner */}
          <div className="flex-shrink-0 mb-8">
            <div className="flex flex-row items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 shadow-lg w-fit">
              <img 
                src={logoUrl} 
                alt="IMTMA Logo" 
                className="h-10 lg:h-12 w-auto filter drop-shadow-lg hover:scale-105 transition-transform duration-300"
                style={{ maxWidth: '120px' }}
              />
              <div className="w-px h-8 bg-white/30"></div>
              <img 
                src="https://www.biec.in/images/biec-black.png" 
                alt="BIEC Logo" 
                className="h-10 lg:h-12 w-auto filter drop-shadow-lg hover:scale-105 transition-transform duration-300"
                style={{ maxWidth: '120px' }}
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              key="left-content"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="mt-4"
            >
              <motion.h1 
                key="main-title"
                variants={itemVariants}
                className="text-2xl lg:text-3xl font-bold mb-3"
              >
                Vendor Management System 
              </motion.h1>
              <motion.p 
                key="main-subtitle"
                variants={itemVariants}
                className="text-base lg:text-lg opacity-90 mb-4"
              >
                Streamline your document workflow with our secure platform
              </motion.p>
              
              {/* Decorative Elements */}
              {showDecorations && (
                <motion.div
                  key={`decorations-${userType}`}
                  variants={itemVariants}
                  className="relative mt-6 mb-8"
                >
                  {/* User Type Specific Decorations */}
                  {userType === 'admin' && (
                    <>
                      {/* Admin-specific decorations - Dashboard & Analytics */}
                      <div className="absolute -top-4 -right-8 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform rotate-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-12 -left-6 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform -rotate-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-24 right-0 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform rotate-45 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </>
                  )}
                  
                  {userType === 'vendor' && (
                    <>
                      {/* Vendor-specific decorations - Documents & Uploads */}
                      <div className="absolute -top-4 -right-8 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform rotate-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-12 -left-6 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform -rotate-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-24 right-0 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform rotate-45 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                    </>
                  )}
                  
                  {userType === 'consultant' && (
                    <>
                      {/* Consultant-specific decorations - Reviews & Approvals */}
                      <div className="absolute -top-4 -right-8 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform rotate-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-12 -left-6 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform -rotate-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-24 right-0 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-lg shadow-xl transform rotate-45 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                        </svg>
                      </div>
                    </>
                  )}
                  
                  {/* 3D Document Stack - Common for all user types */}
                  <div className="relative h-24 w-40 mx-auto">
                    <div className="absolute bottom-0 left-0 right-0 h-20 w-full bg-white/20 backdrop-blur-md rounded-lg shadow-xl transform skew-y-6"></div>
                    <div className="absolute bottom-1 left-1 right-1 h-20 w-full bg-white/30 backdrop-blur-md rounded-lg shadow-lg transform skew-y-3"></div>
                    <div className="absolute bottom-2 left-2 right-2 h-20 w-full bg-white/40 backdrop-blur-md rounded-lg shadow-md"></div>
                  </div>
                </motion.div>
              )}
              
              <motion.div 
                key="progress-dots"
                variants={itemVariants}
                className="flex space-x-3 mt-4"
              >
                <div className="h-1 w-8 bg-white rounded-full opacity-70"></div>
                <div className="h-1 w-8 bg-white rounded-full opacity-40"></div>
                <div className="h-1 w-8 bg-white rounded-full opacity-20"></div>
              </motion.div>
            </motion.div>
          </div>
          
          <div className="flex-shrink-0 mt-4">
            <p className="text-xs opacity-80">
              ©  2025 IMTMA BIEC Vendor Management System. All rights reserved
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 lg:px-6 bg-white dark:bg-gray-900 overflow-y-auto">
        <motion.div 
          key="right-panel"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="text-center mb-4">
            <motion.h2 
              key="form-title"
              variants={itemVariants}
              className="text-2xl font-extrabold text-gray-900 dark:text-white"
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p 
                key="form-subtitle"
                variants={itemVariants}
                className="mt-1 text-xs text-gray-600 dark:text-gray-400"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          <motion.div 
            key="form-container"
            variants={itemVariants}
            className={`bg-white dark:bg-gray-800 py-4 px-4 shadow-xl rounded-xl border-t-4 ${colorScheme.accent}`}
          >
            {children}
          </motion.div>
          
          <motion.div 
            key="form-footer"
            variants={itemVariants}
            className="mt-4 text-center"
          >
            <div className="flex justify-center space-x-4 text-xs">
              <Link to="/forgot-password" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Forgot password?
              </Link>
              <span className="text-gray-400">|</span>
              <Link to="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Back to home
              </Link>
            </div>
            
            <div className="mt-3 flex justify-center space-x-3">
              <Link to="/admin/login" className={`text-xs ${userType === 'admin' ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Admin Login
              </Link>
              <Link to="/vendor/login" className={`text-xs ${userType === 'vendor' ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Vendor Login
              </Link>
              <Link to="/consultant/login" className={`text-xs ${userType === 'consultant' ? 'font-bold text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>
                Consultant Login
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default memo(ModernLoginLayout);