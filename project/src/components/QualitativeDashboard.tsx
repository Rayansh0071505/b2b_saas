import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Activity,
  Plug2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../config';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const QualitativeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'connectors'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const response = await axios.get(`${API_BASE_URL}/qualitative/dashboard`);
        setDashboardData(response.data);
      } else {
        const response = await axios.get(`${API_BASE_URL}/qualitative/connectors`);
        setConnectors(response.data.connectors);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Qualitative Dashboard</h1>
              <p className="text-gray-400">Comprehensive E-commerce Analytics & Insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('connectors')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'connectors' ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Plug2 className="w-5 h-5" />
              Connectors
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading data...</p>
          </div>
        ) : activeTab === 'dashboard' && dashboardData ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Total Revenue" 
                value={`$${dashboardData.overview.total_revenue.toLocaleString()}`}
                icon={DollarSign}
                trend={12.5}
                color="from-green-500 to-emerald-600"
              />
              <StatCard 
                title="Total Orders" 
                value={dashboardData.overview.total_orders}
                icon={ShoppingCart}
                trend={8.2}
                color="from-blue-500 to-cyan-600"
              />
              <StatCard 
                title="Customers" 
                value={dashboardData.overview.total_customers}
                icon={Users}
                trend={15.3}
                color="from-purple-500 to-pink-600"
              />
              <StatCard 
                title="Products" 
                value={dashboardData.overview.total_products}
                icon={Package}
                color="from-orange-500 to-red-600"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Channel */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4">Revenue by Channel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.revenue_by_channel}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="channel" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Order Status */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4">Order Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(dashboardData.order_statuses).map(([key, value]) => ({ name: key, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(dashboardData.order_statuses).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products & Traffic */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                <div className="space-y-3">
                  {dashboardData.top_products.map((product: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-400">Stock: {product.stock}</p>
                      </div>
                      <p className="text-green-400 font-semibold">${product.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
                <div className="space-y-3">
                  {dashboardData.traffic_sources.map((source: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium">{source.source}</p>
                        <p className="text-sm text-gray-400">{source.users.toLocaleString()} users</p>
                      </div>
                      <span className="text-blue-400 font-semibold">{source.conversion_rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
                <p className="text-sm text-gray-300 mb-2">Avg Order Value</p>
                <p className="text-3xl font-bold">${dashboardData.overview.avg_order_value.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <p className="text-sm text-gray-300 mb-2">Overall ROAS</p>
                <p className="text-3xl font-bold">{dashboardData.overview.overall_roas.toFixed(2)}x</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
                <p className="text-sm text-gray-300 mb-2">Low Stock Items</p>
                <p className="text-3xl font-bold">{dashboardData.overview.low_stock_products}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map((connector, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{connector.name}</h3>
                    <p className="text-sm text-gray-400">{connector.platform}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                    {connector.status}
                  </span>
                </div>
                <div className="space-y-2 mt-4">
                  {connector.campaigns && <p className="text-sm text-gray-300">Campaigns: <span className="font-semibold text-white">{connector.campaigns}</span></p>}
                  {connector.spend && <p className="text-sm text-gray-300">Spend: <span className="font-semibold text-white">${connector.spend.toLocaleString()}</span></p>}
                  {connector.revenue && <p className="text-sm text-gray-300">Revenue: <span className="font-semibold text-green-400">${connector.revenue.toLocaleString()}</span></p>}
                  {connector.roas && <p className="text-sm text-gray-300">ROAS: <span className="font-semibold text-blue-400">{connector.roas}x</span></p>}
                  {connector.orders && <p className="text-sm text-gray-300">Orders: <span className="font-semibold text-white">{connector.orders}</span></p>}
                  {connector.total_users && <p className="text-sm text-gray-300">Users: <span className="font-semibold text-white">{connector.total_users.toLocaleString()}</span></p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QualitativeDashboard;
