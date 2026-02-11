import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './web/LandingPage';
import LoginPage from './web/LoginPage';
import SignupPage from './web/SignupPage';
import ForgotPasswordPage from './web/ForgotPasswordPage';
import ResetPasswordPage from './web/ResetPasswordPage';
import Dashboard from './dashboard/Dashboard';
import UserProfile from './dashboard/UserProfile';
import NoteEditor from './dashboard/NoteEditor';
import AuthGuard from './components/AuthGuard';
import PublicRoute from './components/PublicRoute';
import './App.css';
import Footer from './web/Footer';

function AppContent() {
  const location = useLocation();
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  // Add/remove body class for dashboard pages
  React.useEffect(() => {
    if (isDashboardPage) {
      document.body.classList.add('dashboard-mode');
    } else {
      document.body.classList.remove('dashboard-mode');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dashboard-mode');
    };
  }, [isDashboardPage]);

  return (
    <div className={`App ${isDashboardPage ? 'dashboard-layout' : ''}`}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={
          <AuthGuard>
            <Dashboard />
          </AuthGuard>
        } />
        <Route path="/dashboard/profile" element={
          <AuthGuard>
            <UserProfile />
          </AuthGuard>
        } />
        <Route path="/dashboard/create-note" element={
          <AuthGuard>
            <NoteEditor />
          </AuthGuard>
        } />
        <Route path="/dashboard/edit-note/:id" element={
          <AuthGuard>
            <NoteEditor />
          </AuthGuard>
        } />
      </Routes>
      {!isDashboardPage && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;