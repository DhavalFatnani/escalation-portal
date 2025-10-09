import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  Settings, 
  Shield, 
  AlertCircle, 
  Database,
  Server,
  Mail,
  Bell,
  Lock,
  Key,
  Check
} from 'lucide-react';

export default function SystemSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'database'>('general');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen animate-scale-in">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-indigo-600" />
            <span className="text-gradient">System Settings</span>
          </h1>
          <p className="text-sm text-gray-600">Configure system-wide settings and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="card-modern p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">General Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">System Name</p>
                    <p className="text-sm text-gray-500">Escalation Portal</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">API Version</p>
                    <p className="text-sm text-gray-500">v1.0.0</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Environment</p>
                    <p className="text-sm text-gray-500">Production</p>
                  </div>
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Password Complexity</p>
                    <p className="text-sm text-gray-500">Enforce strong passwords</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">JWT Token Expiry</p>
                    <p className="text-sm text-gray-500">7 days</p>
                  </div>
                  <Key className="w-5 h-5 text-indigo-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Force Password Change</p>
                    <p className="text-sm text-gray-500">On first login</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Rate Limiting</p>
                    <p className="text-sm text-gray-500">100 requests per 15 minutes</p>
                  </div>
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Ticket updates and status changes</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">In-App Notifications</p>
                    <p className="text-sm text-gray-500">Real-time activity updates</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">SMTP Server</p>
                    <p className="text-sm text-gray-500">Configured via environment variables</p>
                  </div>
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Database Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Database Type</p>
                    <p className="text-sm text-gray-500">PostgreSQL (Supabase)</p>
                  </div>
                  <Database className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Connection Status</p>
                    <p className="text-sm text-gray-500">Connected</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Storage Provider</p>
                    <p className="text-sm text-gray-500">Supabase Storage</p>
                  </div>
                  <Server className="w-5 h-5 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">Backup Strategy</p>
                    <p className="text-sm text-gray-500">Automated daily backups</p>
                  </div>
                  <Check className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="card-modern p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Configuration Notice</p>
            <p>Most system settings are configured via environment variables. Changes to critical settings require server restart.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

