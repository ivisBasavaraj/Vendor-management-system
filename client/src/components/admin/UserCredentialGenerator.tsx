import React, { useState } from 'react';
import apiService from '../../utils/api';

interface UserCredentialGeneratorProps {
  role: 'vendor' | 'consultant';
  onUserCreated?: () => void;
}

const UserCredentialGenerator: React.FC<UserCredentialGeneratorProps> = ({ role, onUserCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Generate a random secure password
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    setGeneratedPassword(password);
  };

  // Clear form
  const clearForm = () => {
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setAddress('');
    setGeneratedPassword('');
    setMessage({ type: '', text: '' });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !generatedPassword) {
      setMessage({ 
        type: 'error', 
        text: 'Please provide name, email, and generate a password' 
      });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Register the user with generated credentials
      await apiService.auth.register({
        name,
        email,
        password: generatedPassword,
        role,
        company,
        phone,
        address,
        requiresLoginApproval: role === 'vendor' // Only vendors require login approval
      });
      
      // Send credentials email (we'll need to add this endpoint to the API service)
      try {
        await apiService.users.sendCredentials(email, {
          name,
          email,
          password: generatedPassword,
          role,
          loginUrl: `${window.location.origin}/${role}/login`
        });
      } catch (emailError) {
        console.error('Failed to send credentials email:', emailError);
        // Continue even if email sending fails
      }
      
      setMessage({ 
        type: 'success', 
        text: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!` 
      });
      
      // Clear form after successful submission
      clearForm();
      
      // Notify parent component that a user was created
      if (onUserCreated) {
        onUserCreated();
      }
    } catch (err: any) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to create user account' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Generate {role.charAt(0).toUpperCase() + role.slice(1)} Credentials
      </h2>
      
      {message.text && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
            : 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company
            </label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated Password
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="password"
                value={generatedPassword}
                readOnly
                className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white dark:hover:bg-gray-500"
              >
                Generate
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={clearForm}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-700 dark:hover:bg-primary-600"
            >
              {loading ? 'Creating...' : 'Create & Send Credentials'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserCredentialGenerator;
