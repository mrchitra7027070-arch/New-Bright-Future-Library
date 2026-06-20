import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: { id: string; username: string }) => void;
  onBackToPublic: () => void;
  logo?: string;
  libraryName?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToPublic, logo, libraryName }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const logoSrc = (logo || '').trim();
  const canRenderLogoImage = logoSrc.startsWith('http://') || logoSrc.startsWith('https://') || logoSrc.startsWith('/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      return setError("Please enter your username and password.");
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Incorrect login details");
      }

      // Success
      localStorage.setItem("admin_token", data.token);
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to establish secure login session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      {/* Container card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[28px] overflow-hidden shadow-lg p-8 space-y-6">
        
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-white border border-indigo-100 flex items-center justify-center mx-auto shadow-md shadow-indigo-100 overflow-hidden">
            {canRenderLogoImage ? (
              <img
                src={logoSrc}
                alt={libraryName ? `${libraryName} logo` : 'Library logo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-indigo-700">{logoSrc || 'LIB'}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-sans font-extrabold text-slate-800 tracking-tight leading-tight">{libraryName || 'Library Admin'}</h1>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 mt-1">Admin Portal</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="hidden">
            🔐
          </div>
          <h1 className="sr-only">Admin Portal</h1>
        </div>

        {/* Demo info note */}
        {false && (
        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 space-y-1">
          <p className="font-bold">🔑 System Default Credentials:</p>
          <div className="flex justify-between font-mono">
            <span>Username: <strong className="text-indigo-950 select-all">admin</strong></span>
            <span>Password: <strong className="text-indigo-950 select-all">admin</strong></span>
          </div>
        </div>
        )}

        {/* Errors */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-3.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-10 py-3.5 text-xs font-medium border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white cursor-pointer font-bold text-xs p-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? 'Establishing Authentication...' : 'Secure Login'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button 
            onClick={onBackToPublic}
            className="text-xs text-slate-450 hover:text-slate-800 font-sans font-medium transition"
          >
            ← Back to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
