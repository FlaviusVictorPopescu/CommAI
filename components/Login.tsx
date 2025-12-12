import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { Radio, Lock, Phone, User as UserIcon, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'operator' | 'commander'>('operator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        // Register Flow
        const newUser = await db.createUser({
          phoneNumber: phone,
          password: password,
          username: username || `Operator-${phone.slice(-4)}`,
          role: role
        });
        onLogin(newUser);
      } else {
        // Login Flow
        const user = await db.authenticateUser(phone, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "A apărut o eroare.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tactical-900 px-4">
      <div className="w-full max-w-md bg-tactical-800 p-8 rounded-lg border border-tactical-700 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-tactical-accent/20 rounded-full flex items-center justify-center mb-4 border border-tactical-accent shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Radio className="w-8 h-8 text-tactical-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">COMMS.AI</h1>
          <p className="text-tactical-mute text-sm">Secure PTT Network</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          
          {isRegistering && (
             <div>
                <label className="block text-xs uppercase tracking-wider text-tactical-mute mb-1">Nume Utilizator</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-5 h-5 text-tactical-mute" />
                  <input
                    type="text"
                    required={isRegistering}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-tactical-900 border border-tactical-700 rounded p-3 pl-10 text-white focus:outline-none focus:border-tactical-accent transition-colors"
                    placeholder="Ex: Alpha-1"
                  />
                </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-tactical-mute mb-1">Număr Telefon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-tactical-mute" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-tactical-900 border border-tactical-700 rounded p-3 pl-10 text-white focus:outline-none focus:border-tactical-accent transition-colors"
                placeholder="0700 000 000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-tactical-mute mb-1">Parolă</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-tactical-mute" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-tactical-900 border border-tactical-700 rounded p-3 pl-10 text-white focus:outline-none focus:border-tactical-accent transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isRegistering && (
             <div>
                <label className="block text-xs uppercase tracking-wider text-tactical-mute mb-1">Rol Operațional</label>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => setRole('operator')}
                        className={`flex-1 py-2 rounded text-sm border ${role === 'operator' ? 'bg-tactical-accent text-tactical-900 border-tactical-accent' : 'bg-transparent text-tactical-mute border-tactical-700'}`}
                    >
                        Operator
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('commander')}
                        className={`flex-1 py-2 rounded text-sm border flex items-center justify-center space-x-1 ${role === 'commander' ? 'bg-tactical-alert text-white border-tactical-alert' : 'bg-transparent text-tactical-mute border-tactical-700'}`}
                    >
                        <Shield className="w-3 h-3" />
                        <span>Comandant</span>
                    </button>
                </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded font-bold uppercase tracking-widest transition-all mt-6 ${
              loading 
                ? 'bg-tactical-700 text-tactical-mute cursor-not-allowed' 
                : 'bg-tactical-accent hover:bg-emerald-600 text-tactical-900 shadow-lg hover:shadow-emerald-500/20'
            }`}
          >
            {loading ? 'Procesare...' : (isRegistering ? 'Înregistrare' : 'Conectare Rețea')}
          </button>
        </form>

        <div className="relative z-10 mt-6 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-tactical-mute text-sm hover:text-white underline underline-offset-4"
            >
                {isRegistering ? 'Ai deja cont? Autentificare' : 'Nu ai cont? Înregistrează-te'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;