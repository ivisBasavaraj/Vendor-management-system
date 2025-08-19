import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAdminLogin = () => navigate('/admin/login');
  const handleVendorLogin = () => navigate('/vendor/login');
  const handleConsultantLogin = () => navigate('/consultant/login');

  return (
    <div className="h-screen max-h-screen bg-white flex flex-col overflow-hidden">
      {/* Header Section */}
      <header className="flex-shrink-0 w-full pt-0 pb-2 sm:pb-3 lg:pb-4 px-6 sm:px-8 lg:px-12 min-h-fit max-h-[30vh]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            {/* Left Side - Logos */}
            <div className="flex items-center justify-center sm:justify-start space-x-6 sm:space-x-8">
              {/* IMTMA Logo */}
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src="/images/IMTMA.jpg"
                  alt="IMTMA Logo"
                  className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-60 lg:h-60 xl:w-64 xl:h-64 object-contain max-h-[30vh]"
                  loading="lazy"
                />
              </motion.div>

              {/* BIEC Logo */}
        
            </div>

            {/* Right Side - Navigation Buttons */}
            <motion.div
              className="flex items-center space-x-3 sm:space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={handleVendorLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center text-xs sm:text-sm whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                VENDOR
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </motion.button>

              <motion.button
                onClick={handleConsultantLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center text-xs sm:text-sm whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                CONSULTANT
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </motion.button>

              <motion.button
                onClick={handleAdminLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center text-xs sm:text-sm whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ADMIN
                <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-12 min-h-0 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center h-full">
            {/* Left Side - Content */}
            <motion.div
              className="text-center lg:text-left order-2 lg:order-1"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
            >
              <motion.h1
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                VENDOR MANAGEMENT SYSTEM
              </motion.h1>

              <motion.p
                className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-3 sm:mb-4 lg:mb-6 leading-relaxed max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Streamline your document workflows with our intelligent platform.
                Automate approvals, track compliance, and manage vendors with ease.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                
              </motion.div>
            </motion.div>

            {/* Right Side - Large Document Image */}
            <motion.div
              className="flex justify-center lg:justify-end order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-full max-w-lg sm:max-w-xl lg:max-w-2xl xl:max-w-3xl h-full flex items-center">
                <motion.div
                  className="relative w-full"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src="/images/File.png"
                    alt="Document Management System"
                    className="w-full h-auto object-contain drop-shadow-xl"
                    style={{ 
                      maxHeight: '60vh',
                      minHeight: '250px'
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex-shrink-0 w-full py-3 sm:py-4 px-6 sm:px-8 lg:px-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <p className="text-gray-600 text-xs sm:text-sm lg:text-base">
              © 2025 IMTMA. ALL RIGHTS RESERVED.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
