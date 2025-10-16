import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { User, Mail, Shield, Calendar, Key, ArrowLeft, CheckCircle, Camera, Edit2, Save, X } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

export default function UserProfilePage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Please log in to view your profile</p>
      </div>
    );
  }

  // Mutations
  const uploadPictureMutation = useMutation({
    mutationFn: userService.updateProfilePicture,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setUploadingImage(false);
      showSuccess('Profile Picture Updated', 'Your profile picture has been updated successfully!');
    },
    onError: (error: any) => {
      setUploadingImage(false);
      showError('Upload Failed', error.response?.data?.error || 'Failed to upload profile picture');
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: userService.updateName,
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditingName(false);
      showSuccess('Name Updated', 'Your name has been updated successfully!');
    },
    onError: (error: any) => {
      showError('Update Failed', error.response?.data?.error || 'Failed to update name');
    },
  });

  // Handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('File Too Large', 'Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      uploadPictureMutation.mutate(base64String);
    };
    reader.onerror = () => {
      setUploadingImage(false);
      showError('Read Error', 'Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    if (!editedName.trim()) {
      showError('Validation Error', 'Name cannot be empty');
      return;
    }
    updateNameMutation.mutate(editedName.trim());
  };

  const handleCancelEdit = () => {
    setEditedName(user?.name || '');
    setIsEditingName(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white';
      case 'ops':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white';
      case 'growth':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Profile Avatar with Upload */}
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden">
                {user.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-white">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {/* Upload Button Overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute inset-0 w-24 h-24 rounded-2xl bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                title="Change profile picture"
              >
                {uploadingImage ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.name || 'User'}</h1>
              <p className="text-indigo-100 text-lg mb-3">{user.email}</p>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getRoleBadgeColor(user.role)} shadow-lg`}>
                  <Shield className="w-4 h-4 inline mr-1.5" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Security
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="w-6 h-6 mr-3 text-indigo-600" />
            Profile Information
          </h2>

          <div className="space-y-6">
            {/* Name - Editable */}
            <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={updateNameMutation.isPending}
                      className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={updateNameMutation.isPending}
                      className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-gray-900 flex-1">{user.name || 'Not set'}</p>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Edit name"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                <p className="text-base font-semibold text-gray-900">{user.email}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 font-medium">Verified</span>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Role & Permissions</p>
                <p className="text-base font-semibold text-gray-900 capitalize mb-2">{user.role}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.role === 'admin' && (
                    <>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">Full Access</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">User Management</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">System Settings</span>
                    </>
                  )}
                  {user.role === 'ops' && (
                    <>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">Process Tickets</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">Add Resolutions</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">Manage Attachments</span>
                    </>
                  )}
                  {user.role === 'growth' && (
                    <>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">Create Tickets</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">Reopen Tickets</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md font-medium">Accept & Close</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Member Since</p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Key className="w-6 h-6 mr-3 text-indigo-600" />
            Security Settings
          </h2>

          <div className="space-y-6">
            {/* Change Password */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Key className="w-5 h-5 mr-2 text-indigo-600" />
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Update your password to keep your account secure. Choose a strong password with at least 8 characters.
                  </p>
                  <button
                    onClick={() => navigate('/change-password')}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Account Security Info */}
            <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Password protected</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Email verified</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Active session</span>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-yellow-600" />
                Security Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Use a unique password that you don't use on other websites</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Change your password regularly to maintain security</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Never share your password with anyone</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-600 mr-2">•</span>
                  <span>Log out from shared or public computers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal System */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </div>
  );
}

