import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { userService } from '../services/userService';
import { Plus, Trash2, AlertCircle, Copy, Check } from 'lucide-react';

export default function UsersManagementPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage user accounts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usersData?.users.map((u: any) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{u.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{u.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    u.role === 'ops' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {u.id !== user?.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete user ${u.name}?`)) {
                          deleteUserMutation.mutate(u.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {generatedPassword ? 'User Created Successfully' : 'Create New User'}
              </h2>

              {generatedPassword ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 mb-3">
                      Account created! Share these credentials with the user:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Email:</label>
                        <p className="text-sm font-mono bg-white p-2 rounded border">
                          {createdUserEmail}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Temporary Password:</label>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 text-sm font-mono bg-white p-2 rounded border">
                            {generatedPassword}
                          </p>
                          <button
                            onClick={copyPassword}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                            title="Copy password"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                      ⚠️ <strong>Important:</strong> The user will be required to change this password on first login.
                      Make sure to securely share these credentials.
                    </p>
                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="growth">Growth Team</option>
                      <option value="ops">Operations Team</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.role === 'growth' && 'Can create and manage their own tickets'}
                      {formData.role === 'ops' && 'Can view and resolve all tickets'}
                      {formData.role === 'admin' && 'Full system access including user management'}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      A temporary password will be automatically generated. The user must change it on first login.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
