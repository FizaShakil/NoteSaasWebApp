import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, notesApi, tokenUtils, type UserData } from '../utils/api';
import Sidebar from '../components/Sidebar';
import EditNameModal from '../components/EditNameModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import NotificationModal from '../components/NotificationModal';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editNameModal, setEditNameModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ isOpen: false, type: 'success', message: '' });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchUserDetails();
    fetchTotalNotes();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await authApi.getUserDetails();
      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalNotes = async () => {
    try {
      const response = await notesApi.getTotalNotes();
      if (response.data) {
        setTotalNotes(response.data.totalNotes);
      }
    } catch (error) {
      console.error('Error fetching total notes:', error);
    }
  };

  const handleNameUpdate = async (newName: string) => {
    try {
      setUpdateLoading(true);
      // For name-only update, just send the name
      await authApi.changeUserDetails({
        name: newName
      });
      
      setUser(prev => prev ? { ...prev, name: newName } : null);
      setEditNameModal(false);
      setNotification({
        isOpen: true,
        type: 'success',
        message: 'Name updated successfully!'
      });
    } catch (error: any) {
      setNotification({
        isOpen: true,
        type: 'error',
        message: error.message || 'Failed to update name'
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordSuccess = () => {
    setNotification({
      isOpen: true,
      type: 'success',
      message: 'Password changed successfully!'
    });
  };

  const handlePasswordError = (message: string) => {
    setNotification({
      isOpen: true,
      type: 'error',
      message: message
    });
  };

  const handleSignOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear tokens and redirect, even if API call fails
      tokenUtils.clearTokens();
      navigate('/');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <nav className="text-sm text-gray-500 mb-2">
            Dashboard &gt; Profile
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Account Settings</h1>
          <p className="text-gray-600">Manage your profile information and account preferences.</p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              {/* Gradient Background */}
              <div className="h-32 bg-gradient-to-r from-orange-300 via-orange-400 to-yellow-400"></div>
              
              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex items-start -mt-16">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-6 mt-16">
                    <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div 
                    onClick={() => setEditNameModal(true)}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-900">{user?.name || 'Not set'}</span>
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <svg className="w-4 h-4 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-gray-900">{user?.email || 'Not set'}</span>
                  </div>
                </div>
              </div>

              {/* Change Password Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setChangePasswordModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6z" />
                  </svg>
                  Change Password
                </button>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Since */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">MEMBER SINCE</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.createdAt ? formatDate(user.createdAt) : 'January 12, 2023'}
                    </p>
                  </div>
                </div>

                {/* Total Notes */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">TOTAL NOTES</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {totalNotes} {totalNotes === 1 ? 'Note' : 'Notes'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="flex justify-start">
              <button 
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>

            {/* Help Link */}
            <div className="text-center mt-8">
              <p className="text-gray-500">
                Need help with your account?{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditNameModal
        isOpen={editNameModal}
        currentName={user?.name || ''}
        onClose={() => setEditNameModal(false)}
        onSave={handleNameUpdate}
        loading={updateLoading}
      />

      <ChangePasswordModal
        isOpen={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
        onSuccess={handlePasswordSuccess}
        onError={handlePasswordError}
      />

      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UserProfile;