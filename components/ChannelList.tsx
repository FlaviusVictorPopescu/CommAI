import React from 'react';
import { Channel } from '../types';
import { Hash, Users, Radio } from 'lucide-react';

interface ChannelListProps {
  channels: Channel[];
  activeChannel: Channel;
  onSelect: (c: Channel) => void;
  isOpen: boolean;
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, activeChannel, onSelect, isOpen }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-tactical-900 border-r border-tactical-700 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="p-4 border-b border-tactical-700 flex items-center space-x-2">
        <Radio className="text-tactical-accent w-5 h-5" />
        <h2 className="font-bold tracking-wider">FRECVENȚE</h2>
      </div>
      
      <div className="p-2 space-y-1">
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel)}
            className={`w-full flex items-center justify-between p-3 rounded text-sm transition-colors ${
              activeChannel.id === channel.id 
                ? 'bg-tactical-800 text-white border-l-2 border-tactical-accent' 
                : 'text-tactical-mute hover:bg-tactical-800/50 hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Hash className="w-4 h-4 opacity-50" />
              <span className="font-medium">{channel.name}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs opacity-70">
              <Users className="w-3 h-3" />
              <span>{channel.participants}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="absolute bottom-0 w-full p-4 border-t border-tactical-700 bg-tactical-900">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-tactical-mute uppercase">Rețea Activă</span>
        </div>
      </div>
    </div>
  );
};

export default ChannelList;