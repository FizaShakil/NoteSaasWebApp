import React from 'react';
import { Link } from 'react-router-dom';

const BackToHomeButton: React.FC = () => {
  return (
    <div className='w-40 mb-3'>
    <Link
      to="/"
      className="top-6 left-6 z-10 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Home
    </Link>
    </div>
  );
};

export default BackToHomeButton;