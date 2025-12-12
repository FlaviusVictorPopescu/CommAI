import { User, Channel, Message } from '../types';

/**
 * SIMULATED MONGODB SERVICE
 * In a production environment, these methods would make async fetch() calls 
 * to a NodeJS/Express backend connected to a MongoDB instance.
 * 
 * Collections are stored in localStorage to persist data across reloads.
 */

const STORAGE_KEYS = {
  USERS: 'comms_ai_users',
  CHANNELS: 'comms_ai_channels',
  MESSAGES: 'comms_ai_messages'
};

// Seed Data
const SEED_CHANNELS: Channel[] = [
  { id: '1', name: 'General', status: 'active', participants: 0 },
  { id: '2', name: 'Operațiuni', status: 'quiet', participants: 0 },
  { id: '3', name: 'Urgență', status: 'alert', participants: 0 },
];

const SEED_ADMIN: User = {
  id: 'admin-001',
  phoneNumber: '0000',
  username: 'Comandant',
  password: 'admin',
  role: 'commander',
  createdAt: new Date().toISOString()
};

class DatabaseService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.CHANNELS)) {
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(SEED_CHANNELS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([SEED_ADMIN]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    }
  }

  // --- USER METHODS ---

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    // Check if phone exists
    if (users.find((u: User) => u.phoneNumber === user.phoneNumber)) {
      throw new Error("Numărul de telefon este deja înregistrat.");
    }

    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  }

  async authenticateUser(phone: string, password: string): Promise<User> {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.phoneNumber === phone && u.password === password);
    
    if (!user) throw new Error("Credențiale invalide.");
    
    // Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser as User;
  }

  async getAllUsers(): Promise<User[]> {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.map((u: User) => {
        const { password: _, ...safeUser } = u;
        return safeUser;
    });
  }

  async deleteUser(id: string): Promise<void> {
    let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    users = users.filter((u: User) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // --- CHANNEL METHODS ---

  async getChannels(): Promise<Channel[]> {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHANNELS) || '[]');
  }

  async createChannel(name: string, status: Channel['status']): Promise<Channel> {
    const channels = await this.getChannels();
    const newChannel: Channel = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      status,
      participants: 0
    };
    channels.push(newChannel);
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
    return newChannel;
  }

  async deleteChannel(id: string): Promise<void> {
    let channels = await this.getChannels();
    channels = channels.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  }

  // --- MESSAGE METHODS ---

  async saveMessage(msg: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    
    const newMessage: Message = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    
    // Keep only last 500 messages globally to prevent LocalStorage quota overflow
    if (messages.length > 500) messages.shift();
    
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    return newMessage;
  }

  async getMessagesByChannel(channelId: string): Promise<Message[]> {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    return messages.filter((m: Message) => m.channelId === channelId);
  }
}

export const db = new DatabaseService();