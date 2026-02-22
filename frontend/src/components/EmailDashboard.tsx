import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  Inbox,
  AlertCircle,
  Flame,
  Shield,
  Send,
  BarChart3,
  Brain,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Book,
  Settings,
  Plug,
  ShoppingCart,
  Truck,
  Package,
  Save,
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Email {
  id: string;
  from: string;
  from_name: string;
  subject: string;
  body: string;
  timestamp: string;
  sentiment: 'normal' | 'urgent' | 'angry' | 'spam' | 'handover';
  read: boolean;
  ai_reply: string;
}

interface EmailStats {
  total_emails: number;
  total_replied: number;
  avg_response_time_minutes: number;
  sentiment_breakdown: {
    normal: number;
    urgent: number;
    angry: number;
    spam: number;
    handover: number;
  };
  ai_reply_accuracy: number;
  customer_satisfaction: number;
}

const EmailDashboard: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeView, setActiveView] = useState<'emails' | 'train' | 'stats'>('emails');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  
  // Bot training states
  const [trainView, setTrainView] = useState<'knowledge' | 'instructions' | 'connectors'>('knowledge');
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [botInstructions, setBotInstructions] = useState<string>('');
  const [connectors, setConnectors] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, message: string}>>([]);
  const [isChatting, setIsChatting] = useState<boolean>(false);

  useEffect(() => {
    fetchEmails();
    if (activeView === 'train') {
      fetchBotConfig();
    }
  }, [activeView]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/emails`);
      setEmails(response.data.emails);
      setStats(response.data.email_statistics);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const fetchBotConfig = async () => {
    try {
      const [kbRes, instRes, connRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/bot/knowledge-base`),
        axios.get(`${API_BASE_URL}/bot/instructions`),
        axios.get(`${API_BASE_URL}/bot/connectors/status`)
      ]);
      
      setKnowledgeBase(kbRes.data.knowledge_base);
      setBotInstructions(instRes.data.instructions);
      setConnectors(connRes.data.connectors);
    } catch (error) {
      console.error('Error fetching bot config:', error);
    }
  };

  const saveKnowledgeBase = async () => {
    setSaveStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/bot/knowledge-base`, { content: knowledgeBase });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving knowledge base:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const saveBotInstructions = async () => {
    setSaveStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/bot/instructions`, { instructions: botInstructions });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving instructions:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    
    setIsChatting(true);
    const userMsg = chatMessage;
    setChatMessage('');
    
    // Add user message to history
    const newHistory = [...chatHistory, { role: 'user', message: userMsg }];
    setChatHistory(newHistory);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/bot/chat`, {
        message: userMsg,
        conversation_history: newHistory
      });
      
      setChatHistory([...newHistory, { role: 'bot', message: response.data.response }]);
    } catch (error) {
      console.error('Error chatting with bot:', error);
      setChatHistory([...newHistory, { role: 'bot', message: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'angry': return <Flame className="w-4 h-4 text-red-500" />;
      case 'spam': return <Shield className="w-4 h-4 text-gray-500" />;
      case 'handover': return <Send className="w-4 h-4 text-blue-500" />;
      default: return <Mail className="w-4 h-4 text-green-500" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      urgent: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      angry: 'bg-red-500/20 text-red-400 border-red-500/30',
      spam: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      handover: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      normal: 'bg-green-500/20 text-green-400 border-green-500/30'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[sentiment as keyof typeof colors]}`}>
        {sentiment.toUpperCase()}
      </span>
    );
  };

  const filteredEmails = filterSentiment === 'all'
    ? emails
    : emails.filter(e => e.sentiment === filterSentiment);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);

    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Container */}
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700/50 p-4 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-1">Email Management</h2>
            <p className="text-sm text-gray-400">AI-Powered Support</p>
          </div>

          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveView('emails')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'emails'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-gray-700/30 text-gray-300'
              }`}
            >
              <Inbox className="w-5 h-5" />
              <span>Emails</span>
              {stats && (
                <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.total_emails}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveView('train')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'train'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-gray-700/30 text-gray-300'
              }`}
            >
              <Brain className="w-5 h-5" />
              <span>Train Your Bot</span>
            </button>

            <button
              onClick={() => setActiveView('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'stats'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'hover:bg-gray-700/30 text-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>AI Reply Stats</span>
            </button>
          </nav>

          {stats && (
            <div className="mt-auto pt-4 border-t border-gray-700/50">
              <div className="text-xs text-gray-400 space-y-2">
                <div className="flex justify-between">
                  <span>Avg Response</span>
                  <span className="text-white font-medium">{stats.avg_response_time_minutes}m</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Accuracy</span>
                  <span className="text-green-400 font-medium">{stats.ai_reply_accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Satisfaction</span>
                  <span className="text-blue-400 font-medium">{stats.customer_satisfaction}/5</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeView === 'emails' && (
            <>
              {/* Email List */}
              <div className="w-96 bg-gray-800/30 border-r border-gray-700/50 overflow-y-auto">
                {/* Filters */}
                <div className="p-4 border-b border-gray-700/50 bg-gray-800/50">
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'urgent', 'angry', 'normal', 'handover', 'spam'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setFilterSentiment(filter)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          filterSentiment === filter
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email List Items */}
                <div className="divide-y divide-gray-700/30">
                  {filteredEmails.map(email => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedEmail(email)}
                      className={`p-4 cursor-pointer transition-all hover:bg-gray-700/30 ${
                        selectedEmail?.id === email.id ? 'bg-gray-700/50 border-l-4 border-blue-500' : ''
                      } ${!email.read ? 'bg-blue-500/5' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {email.read ? (
                            <CheckCircle2 className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-blue-400" />
                          )}
                          <span className={`font-medium ${!email.read ? 'text-white' : 'text-gray-300'}`}>
                            {email.from_name}
                          </span>
                        </div>
                        {getSentimentIcon(email.sentiment)}
                      </div>
                      <h4 className={`text-sm mb-1 truncate ${!email.read ? 'font-semibold' : ''}`}>
                        {email.subject}
                      </h4>
                      <p className="text-xs text-gray-400 truncate mb-2">{email.body}</p>
                      <div className="flex items-center justify-between">
                        {getSentimentBadge(email.sentiment)}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(email.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Detail */}
              <div className="flex-1 overflow-y-auto">
                {selectedEmail ? (
                  <div className="p-8">
                    {/* Email Header */}
                    <div className="mb-6 pb-6 border-b border-gray-700/50">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-2xl font-bold mb-2">{selectedEmail.subject}</h1>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{selectedEmail.from_name}</span>
                            </div>
                            <span>•</span>
                            <span>{selectedEmail.from}</span>
                            <span>•</span>
                            <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        {getSentimentBadge(selectedEmail.sentiment)}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">Customer Message</h3>
                      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                        <p className="text-gray-200 whitespace-pre-wrap">{selectedEmail.body}</p>
                      </div>
                    </div>

                    {/* AI Reply */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-400">AI Generated Reply</h3>
                        <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                          ✓ AI Generated
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/30">
                        <p className="text-gray-200 whitespace-pre-wrap mb-4">{selectedEmail.ai_reply}</p>
                        <div className="flex gap-3 mt-6">
                          <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-all">
                            Send Reply
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                            Edit
                          </button>
                          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                            Regenerate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select an email to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeView === 'train' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Train View Header */}
              <div className="bg-gray-800/50 border-b border-gray-700/50 p-6">
                <h2 className="text-2xl font-bold mb-2">Train Your Saturnin Bot</h2>
                <p className="text-gray-400">Customize your AI assistant with knowledge, behavior, and tools</p>
              </div>

              {/* Train Navigation Tabs */}
              <div className="flex gap-2 bg-gray-800/30 border-b border-gray-700/50 p-4">
                <button
                  onClick={() => setTrainView('knowledge')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    trainView === 'knowledge'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Book className="w-4 h-4" />
                  Knowledge Base
                </button>
                <button
                  onClick={() => setTrainView('instructions')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    trainView === 'instructions'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Bot Behavior
                </button>
                <button
                  onClick={() => setTrainView('connectors')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    trainView === 'connectors'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Plug className="w-4 h-4" />
                  Tools & Connectors
                </button>
              </div>

              {/* Train Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Knowledge Base View */}
                {trainView === 'knowledge' && (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Knowledge Base</h3>
                          <p className="text-sm text-gray-400">
                            Add information about your company, policies, and common questions. 
                            The AI will use this to answer customer queries.
                          </p>
                        </div>
                        <button
                          onClick={saveKnowledgeBase}
                          disabled={saveStatus === 'saving'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            saveStatus === 'saved'
                              ? 'bg-green-500 text-white'
                              : saveStatus === 'error'
                              ? 'bg-red-500 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {saveStatus === 'saved' ? (
                            <><CheckCircle className="w-4 h-4" /> Saved</>
                          ) : saveStatus === 'error' ? (
                            <><XCircle className="w-4 h-4" /> Error</>
                          ) : (
                            <><Save className="w-4 h-4" /> Save</>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={knowledgeBase}
                        onChange={(e) => setKnowledgeBase(e.target.value)}
                        className="w-full h-80 bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                        placeholder="Enter your knowledge base content here..."
                      />
                    </div>
                  </div>
                )}

                {/* Bot Instructions View */}
                {trainView === 'instructions' && (
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Bot Behavior & Instructions</h3>
                          <p className="text-sm text-gray-400">
                            Define how your AI assistant should behave, its tone, and response guidelines.
                          </p>
                        </div>
                        <button
                          onClick={saveBotInstructions}
                          disabled={saveStatus === 'saving'}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            saveStatus === 'saved'
                              ? 'bg-green-500 text-white'
                              : saveStatus === 'error'
                              ? 'bg-red-500 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {saveStatus === 'saved' ? (
                            <><CheckCircle className="w-4 h-4" /> Saved</>
                          ) : saveStatus === 'error' ? (
                            <><XCircle className="w-4 h-4" /> Error</>
                          ) : (
                            <><Save className="w-4 h-4" /> Save</>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={botInstructions}
                        onChange={(e) => setBotInstructions(e.target.value)}
                        className="w-full h-96 bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-gray-200 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                        placeholder="Enter bot behavior instructions..."
                      />
                    </div>
                  </div>
                )}

                {/* Connectors View */}
                {trainView === 'connectors' && (
                  <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {connectors.map((connector, index) => (
                        <div
                          key={index}
                          className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              {connector.type === 'product.json' && <Package className="w-6 h-6 text-blue-400" />}
                              {connector.type === 'shopify_demo.json' && <ShoppingCart className="w-6 h-6 text-green-400" />}
                              {connector.type === 'dhl_demo.json' && <Truck className="w-6 h-6 text-orange-400" />}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              connector.status === 'connected'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {connector.status}
                            </span>
                          </div>
                          <h3 className="font-semibold mb-2">{connector.name}</h3>
                          <p className="text-sm text-gray-400 mb-4">{connector.type}</p>
                          <div className="text-xs text-gray-500">
                            {connector.records} records available
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Test Chat Interface */}
                    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                      <div className="bg-gray-800/70 p-4 border-b border-gray-700/50">
                        <h3 className="font-semibold flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                          Test Your Bot
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Try asking about orders, tracking, or products
                        </p>
                      </div>
                      
                      {/* Chat Messages */}
                      <div className="h-96 overflow-y-auto p-4 space-y-4">
                        {chatHistory.length === 0 ? (
                          <div className="text-center text-gray-500 mt-8">
                            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Start a conversation to test your bot</p>
                            <p className="text-xs mt-2">Try: "What's the status of order ORD-2024-001?"</p>
                          </div>
                        ) : (
                          chatHistory.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-700/50 text-gray-200'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-gray-700/50 rounded-lg p-3">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t border-gray-700/50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                            placeholder="Ask about orders, tracking, or products..."
                            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                            disabled={isChatting}
                          />
                          <button
                            onClick={sendChatMessage}
                            disabled={isChatting || !chatMessage.trim()}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'stats' && stats && (
            <div className="flex-1 p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6">AI Reply Statistics</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-blue-400 mb-2">{stats.total_emails}</div>
                  <div className="text-sm text-gray-400">Total Emails</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-green-400 mb-2">{stats.total_replied}</div>
                  <div className="text-sm text-gray-400">AI Replied</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-purple-400 mb-2">{stats.avg_response_time_minutes}m</div>
                  <div className="text-sm text-gray-400">Avg Response Time</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.ai_reply_accuracy}%</div>
                  <div className="text-sm text-gray-400">AI Accuracy</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
                <div className="space-y-4">
                  {Object.entries(stats.sentiment_breakdown).map(([sentiment, count]) => (
                    <div key={sentiment}>
                      <div className="flex justify-between mb-2">
                        <span className="capitalize">{sentiment}</span>
                        <span className="font-medium">{count} emails</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / stats.total_emails) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDashboard;
