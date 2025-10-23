import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { managerService } from '../services/managerService';

type TimeRange = '7d' | '30d' | '90d' | 'custom';

interface CustomDateRange {
  startDate: string;
  endDate: string;
}

const TeamPerformance: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Helper functions for date calculations
  const getDateRange = (range: TimeRange): { startDate: string; endDate: string } => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (range) {
      case '7d':
        return {
          startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today
        };
      case '30d':
        return {
          startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today
        };
      case '90d':
        return {
          startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today
        };
      case 'custom':
        return customRange;
      default:
        return {
          startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: today
        };
    }
  };

  const formatDateRange = (range: TimeRange): string => {
    const { startDate, endDate } = getDateRange(range);
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    
    if (range === 'custom') {
      return `${start} - ${end}`;
    }
    
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    return `Last ${days} days`;
  };

  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    if (newRange !== 'custom') {
      setShowCustomPicker(false);
    } else {
      setShowCustomPicker(true);
    }
  };

  const handleCustomRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setCustomRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch team metrics
  const { data: metricsData } = useQuery({
    queryKey: ['team-metrics'],
    queryFn: () => managerService.getTeamMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch team workload
  const { data: workloadData, isLoading: workloadLoading } = useQuery({
    queryKey: ['team-workload'],
    queryFn: () => managerService.getTeamWorkload(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch incoming tickets for flow metrics
  const { data: incomingData } = useQuery({
    queryKey: ['incoming-tickets'],
    queryFn: () => managerService.getIncomingTickets(),
    refetchInterval: 30000,
  });

  // Fetch outgoing tickets for flow metrics
  const { data: outgoingData } = useQuery({
    queryKey: ['outgoing-tickets'],
    queryFn: () => managerService.getOutgoingTickets(),
    refetchInterval: 30000,
  });

  const metrics = metricsData;
  const workload = workloadData?.workload || [];
  const incomingTickets = incomingData?.tickets || [];
  const outgoingTickets = outgoingData?.tickets || [];

  // Calculate flow metrics
  const flowMetrics = {
    incomingTotal: incomingTickets.length,
    incomingUnassigned: incomingTickets.filter(t => !t.assigned_to).length,
    outgoingTotal: outgoingTickets.length,
    outgoingResolved: outgoingTickets.filter(t => t.status === 'resolved').length,
    flowEfficiency: outgoingTickets.length > 0 
      ? Math.round((outgoingTickets.filter(t => t.status === 'resolved').length / outgoingTickets.length) * 100)
      : 0
  };

  // Calculate workload distribution
  const workloadDistribution = workload.map(member => ({
    name: member.name,
    activeTickets: member.active_tickets || 0,
    openTickets: member.open_tickets || 0,
    processedTickets: member.processed_tickets || 0,
    resolvedTickets: member.resolved_tickets || 0,
    isActive: member.is_active
  }));

  // Calculate team efficiency metrics
  const teamEfficiency = {
    avgResponseTime: metrics?.avg_resolution_time_hours || 0,
    completionRate: metrics?.total_tickets && metrics.total_tickets > 0 
      ? Math.round((metrics.resolved_tickets / metrics.total_tickets) * 100)
      : 0,
    reopenRate: metrics?.reopen_rate || 0,
    throughput: metrics?.total_tickets || 0
  };

  const getWorkloadColor = (tickets: number) => {
    if (tickets === 0) return 'bg-gray-100 text-gray-600';
    if (tickets <= 2) return 'bg-green-100 text-green-800';
    if (tickets <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getWorkloadLabel = (tickets: number) => {
    if (tickets === 0) return 'No Work';
    if (tickets <= 2) return 'Light';
    if (tickets <= 5) return 'Moderate';
    return 'Heavy';
  };

  return (
    <div className="max-w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-1 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-indigo-600" />
            Team Performance
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and metrics for your team
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Time Range:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>
            
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {formatDateRange(timeRange)}
            </span>
          </div>
          
          {showCustomPicker && (
            <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
              <span className="text-sm text-blue-700">From:</span>
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => handleCustomRangeChange('startDate', e.target.value)}
                className="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-sm text-blue-700">To:</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => handleCustomRangeChange('endDate', e.target.value)}
                className="px-2 py-1 border border-blue-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => setShowCustomPicker(false)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ✓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {teamEfficiency.avgResponseTime.toFixed(1)}h
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{teamEfficiency.completionRate}%</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-red">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">Reopen Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{teamEfficiency.reopenRate.toFixed(1)}%</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="stat-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Throughput</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{teamEfficiency.throughput}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Flow Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Flow */}
        <div className="card-modern">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Incoming Flow</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Incoming</span>
              <span className="text-lg font-semibold text-blue-600">{flowMetrics.incomingTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unassigned</span>
              <span className="text-lg font-semibold text-orange-600">{flowMetrics.incomingUnassigned}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Assignment Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {flowMetrics.incomingTotal > 0 
                  ? Math.round(((flowMetrics.incomingTotal - flowMetrics.incomingUnassigned) / flowMetrics.incomingTotal) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Outgoing Flow */}
        <div className="card-modern">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Outgoing Flow</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Created</span>
              <span className="text-lg font-semibold text-purple-600">{flowMetrics.outgoingTotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resolved</span>
              <span className="text-lg font-semibold text-green-600">{flowMetrics.outgoingResolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resolution Rate</span>
              <span className="text-lg font-semibold text-green-600">{flowMetrics.flowEfficiency}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Workload Distribution */}
      <div className="card-modern">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Team Workload Distribution</h2>
          </div>
        </div>

        {workloadLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-3 animate-spin" />
            <p>Loading team workload...</p>
          </div>
        ) : workloadDistribution.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No team members found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workloadDistribution.map((member, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getWorkloadColor(member.activeTickets)}`}>
                      {getWorkloadLabel(member.activeTickets)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {member.activeTickets} active ticket{member.activeTickets !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Open</p>
                    <p className="text-lg font-semibold text-blue-600">{member.openTickets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Processed</p>
                    <p className="text-lg font-semibold text-yellow-600">{member.processedTickets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Resolved</p>
                    <p className="text-lg font-semibold text-green-600">{member.resolvedTickets}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {member.openTickets + member.processedTickets + member.resolvedTickets}
                    </p>
                  </div>
                </div>
                
                {/* Workload bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        member.activeTickets === 0 ? 'bg-gray-400' :
                        member.activeTickets <= 2 ? 'bg-green-500' :
                        member.activeTickets <= 5 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min((member.activeTickets / 10) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card-modern">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-600">Open</span>
              </div>
              <span className="font-semibold text-blue-600">{metrics?.open_tickets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm text-gray-600">Processed</span>
              </div>
              <span className="font-semibold text-yellow-600">{metrics?.processed_tickets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Resolved</span>
              </div>
              <span className="font-semibold text-green-600">{metrics?.resolved_tickets || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-600">Reopened</span>
              </div>
              <span className="font-semibold text-red-600">{metrics?.open_tickets || 0}</span>
            </div>
          </div>
        </div>

        {/* Team Efficiency Score */}
        <div className="card-modern">
          <div className="flex items-center mb-4">
            <Zap className="w-5 h-5 text-yellow-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Team Efficiency Score</h2>
          </div>
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${teamEfficiency.completionRate * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{teamEfficiency.completionRate}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Based on completion rate and response time</p>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="card-modern">
        <div className="flex items-center mb-4">
          <Activity className="w-5 h-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Completion Rate</span>
            </div>
            <p className="text-sm text-blue-700">
              Your team has a {teamEfficiency.completionRate}% completion rate, which is 
              {teamEfficiency.completionRate >= 80 ? ' excellent' : teamEfficiency.completionRate >= 60 ? ' good' : ' needs improvement'}.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">Response Time</span>
            </div>
            <p className="text-sm text-green-700">
              Average response time is {teamEfficiency.avgResponseTime.toFixed(1)} hours, which is 
              {teamEfficiency.avgResponseTime <= 4 ? ' excellent' : teamEfficiency.avgResponseTime <= 8 ? ' good' : ' needs improvement'}.
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Reopen Rate</span>
            </div>
            <p className="text-sm text-orange-700">
              Reopen rate is {teamEfficiency.reopenRate.toFixed(1)}%, which is 
              {teamEfficiency.reopenRate <= 10 ? ' excellent' : teamEfficiency.reopenRate <= 20 ? ' acceptable' : ' needs attention'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformance;
