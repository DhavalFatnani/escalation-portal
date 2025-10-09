import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff, Key, Shield, ArrowLeft } from 'lucide-react';
import { userService } from '../services/userService';
import { useAuthStore } from '../stores/authStore';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-lg w-full">
        {/* Back Button */}
        {!user?.must_change_password && (
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
        )}

        <div className="glass rounded-3xl shadow-xl-colored p-8 md:p-10 animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-lg mb-4">
              <Key className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user?.must_change_password ? '🔐 Set Your Password' : 'Change Password'}
            </h1>
            <p className="text-gray-600">
              {user?.must_change_password 
                ? 'Set a new secure password to continue'
                : 'Update your account password'}
            </p>
          </div>

          {/* Warning for first-time users */}
          {user?.must_change_password && (
            <div className="mb-6 p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl animate-slide-in-right">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    First-time Login Detected
                  </p>
                  <p className="text-xs text-yellow-800">
                    For security, you must set a new password before accessing your account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl flex items-start animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <span className="text-sm text-red-700 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div className="animate-slide-in-right" style={{ animationDelay: '100ms' }}>
              <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                {user?.must_change_password ? 'Temporary Password' : 'Current Password'} 
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="currentPassword"
                  type={showPassword.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                  placeholder={user?.must_change_password ? "Enter your temporary password" : "Enter current password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="animate-slide-in-right" style={{ animationDelay: '200ms' }}>
              <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="newPassword"
                  type={showPassword.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {strength && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Strength:</span>
                    <span className={`text-xs font-bold uppercase tracking-wide ${
                      strength.label === 'Weak' ? 'text-red-600' :
                      strength.label === 'Fair' ? 'text-yellow-600' :
                      strength.label === 'Good' ? 'text-green-600' :
                      'text-green-700'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-500 ease-out`}
                      style={{ 
                        width: strength.label === 'Weak' ? '25%' :
                               strength.label === 'Fair' ? '50%' :
                               strength.label === 'Good' ? '75%' : '100%'
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Requirements Checklist */}
              <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Password Requirements:</p>
                <ul className="space-y-1.5">
                  <PasswordRequirement met={formData.newPassword.length >= 8} text="At least 8 characters" />
                  <PasswordRequirement met={/[A-Z]/.test(formData.newPassword)} text="One uppercase letter" />
                  <PasswordRequirement met={/[a-z]/.test(formData.newPassword)} text="One lowercase letter" />
                  <PasswordRequirement met={/[0-9]/.test(formData.newPassword)} text="One number" />
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="animate-slide-in-right" style={{ animationDelay: '300ms' }}>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white text-gray-900 placeholder-gray-400 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <div className="mt-2 flex items-center text-sm text-green-600 font-medium animate-slide-in-right">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Passwords match!
                </div>
              )}
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <div className="mt-2 flex items-center text-sm text-red-600 font-medium animate-slide-in-right">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Passwords don't match
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-slide-in-right"
              style={{ animationDelay: '400ms' }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Changing Password...
                </span>
              ) : (
                <>
                  {user?.must_change_password ? '🔓 Set Password & Continue' : '✓ Change Password'}
                </>
              )}
            </button>
          </form>

          {/* Security Tip */}
          <div className="mt-8 p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 animate-slide-in-right" style={{ animationDelay: '500ms' }}>
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-900 mb-1">💡 Security Tip</p>
                <p className="text-xs text-green-800">
                  Use a unique password you don't use anywhere else. Consider using a password manager to generate and store strong passwords securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Password Requirement Component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className="flex items-center text-xs">
      {met ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-600 mr-2 flex-shrink-0" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 mr-2 flex-shrink-0" />
      )}
      <span className={met ? 'text-green-700 font-medium' : 'text-gray-600'}>{text}</span>
    </li>
  );
}
