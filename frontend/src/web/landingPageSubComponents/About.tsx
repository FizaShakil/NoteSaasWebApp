import React from 'react';

const About: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">About NOTESAAS</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're revolutionizing the way people take notes, organize thoughts, and collaborate on ideas.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 mb-6">
              To empower individuals and teams with the most intuitive and powerful note-taking 
              platform that enhances productivity and creativity.
            </p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose Us?</h3>
            <ul className="text-gray-600 space-y-2">
              <li>• Seamless cross-platform synchronization</li>
              <li>• Advanced collaboration features</li>
              <li>• Enterprise-grade security</li>
              <li>• Intuitive user interface</li>
            </ul>
          </div>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">1M+</div>
            <div className="text-gray-600 mb-4">Active Users</div>
            <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-600 mb-4">Uptime</div>
            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;