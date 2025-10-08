import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { userService } from '../services/userService';
import { useAuthStore } from '../stores/authStore';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.currentPassword) {
      setError('Please enter your current password');
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      await userService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      // Show success message
      alert('Password changed successfully! Please log in with your new password.');
      
      // Logout and redirect to login
      logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const password = formData.newPassword;
    if (!password) return null;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'bg-red-500' };
    if (strength === 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength === 4) return { label: 'Good', color: 'bg-green-500' };
    return { label: 'Strong', color: 'bg-green-600' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Change Your Password
            </h1>
            <p className="text-sm text-gray-600">
              {user?.must_change_password 
                ? 'You must change your password before continuing'
                : 'Create a new secure password'}
            </p>
          </div>

          {/* Warning for first-time users */}
          {user?.must_change_password && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ First-time login detected.</strong> For security reasons, you must change your temporary password.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter temporary password"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
              {strength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-medium ${
                      strength.label === 'Weak' ? 'text-red-600' :
                      strength.label === 'Fair' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ 
                        width: strength.label === 'Weak' ? '25%' :
                               strength.label === 'Fair' ? '50%' :
                               strength.label === 'Good' ? '75%' : '100%'
                      }}
                    />
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                At least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <div className="mt-1 flex items-center text-xs text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Passwords match
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Use a password manager to generate and store a strong, unique password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
