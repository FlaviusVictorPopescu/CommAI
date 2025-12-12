import React, { useState, useEffect, useRef } from 'react';
import { User, Channel, Message, ConnectionStatus } from './types';
import Login from './components/Login';
import ChannelList from './components/ChannelList';
import PTTInterface from './components/PTTInterface';
import AdminPanel from './components/AdminPanel';
import { Menu, LogOut, Signal, ShieldAlert, LayoutDashboard, MessageSquare } from 'lucide-react';
import { GeminiLiveService } from './services/geminiLive';
import { playNotificationSound } from './utils/audioUtils';
import { db } from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [currentView, setCurrentView] = useState<'chat' | 'admin'>('chat');
  
  // Gemini Service Ref
  const geminiService = useRef<GeminiLiveService | null>(null);

  // Load Initial Data (Channels)
  useEffect(() => {
    const loadChannels = async () => {
        const loadedChannels = await db.getChannels();
        setChannels(loadedChannels);
        if (loadedChannels.length > 0 && !activeChannel) {
            setActiveChannel(loadedChannels[0]);
        }
    };
    loadChannels();
  }, [user]); // Reload when user logs in/out in case of state reset

  // Load Messages for Active Channel
  useEffect(() => {
    const loadMessages = async () => {
        if (activeChannel) {
            const msgs = await db.getMessagesByChannel(activeChannel.id);
            setMessages(msgs);
        }
    };
    loadMessages();
  }, [activeChannel]);

  // Gemini Connection Logic
  useEffect(() => {
    if (user && process.env.API_KEY && activeChannel && currentView === 'chat') {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      
      const handleTranscription = async (text: string, isUser: boolean) => {
        await handleSendMessage(text, isUser ? 'text' : 'voice-transcript', isUser ? 'Eu' : 'Dispecer AI');
      };

      geminiService.current = new GeminiLiveService(process.env.API_KEY, handleTranscription);
      
      geminiService.current.connect()
        .then(() => {
            setConnectionStatus(ConnectionStatus.CONNECTED);
            playNotificationSound('connect');
        })
        .catch(() => {
            setConnectionStatus(ConnectionStatus.ERROR);
        });

      return () => {
        geminiService.current?.disconnect();
      };
    } else {
        // Disconnect if switching to Admin view or logging out
        geminiService.current?.disconnect();
        if (currentView === 'admin') setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [user, activeChannel, currentView]);

  const handleSendMessage = async (text: string, type: Message['type'] = 'text', sender: string = 'Eu') => {
    if (!activeChannel) return;

    const newMessage = await db.saveMessage({
        channelId: activeChannel.id,
        sender: sender,
        text: text,
        type: type,
        isSystem: false
    });
    
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSimulatedEvent = async () => {
    if (!activeChannel) return;
    playNotificationSound('alert');
    const alertMsg = await db.saveMessage({
        channelId: activeChannel.id,
        sender: 'ALERTA',
        text: 'Detectat mișcare în perimetrul securizat.',
        type: 'text',
        isSystem: true
    });
    setMessages(prev => [...prev, alertMsg]);
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-tactical-900 text-gray-100 font-sans">
      
      {/* Sidebar - Only show in Chat view */}
      {currentView === 'chat' && activeChannel && (
        <ChannelList 
            channels={channels} 
            activeChannel={activeChannel} 
            onSelect={(c) => { setActiveChannel(c); setSidebarOpen(false); }}
            isOpen={isSidebarOpen}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-tactical-800 border-b border-tactical-700 p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center space-x-3">
             {currentView === 'chat' && (
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
                <Menu />
                </button>
             )}
            <div className="flex flex-col">
                <h1 className="font-bold text-lg tracking-wide">
                    {currentView === 'admin' ? 'ADMINISTRARE' : activeChannel?.name || 'CommsAI'}
                </h1>
                {currentView === 'chat' && (
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === ConnectionStatus.CONNECTED ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] text-gray-500 uppercase">{connectionStatus}</span>
                    </div>
                )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* View Switcher for Commanders */}
            {user.role === 'commander' && (
                <div className="flex bg-tactical-900 rounded-lg p-1 border border-tactical-700">
                    <button 
                        onClick={() => setCurrentView('chat')}
                        className={`p-2 rounded ${currentView === 'chat' ? 'bg-tactical-700 text-white' : 'text-tactical-mute'}`}
                        title="Chat"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button 
                         onClick={() => setCurrentView('admin')}
                         className={`p-2 rounded ${currentView === 'admin' ? 'bg-tactical-700 text-white' : 'text-tactical-mute'}`}
                         title="Admin Panel"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </button>
                </div>
            )}

            {currentView === 'chat' && (
                <button onClick={handleSimulatedEvent} className="p-2 text-tactical-alert hover:bg-tactical-alert/10 rounded-full" title="Simulare Alertă">
                    <ShieldAlert className="w-5 h-5" />
                </button>
            )}
            
            <div className="hidden md:flex items-center space-x-2 bg-tactical-900 px-3 py-1 rounded-full border border-tactical-700">
                <Signal className={`w-4 h-4 ${connectionStatus === ConnectionStatus.CONNECTED ? 'text-emerald-500' : 'text-gray-600'}`} />
                <span className="text-xs font-mono">{user.username}</span>
            </div>
            
            <button onClick={() => setUser(null)} className="text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
            {currentView === 'chat' ? (
                <PTTInterface 
                    status={connectionStatus}
                    messages={messages}
                    onSendMessage={(text) => handleSendMessage(text, 'text')}
                    geminiService={geminiService}
                />
            ) : (
                <AdminPanel />
            )}
        </main>
      </div>
    </div>
  );
};

export default App;