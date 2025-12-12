export interface User {
  id: string;
  phoneNumber: string;
  username: string;
  password?: string; // Only used for auth checks, usually not passed around
  role: 'operator' | 'commander';
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string; // Link message to a specific channel
  sender: string;
  text: string;
  timestamp: string; // ISO string for storage
  isSystem?: boolean;
  type: 'text' | 'voice-transcript';
}

export interface Channel {
  id: string;
  name: string;
  status: 'active' | 'quiet' | 'alert';
  participants: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}