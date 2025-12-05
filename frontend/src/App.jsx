import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AdminLoginPage from './components/AdminLoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminDashboardDebug from './components/AdminDashboardDebug';
import AdminErrorBoundary from './components/AdminErrorBoundary';
import SettingsPage from './components/SettingsPage';
import SupportPage from './components/SupportPage';
import ProtectedRoute from './components/ProtectedRoute';
import KYCProtectedRoute from './components/KYCProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminTest from './components/AdminTest';
import WithdrawalPage from './components/withdrawals/WithdrawalPage';
import WithdrawalHistory from './components/withdrawals/WithdrawalHistory';
import AdminWithdrawalsPage from './components/admin/AdminWithdrawalsPage';
import './App.css';
import './styles/banking.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/test" element={<AdminTest />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/support" 
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/withdrawals/new" 
            element={
              <ProtectedRoute>
                <KYCProtectedRoute>
                  <WithdrawalPage />
                </KYCProtectedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/withdrawals/history" 
            element={
              <ProtectedRoute>
                <KYCProtectedRoute>
                  <WithdrawalHistory />
                </KYCProtectedRoute>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminErrorBoundary>
                <AdminDashboard />
              </AdminErrorBoundary>
            } 
          />
          <Route 
            path="/admin/withdrawals" 
            element={
              <AdminProtectedRoute>
                <AdminWithdrawalsPage />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/debug" 
            element={
              <AdminDashboardDebug />
            } 
          />
          <Route 
            path="/admin/dashboard-full" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
