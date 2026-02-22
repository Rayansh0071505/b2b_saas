import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShoppingBag,
  Book,
  Settings,
  Plug,
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  Facebook,
  Search,
  Save,
  MessageSquare,
  Send,
  Brain,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Connector {
  name: string;
  type: string;
  status: string;
  records: number;
  description: string;
}

const EcomAgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'connectors' | 'chat'>('connectors');
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, message: string, sources?: string[]}>>([]);
  const [isChatting, setIsChatting] = useState<boolean>(false);

  useEffect(() => {
    fetchEcomData();
  }, []);

  const fetchEcomData = async () => {
    try {
      const [kbRes, connRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/ecom-agent/knowledge-base`),
        axios.get(`${API_BASE_URL}/ecom-agent/connectors`)
      ]);
      
      setKnowledgeBase(kbRes.data.knowledge_base);
      setConnectors(connRes.data.connectors);
    } catch (error) {
      console.error('Error fetching ecom agent data:', error);
    }
  };

  const saveKnowledgeBase = async () => {
    setSaveStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/ecom-agent/knowledge-base`, { content: knowledgeBase });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving knowledge base:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    
    setIsChatting(true);
    const userMsg = chatMessage;
    setChatMessage('');
    
    const newHistory = [...chatHistory, { role: 'user', message: userMsg }];
    setChatHistory(newHistory);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/ecom-agent/chat`, {
        message: userMsg,
        conversation_history: newHistory
      });
      
      setChatHistory([...newHistory, { 
        role: 'bot', 
        message: response.data.response,
        sources: response.data.sources 
      }]);
    } catch (error) {
      console.error('Error chatting with ecom agent:', error);
      setChatHistory([...newHistory, { role: 'bot', message: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getConnectorIcon = (type: string) => {
    if (type.includes('product')) return <Package className="w-6 h-6 text-blue-400" />;
    if (type.includes('shopify')) return <ShoppingCart className="w-6 h-6 text-green-400" />;
    if (type.includes('dhl')) return <Truck className="w-6 h-6 text-orange-400" />;
    if (type.includes('strategies')) return <TrendingUp className="w-6 h-6 text-purple-400" />;
    if (type.includes('meta')) return <Facebook className="w-6 h-6 text-blue-500" />;
    if (type.includes('google')) return <Search className="w-6 h-6 text-red-400" />;
    return <Plug className="w-6 h-6 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Ecom Agent</h1>
              <p className="text-gray-400">AI-Powered E-commerce Intelligence with GPT-4o-mini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800/30 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 py-4">
            <button
              onClick={() => setActiveTab('connectors')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'connectors'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Plug className="w-5 h-5" />
              <span>Connectors & Data</span>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'knowledge'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Book className="w-5 h-5" />
              <span>Knowledge Base</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>AI Chat</span>
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">GPT-4o-mini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Connectors Tab */}
        {activeTab === 'connectors' && (
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Connected Data Sources</h2>
              <p className="text-gray-400">All your e-commerce data in one place. The AI agent uses these to answer your questions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectors.map((connector, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center border border-gray-600">
                      {getConnectorIcon(connector.type)}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      connector.status === 'connected'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {connector.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{connector.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{connector.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                    <span className="text-xs text-gray-500">{connector.type}</span>
                    <span className="text-sm font-semibold text-blue-400">{connector.records} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === 'knowledge' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Knowledge Base</h2>
                  <p className="text-gray-400">
                    Add information about your business that the AI will use to answer customer questions.
                  </p>
                </div>
                <button
                  onClick={saveKnowledgeBase}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    saveStatus === 'saved'
                      ? 'bg-green-500 text-white'
                      : saveStatus === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {saveStatus === 'saved' ? (
                    <><CheckCircle className="w-5 h-5" /> Saved</>
                  ) : saveStatus === 'error' ? (
                    <><XCircle className="w-5 h-5" /> Error</>
                  ) : (
                    <><Save className="w-5 h-5" /> Save Changes</>
                  )}
                </button>
              </div>
              <textarea
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                className="w-full h-96 bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                placeholder="Enter your knowledge base content here..."
              />
            </div>
          </div>
        )}

        {/* AI Chat Tab */}
        {activeTab === 'chat' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-gray-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold">AI E-commerce Assistant</h2>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-300">
                  Ask about orders, products, campaigns, strategies, and performance metrics. Powered by GPT-4o-mini with access to all your data.
                </p>
              </div>
              
              {/* Chat Messages */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-900/30">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 mt-16">
                    <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Start a conversation with your AI assistant</p>
                    <div className="max-w-md mx-auto text-sm space-y-2 mt-4">
                      <p className="text-gray-400">Try asking:</p>
                      <div className="space-y-1">
                        <p className="text-blue-400">"What's our Google Ads ROAS?"</p>
                        <p className="text-blue-400">"Show me top performing products"</p>
                        <p className="text-blue-400">"Summarize our marketing strategies"</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl p-4 ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800/80 text-gray-200 border border-gray-700/50'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <p className="text-xs font-semibold text-gray-400 mb-1">Sources Used:</p>
                            <div className="flex flex-wrap gap-2">
                              {msg.sources.map((source, i) => (
                                <span key={i} className="text-xs bg-gray-700/50 px-2 py-1 rounded">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/50">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-gray-700/50 bg-gray-800/30">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                    placeholder="Ask anything about your e-commerce data..."
                    className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                    disabled={isChatting}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={isChatting || !chatMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EcomAgentDashboard;
