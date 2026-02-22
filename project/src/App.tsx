import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import EmailDashboard from './components/EmailDashboard';
import EcomAgentDashboard from './components/EcomAgentDashboard';
import { BarChart3, Mail, ShoppingBag } from 'lucide-react';

function App() {
  const [activeDashboard, setActiveDashboard] = useState<'sentiment' | 'email' | 'ecom-agent'>('sentiment');

  return (
    <>
      <Toaster position="top-right" />

      {/* Dashboard Switcher */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-gray-800/90 backdrop-blur-sm rounded-lg p-2 border border-gray-700/50 shadow-xl">
        <button
          onClick={() => setActiveDashboard('sentiment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeDashboard === 'sentiment'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sentiment Dashboard</span>
        </button>
        <button
          onClick={() => setActiveDashboard('email')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeDashboard === 'email'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email Dashboard</span>
        </button>
        <button
          onClick={() => setActiveDashboard('ecom-agent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeDashboard === 'ecom-agent'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>My Ecom Agent</span>
        </button>
      </div>

      {/* Render Active Dashboard */}
      {activeDashboard === 'sentiment' ? (
        <Dashboard />
      ) : activeDashboard === 'email' ? (
        <EmailDashboard />
      ) : (
        <EcomAgentDashboard />
      )}
    </>
  );
}

export default App;
