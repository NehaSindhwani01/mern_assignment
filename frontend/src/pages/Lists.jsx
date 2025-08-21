import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { listAPI, agentAPI } from '../services/api';
import { Upload, FileText, Users, Download, FileUp, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Lists = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [distributionData, setDistributionData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [distributionResponse, agentsResponse] = await Promise.all([
        listAPI.getDistributedData(),
        agentAPI.getAgents()
      ]);
      setDistributionData(distributionResponse.data);
      setAgents(agentsResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileValidation(droppedFile);
    }
  };

  const handleFileValidation = (selectedFile) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please select a CSV or Excel file');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileValidation(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (agents.length < 5) {
      toast.error('At least 5 agents are required to distribute the list');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await listAPI.uploadAndDistribute(formData);
      toast.success(response.data.message);
      setFile(null);
      // Reset file input
      document.getElementById('fileInput').value = '';
      // Refresh data
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
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
          <p className="text-gray-500">Loading distribution data...</p>
        </div>
      </Layout>
    );
  }

  const totalItems = distributionData.reduce((sum, dist) => sum + dist.count, 0);
  const averagePerAgent = distributionData.length > 0 ? Math.round(totalItems / distributionData.length) : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">List Distribution</h1>
            <p className="text-gray-600">Upload and distribute contact lists to agents</p>
          </div>
          <div className="flex items-center mt-4 sm:mt-0">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              agents.length >= 5 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {agents.length} {agents.length === 1 ? 'Agent' : 'Agents'} Available
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileUp className="h-5 w-5 text-purple-600 mr-2" />
            Upload New List
          </h2>
          
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              dragOver 
                ? 'border-purple-400 bg-purple-50' 
                : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="max-w-md mx-auto">
              <Upload className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <div className="space-y-2">
                <label htmlFor="fileInput" className="cursor-pointer">
                  <span className="block text-sm font-medium text-gray-900">
                    <span className="text-purple-600">Click to upload</span> or drag and drop
                  </span>
                </label>
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500">
                  CSV, XLSX, or XLS files up to 10MB
                </p>
                <p className="text-xs text-gray-500">
                  Expected columns: FirstName, Phone, Notes (optional)
                </p>
              </div>
            </div>
          </div>
          
          {file && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {file.name}
                  </p>
                  <p className="text-xs text-green-600">
                    {Math.round(file.size / 1024)} KB • Ready to upload
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center text-sm text-gray-600">
              {agents.length >= 5 ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span>{agents.length} agents available for distribution</span>
                </div>
              ) : (
                <div className="flex items-center text-yellow-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Need at least 5 agents ({agents.length} available)</span>
                </div>
              )}
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || agents.length < 5}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Distributing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Distribute
                </>
              )}
            </button>
          </div>
        </div>

        {/* Distribution Results */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
              Current Distribution
            </h3>
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
                  {distributionData.map((agentData, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-2 rounded-xl mr-3">
                            <Users className="h-6 w-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{agentData.agent.name}</h4>
                            <p className="text-sm text-gray-500">{agentData.agent.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">{agentData.count}</div>
                          <p className="text-xs text-gray-500">items</p>
                        </div>
                      </div>
                      
                      {/* Preview of items */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <h5 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Sample Items:</h5>
                        <div className="space-y-1">
                          {agentData.items.slice(0, 3).map((item, itemIndex) => (
                            <div key={itemIndex} className="text-xs text-gray-600 flex justify-between">
                              <span className="truncate max-w-[100px]">{item.firstName}</span>
                              <span className="font-mono">{item.phone}</span>
                            </div>
                          ))}
                          {agentData.items.length > 3 && (
                            <p className="text-xs text-gray-500 italic">
                              ... and {agentData.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => exportToCSV(agentData)}
                        disabled={agentData.items.length === 0}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No distributions yet</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Upload a CSV or Excel file to distribute items to your agents
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Lists;