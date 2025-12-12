import React, { useState, useEffect } from 'react';
import { User, Channel } from '../types';
import { db } from '../services/db';
import { Trash2, Plus, Shield, Hash, Users, Activity } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'channels'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  
  // Form states
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelStatus, setNewChannelStatus] = useState<Channel['status']>('active');

  const refreshData = async () => {
    const loadedUsers = await db.getAllUsers();
    const loadedChannels = await db.getChannels();
    setUsers(loadedUsers);
    setChannels(loadedChannels);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (confirm('Sigur doriți să ștergeți acest utilizator?')) {
      await db.deleteUser(id);
      refreshData();
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName) return;
    await db.createChannel(newChannelName, newChannelStatus);
    setNewChannelName('');
    refreshData();
  };

  const handleDeleteChannel = async (id: string) => {
    if (confirm('Sigur doriți să ștergeți acest canal?')) {
      await db.deleteChannel(id);
      refreshData();
    }
  };

  return (
    <div className="h-full flex flex-col bg-tactical-900 text-gray-200">
        {/* Admin Header */}
        <div className="bg-tactical-800 p-6 border-b border-tactical-700 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold tracking-wider text-white flex items-center gap-2">
                    <Shield className="text-tactical-alert" />
                    PANOU ADMINISTRARE
                </h2>
                <p className="text-tactical-mute text-sm mt-1">Gestiune Resurse și Personal</p>
            </div>
            
            <div className="flex space-x-2 bg-tactical-900 p-1 rounded-lg border border-tactical-700">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-tactical-700 text-white' : 'text-tactical-mute hover:text-gray-300'}`}
                >
                    Utilizatori
                </button>
                <button 
                    onClick={() => setActiveTab('channels')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${activeTab === 'channels' ? 'bg-tactical-700 text-white' : 'text-tactical-mute hover:text-gray-300'}`}
                >
                    Canale
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-lg border border-tactical-700">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-tactical-800 text-tactical-mute uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3 tracking-wider">Utilizator</th>
                                    <th className="px-6 py-3 tracking-wider">Telefon</th>
                                    <th className="px-6 py-3 tracking-wider">Rol</th>
                                    <th className="px-6 py-3 tracking-wider">Data înreg.</th>
                                    <th className="px-6 py-3 tracking-wider text-right">Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tactical-700 bg-tactical-900">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-tactical-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${user.role === 'commander' ? 'bg-tactical-alert' : 'bg-tactical-accent'}`}></div>
                                            {user.username}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{user.phoneNumber}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.role === 'commander' ? 'bg-red-900/50 text-red-200' : 'bg-emerald-900/50 text-emerald-200'
                                            }`}>
                                                {user.role === 'commander' ? 'COMANDANT' : 'OPERATOR'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            {user.role !== 'commander' && (
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-tactical-mute hover:text-red-500 transition-colors"
                                                    title="Șterge Utilizator"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CHANNELS TAB */}
            {activeTab === 'channels' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Channel List */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="overflow-hidden rounded-lg border border-tactical-700">
                             <table className="w-full text-left text-sm">
                                <thead className="bg-tactical-800 text-tactical-mute uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3 tracking-wider">Nume Canal</th>
                                        <th className="px-6 py-3 tracking-wider">Status</th>
                                        <th className="px-6 py-3 tracking-wider text-right">Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-tactical-700 bg-tactical-900">
                                    {channels.map((channel) => (
                                        <tr key={channel.id} className="hover:bg-tactical-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                                <Hash className="w-4 h-4 text-gray-500" />
                                                {channel.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        channel.status === 'active' ? 'bg-emerald-500' : 
                                                        channel.status === 'alert' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
                                                    }`} />
                                                    <span className="uppercase text-xs">{channel.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteChannel(channel.id)}
                                                    className="text-tactical-mute hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Create Channel Form */}
                    <div className="md:col-span-1">
                        <div className="bg-tactical-800 p-6 rounded-lg border border-tactical-700">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4 text-tactical-accent" />
                                Canal Nou
                            </h3>
                            <form onSubmit={handleCreateChannel} className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase text-tactical-mute mb-1">Denumire</label>
                                    <input 
                                        type="text" 
                                        value={newChannelName}
                                        onChange={e => setNewChannelName(e.target.value)}
                                        className="w-full bg-tactical-900 border border-tactical-700 rounded p-2 text-white focus:border-tactical-accent outline-none"
                                        placeholder="Ex: Tactic-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-tactical-mute mb-1">Status Inițial</label>
                                    <select 
                                        value={newChannelStatus}
                                        onChange={e => setNewChannelStatus(e.target.value as any)}
                                        className="w-full bg-tactical-900 border border-tactical-700 rounded p-2 text-white focus:border-tactical-accent outline-none"
                                    >
                                        <option value="active">Activ</option>
                                        <option value="quiet">Liniște Radio</option>
                                        <option value="alert">Alertă</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-tactical-700 hover:bg-tactical-600 text-white font-bold py-2 rounded transition-colors uppercase text-xs tracking-wider">
                                    Creare Canal
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminPanel;