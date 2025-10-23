import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/userService';
import { adminService } from '../services/adminService';
import { Plus, Trash2, AlertCircle, Copy, Check, Users, Shield, Mail, UserCircle, Clock, Crown } from 'lucide-react';
import { useModal } from '../hooks/useModal';
import Modal from '../components/Modal';

export default function UsersManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { modalState, hideModal, showSuccess, showError, showDelete } = useModal();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'growth' as 'growth' | 'ops' | 'admin',
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdUserEmail, setCreatedUserEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen animate-scale-in">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAllUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setGeneratedPassword(data.temporaryPassword);
      setCreatedUserEmail(data.user.email);
      setFormData({ name: '', email: '', role: 'growth' });
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('User Deleted', 'User has been successfully deleted from the system.');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      const errorDetails = err.response?.data?.details || '';
      showError('Delete Failed', `${errorMessage}\n\n${errorDetails}`);
    },
  });

  const toggleManagerMutation = useMutation({
    mutationFn: ({ userId, isManager }: { userId: string; isManager: boolean }) =>
      adminService.toggleManagerStatus(userId, isManager),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSuccess('Manager Status Updated', data.message);
    },
    onError: (err: any) => {
      showError('Update Failed', err.response?.data?.error || 'Failed to update manager status');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address');
      return;
    }

    createUserMutation.mutate(formData);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setGeneratedPassword('');
    setCreatedUserEmail('');
    setFormData({ name: '', email: '', role: 'growth' });
    setError('');
    setCopied(false);
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'ops': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
      case 'growth': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const handleShowDeleteConfirm = (userId: string, userName: string) => {
    showDelete(
      'Delete User',
      `Are you sure you want to delete ${userName}?\n\nThis action cannot be undone and will remove:\n- User account\n- All user data\n- Access permissions`,
      () => {
        deleteUserMutation.mutate(userId);
        hideModal();
      },
      'Delete User',
      'Cancel'
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 animate-pulse">
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-600" />
            <span className="text-gradient">User Management</span>
          </h1>
          <p className="text-sm text-gray-600">Create and manage user accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create User
        </button>
      </div>

      {/* Users by Team Sections */}
      <div className="space-y-8">
        {/* Admin Team */}
        {(() => {
          const adminUsers = usersData?.users.filter((u: any) => u.role === 'admin') || [];
          return adminUsers.length > 0 && (
            <div className="animate-slide-in-right">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Admin Team</h2>
                    <p className="text-sm text-gray-600">{adminUsers.length} member{adminUsers.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminUsers.map((u: any, index: number) => (
                  <UserCard key={u.id} user={u} currentUser={user} getRoleBadgeStyle={getRoleBadgeStyle} index={index} showDeleteConfirm={handleShowDeleteConfirm} toggleManager={toggleManagerMutation.mutate} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Growth Team */}
        {(() => {
          const growthUsers = usersData?.users.filter((u: any) => u.role === 'growth') || [];
          return growthUsers.length > 0 && (
            <div className="animate-slide-in-right" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Growth Team</h2>
                    <p className="text-sm text-gray-600">{growthUsers.length} member{growthUsers.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {growthUsers.map((u: any, index: number) => (
                  <UserCard key={u.id} user={u} currentUser={user} getRoleBadgeStyle={getRoleBadgeStyle} index={index} showDeleteConfirm={handleShowDeleteConfirm} toggleManager={toggleManagerMutation.mutate} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Ops Team */}
        {(() => {
          const opsUsers = usersData?.users.filter((u: any) => u.role === 'ops') || [];
          return opsUsers.length > 0 && (
            <div className="animate-slide-in-right" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Operations Team</h2>
                    <p className="text-sm text-gray-600">{opsUsers.length} member{opsUsers.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opsUsers.map((u: any, index: number) => (
                  <UserCard key={u.id} user={u} currentUser={user} getRoleBadgeStyle={getRoleBadgeStyle} index={index} showDeleteConfirm={handleShowDeleteConfirm} toggleManager={toggleManagerMutation.mutate} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={closeModal} 
          />
          <div className="relative glass rounded-3xl shadow-xl-colored max-w-lg w-full p-8 animate-scale-in">
            {generatedPassword ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">User Created!</h2>
                  <p className="text-gray-600">Share these credentials securely with the new user</p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email</label>
                        <p className="mt-1 text-sm font-mono font-semibold text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {createdUserEmail}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Temporary Password</label>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="flex-1 text-sm font-mono font-semibold text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                            {generatedPassword}
                          </p>
                          <button
                            onClick={copyPassword}
                            className="p-3 bg-white hover:bg-gray-50 text-indigo-600 rounded-lg border-2 border-indigo-200 transition-colors"
                            title="Copy password"
                          >
                            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl">
                    <p className="text-sm text-yellow-900 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <span><strong>Important:</strong> The user must change this password on first login.</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeModal}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                    <UserCircle className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start animate-slide-in-right">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-red-700 font-medium">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                      required
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                    >
                      <option value="growth">Growth Team</option>
                      <option value="ops">Operations Team</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      {formData.role === 'growth' && '✓ Can create and manage their own tickets'}
                      {formData.role === 'ops' && '✓ Can view and resolve all tickets'}
                      {formData.role === 'admin' && '✓ Full system access including user management'}
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
                    <p className="text-sm text-blue-900 flex items-start">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                      A temporary password will be generated automatically.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            )}
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

// User Card Component
interface UserCardProps {
  user: any;
  currentUser: any;
  getRoleBadgeStyle: (role: string) => string;
  index: number;
  showDeleteConfirm: (userId: string, userName: string) => void;
  toggleManager: (params: { userId: string; isManager: boolean }) => void;
}

function UserCard({ user: u, currentUser, getRoleBadgeStyle, index, showDeleteConfirm, toggleManager }: UserCardProps) {
  return (
    <div 
      className="card-modern group hover:-translate-y-2 animate-slide-in-right"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl ${getRoleBadgeStyle(u.role)} flex items-center justify-center font-bold text-2xl shadow-lg`}>
            {u.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{u.name}</h3>
            <p className="text-sm text-gray-500 truncate flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {u.email}
            </p>
          </div>
        </div>
        {u.id !== currentUser?.id && (
          <button
            onClick={() => showDeleteConfirm(u.id, u.name)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete user"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 uppercase">Role</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeStyle(u.role)} shadow-sm`}>
            {u.role.toUpperCase()}
          </span>
        </div>

        {u.role !== 'admin' && (
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-xs font-semibold text-gray-600 uppercase flex items-center">
              <Crown className="w-3 h-3 mr-1" />
              Manager Status
            </span>
            <button
              onClick={() => toggleManager({ userId: u.id, isManager: !u.is_manager })}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                u.is_manager
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {u.is_manager ? 'Manager' : 'Team Member'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 uppercase flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Last Login
          </span>
          <span className="text-xs text-gray-700 font-medium">
            {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
}