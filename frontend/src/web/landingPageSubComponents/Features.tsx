import React from 'react';

const Features: React.FC = () => {
  const features = [
    {
      icon: '📝',
      title: 'Rich Text Editor',
      description: 'Create beautiful notes with our advanced rich text editor supporting markdown, tables, and media.'
    },
    {
      icon: '🔄',
      title: 'Real-time Sync',
      description: 'Access your notes from anywhere with instant synchronization across all your devices.'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Share and collaborate on notes with your team members in real-time.'
    },
    {
      icon: '🔍',
      title: 'Powerful Search',
      description: 'Find any note instantly with our advanced search and tagging system.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure with enterprise-grade security measures.'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Take notes on the go with our responsive design and mobile apps.'
    }
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Powerful Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to take your note-taking to the next level
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;