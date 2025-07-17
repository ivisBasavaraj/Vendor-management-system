import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const NavigationTest: React.FC = () => {
  const navigate = useNavigate();
  const testVendorId = '6875e2388370b2bdb855bef1';

  const handleButtonClick = () => {
    console.log('Button clicked, navigating to:', `/admin/vendors/${testVendorId}`);
    navigate(`/admin/vendors/${testVendorId}`);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    console.log('Link clicked');
    e.preventDefault();
    navigate(`/admin/vendors/${testVendorId}`);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-4">Navigation Test</h3>
      <div className="space-y-4">
        <div>
          <button 
            onClick={handleButtonClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Navigate via Button
          </button>
        </div>
        <div>
          <Link 
            to={`/admin/vendors/${testVendorId}`}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
          >
            Navigate via Link
          </Link>
        </div>
        <div>
          <Link 
            to={`/admin/vendors/${testVendorId}`}
            onClick={handleLinkClick}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block"
          >
            Navigate via Link + preventDefault
          </Link>
        </div>
        <div>
          <a 
            href={`/admin/vendors/${testVendorId}`}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 inline-block"
          >
            Navigate via Regular Link
          </a>
        </div>
      </div>
    </div>
  );
};

export default NavigationTest;