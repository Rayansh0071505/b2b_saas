import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import EmailDashboard from './components/EmailDashboard';
import { BarChart3, Mail } from 'lucide-react';

function App() {
  const [activeDashboard, setActiveDashboard] = useState<'sentiment' | 'email'>('sentiment');

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
      </div>

      {/* Render Active Dashboard */}
      {activeDashboard === 'sentiment' ? <Dashboard /> : <EmailDashboard />}
    </>
  );
}

export default App;
