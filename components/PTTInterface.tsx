import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { Message, ConnectionStatus } from '../types';
import { GeminiLiveService } from '../services/geminiLive';
import { playNotificationSound } from '../utils/audioUtils';

interface PTTInterfaceProps {
  status: ConnectionStatus;
  messages: Message[];
  onSendMessage: (text: string) => void;
  geminiService: React.MutableRefObject<GeminiLiveService | null>;
}

const PTTInterface: React.FC<PTTInterfaceProps> = ({ status, messages, onSendMessage, geminiService }) => {
  const [isTalking, setIsTalking] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visualFlash, setVisualFlash] = useState(false);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Visual flash effect on new system/AI message
  useEffect(() => {
    if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender !== 'Eu') {
            setVisualFlash(true);
            playNotificationSound('message');
            setTimeout(() => setVisualFlash(false), 500);
        }
    }
  }, [messages]);

  const handlePushToTalk = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (status !== ConnectionStatus.CONNECTED || !geminiService.current) return;
    
    setIsTalking(true);
    playNotificationSound('connect');
    try {
      await geminiService.current.startRecording();
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsTalking(false);
    }
  };

  const handleRelease = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isTalking || !geminiService.current) return;

    setIsTalking(false);
    playNotificationSound('connect'); // End squelch
    geminiService.current.stopRecording();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-tactical-900 relative overflow-hidden`}>
       {/* Visual Flash Overlay */}
       <div className={`absolute inset-0 bg-tactical-accent/10 pointer-events-none transition-opacity duration-300 ${visualFlash ? 'opacity-100' : 'opacity-0'} z-50`} />

      {/* Message History / Transcript */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'Eu' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded p-3 ${
              msg.sender === 'Eu' 
                ? 'bg-tactical-700 text-white' 
                : msg.isSystem 
                  ? 'bg-tactical-alert/20 border border-tactical-alert text-red-200'
                  : 'bg-tactical-800 border border-tactical-700 text-gray-200'
            }`}>
              <div className="flex items-center justify-between space-x-2 mb-1">
                <span className={`text-xs font-bold uppercase ${msg.sender === 'Eu' ? 'text-tactical-accent' : 'text-blue-400'}`}>
                  {msg.sender}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls Area */}
      <div className="bg-tactical-800 p-4 border-t border-tactical-700 flex flex-col space-y-4">
        
        {/* PTT Button - Large and Accessible */}
        <div className="flex justify-center">
            <button
                onMouseDown={handlePushToTalk}
                onMouseUp={handleRelease}
                onTouchStart={handlePushToTalk}
                onTouchEnd={handleRelease}
                disabled={status !== ConnectionStatus.CONNECTED}
                className={`
                    relative w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg transition-all select-none
                    ${status !== ConnectionStatus.CONNECTED ? 'border-gray-600 bg-gray-700 opacity-50 cursor-not-allowed' : ''}
                    ${isTalking 
                        ? 'bg-tactical-accent border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-95' 
                        : 'bg-tactical-700 border-tactical-600 hover:border-tactical-500 active:scale-95'}
                `}
            >
                {isTalking ? (
                    <Mic className="w-10 h-10 text-tactical-900 animate-pulse" />
                ) : (
                    <MicOff className="w-8 h-8 text-gray-400" />
                )}
                
                {/* Status Ring */}
                {isTalking && (
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></div>
                )}
            </button>
        </div>
        <div className="text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-tactical-mute">
                {isTalking ? 'TRANSMITERE...' : 'ȚINE APĂSAT PENTRU A VORBI'}
            </span>
        </div>

        {/* Text Input */}
        <form onSubmit={handleTextSubmit} className="flex space-x-2 mt-2">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Mesaj text..."
                className="flex-1 bg-tactical-900 border border-tactical-700 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-tactical-accent"
            />
            <button 
                type="submit"
                className="bg-tactical-700 hover:bg-tactical-600 text-white rounded px-4 py-2 transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default PTTInterface;