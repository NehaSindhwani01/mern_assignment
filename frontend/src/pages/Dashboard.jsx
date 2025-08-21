import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { agentAPI, listAPI } from '../services/api';
import { Users, List, FileText, TrendingUp, Upload, RefreshCw, ArrowUpRight, BarChart3, Eye, Download, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalItems: 0,
    distributions: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distributionData, setDistributionData] = useState([]);
  const [showAllDistributions, setShowAllDistributions] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [agentsResponse, distributionResponse] = await Promise.all([
        agentAPI.getAgents(),
        listAPI.getDistributedData()
      ]);

      const agents = agentsResponse.data;
      const distributions = distributionResponse.data;

      const totalItems = distributions.reduce((sum, dist) => sum + dist.count, 0);

      setStats({
        totalAgents: agents.length,
        totalItems,
        distributions: distributions.length
      });

      setDistributionData(distributions);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const exportToCSV = (agentData) => {
    if (!agentData.items.length) return;

    const headers = ['First Name', 'Phone', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...agentData.items.map(item => 
        [item.firstName, item.phone, item.notes || ''].map(field => 
          `"${field.replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${agentData.agent.name.replace(/\s+/g, '_')}_assigned_list.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </Layout>
    );
  }

  const displayedDistributions = showAllDistributions ? distributionData : distributionData.slice(0, 5);
  const totalItems = distributionData.reduce((sum, dist) => sum + dist.count, 0);
  const averagePerAgent = distributionData.length > 0 ? Math.round(totalItems / distributionData.length) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome back! Here's what's happening with your system.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Agents Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Agents</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAgents}</p>
                <p className="text-xs text-blue-500 mt-2">Active team members</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-500">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              <span>Managing your distribution network</span>
            </div>
            <Link 
              to="/agents"
              className="mt-4 inline-flex items-center text-xs text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              View all agents →
            </Link>
          </div>

          {/* Total Items Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-md p-6 border border-green-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalItems.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-2">Across all distributions</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-500">
              <BarChart3 className="h-3 w-3 mr-1" />
              <span>Items distributed to agents</span>
            </div>
            <div className="mt-2 text-xs text-green-600">
              ~{averagePerAgent} items per agent
            </div>
          </div>

          {/* Distributions Card */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-md p-6 border border-purple-100 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Distributions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.distributions}</p>
                <p className="text-xs text-purple-500 mt-2">Active distributions</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-purple-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Distribution campaigns</span>
            </div>
            <Link 
              to="/lists"
              className="mt-4 inline-flex items-center text-xs text-purple-600 hover:text-purple-700 transition-colors duration-200"
            >
              Manage distributions →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-md p-6 border border-purple-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link 
              to="/agents" 
              className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 group"
            >
              <Users className="h-5 w-5 text-blue-600 mr-2 group-hover:text-blue-700" />
              <span className="text-sm font-medium">Manage Agents</span>
            </Link>
            <Link 
              to="/lists" 
              className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 group"
            >
              <Upload className="h-5 w-5 text-purple-600 mr-2 group-hover:text-purple-700" />
              <span className="text-sm font-medium">Upload List</span>
            </Link>
            <button 
              className="flex items-center justify-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 group"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-5 w-5 text-green-600 mr-2 group-hover:text-green-700" />
              <span className="text-sm font-medium">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Distribution Overview */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <List className="h-5 w-5 text-purple-600 mr-2" />
              Distribution Overview
            </h3>
            <span className="text-xs bg-purple-100 text-purple-800 py-1 px-2 rounded-full">
              {distributionData.length} {distributionData.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>
          <div className="p-6">
            {distributionData.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm font-medium text-blue-600">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm font-medium text-green-600">Agents</p>
                    <p className="text-2xl font-bold text-gray-900">{distributionData.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm font-medium text-purple-600">Avg per Agent</p>
                    <p className="text-2xl font-bold text-gray-900">{averagePerAgent}</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                    <p className="text-sm font-medium text-teal-600">Status</p>
                    <p className="text-lg font-bold text-green-600">✓ Distributed</p>
                  </div>
                </div>

                {/* Agent Distribution Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayedDistributions.map((dist, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-2 rounded-xl mr-3">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{dist.agent.name}</h4>
                            <p className="text-sm text-gray-500">{dist.agent.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{dist.count}</div>
                          <p className="text-xs text-gray-500">items</p>
                        </div>
                      </div>
                      
                      {/* Preview of items */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Sample Items:</h5>
                        <div className="space-y-1">
                          {dist.items.slice(0, 3).map((item, itemIndex) => (
                            <div key={itemIndex} className="text-xs text-gray-600 flex justify-between">
                              <span className="truncate max-w-[100px]">{item.firstName}</span>
                              <span className="font-mono">{item.phone}</span>
                            </div>
                          ))}
                          {dist.items.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              ... and {dist.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => exportToCSV(dist)}
                        disabled={dist.items.length === 0}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </button>
                    </div>
                  ))}
                </div>

                {distributionData.length > 5 && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowAllDistributions(!showAllDistributions)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showAllDistributions ? 'Show Less' : `View All ${distributionData.length} Distributions`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No distributions yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Get started by uploading your first file to distribute items to your agents.
                </p>
                <Link 
                  to="/lists"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;