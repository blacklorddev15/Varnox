import React, { useState } from 'react';
import { Shield, Terminal, Zap, ChevronRight, Sparkles, Cpu, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'access'>('overview');

  return (
    <div className="min-h-screen bg-anime-artwork text-white relative flex flex-col justify-between overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-red-950/20 pointer-events-none animate-pulse-glow z-0"></div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-red-600/30 bg-black/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/50 flex items-center justify-center font-heading font-bold text-red-500 text-xl shadow-[0_0_15px_rgba(239,68,68,0.4)]">
            V
          </div>
          <div>
            <h1 className="text-xl font-heading font-extrabold tracking-widest text-red-500">VARNOX</h1>
            <p className="text-xs text-zinc-400 font-mono tracking-wider">SYSTEM OS v4.2</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-mono text-sm tracking-wider">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`transition-colors hover:text-red-400 ${activeTab === 'overview' ? 'text-red-500 border-b-2 border-red-500 pb-1' : 'text-zinc-300'}`}
          >
            // OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab('modules')} 
            className={`transition-colors hover:text-red-400 ${activeTab === 'modules' ? 'text-red-500 border-b-2 border-red-500 pb-1' : 'text-zinc-300'}`}
          >
            // MODULES
          </button>
          <button 
            onClick={() => setActiveTab('access')} 
            className={`transition-colors hover:text-red-400 ${activeTab === 'access' ? 'text-red-500 border-b-2 border-red-500 pb-1' : 'text-zinc-300'}`}
          >
            // ACCESS PORTAL
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-600/40 text-xs font-mono text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col justify-center flex-grow w-full">
        {activeTab === 'overview' && (
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-black/60 border border-red-600/40 text-red-400 font-mono text-xs">
              <Sparkles size={14} />
              TACTICAL ANIME COMMAND INTERFACE
            </div>
            
            <h2 className="text-5xl md:text-7xl font-heading font-black tracking-wider leading-tight text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              IN THE SHADOWS <br />
              <span className="text-red-600">WE OPERATE.</span>
            </h2>

            <p className="text-lg text-zinc-300 leading-relaxed font-sans max-w-xl bg-black/50 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              Varnox is an advanced elite deployment ecosystem. Built for absolute precision, unyielding performance, and complete command authority.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => setActiveTab('modules')}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-mono text-sm font-bold rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all flex items-center gap-2 cursor-pointer"
              >
                EXPLORE MODULES <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setActiveTab('access')}
                className="px-6 py-3 bg-black/60 hover:bg-black/80 text-zinc-200 border border-zinc-700 hover:border-red-500 font-mono text-sm rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Lock size={14} /> SECURE PORTAL
              </button>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-6">
            <h3 className="text-3xl font-heading font-bold tracking-wider text-red-500">// ACTIVE MODULES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-red-600/30 hover:border-red-500 transition-all">
                <Terminal className="text-red-500 mb-4" size={28} />
                <h4 className="font-heading font-bold text-lg mb-2">CORE BRIDGE</h4>
                <p className="text-sm text-zinc-400 font-sans">Encrypted communication channel with instant telemetry and session management.</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-red-600/30 hover:border-red-500 transition-all">
                <Zap className="text-red-500 mb-4" size={28} />
                <h4 className="font-heading font-bold text-lg mb-2">SYNAPSE AI</h4>
                <p className="text-sm text-zinc-400 font-sans">Automated heuristic analysis engine powered by high-speed neural pipelines.</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-red-600/30 hover:border-red-500 transition-all">
                <Shield className="text-red-500 mb-4" size={28} />
                <h4 className="font-heading font-bold text-lg mb-2">SHIELD DEFENSE</h4>
                <p className="text-sm text-zinc-400 font-sans">Multi-layered security protocols ensuring 24/7 uninterrupted uptime.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="max-w-md bg-black/80 backdrop-blur-lg p-8 rounded-2xl border border-red-600/40 shadow-[0_0_30px_rgba(0,0,0,0.9)] space-y-6">
            <div className="flex items-center gap-3">
              <Cpu className="text-red-500" size={24} />
              <h3 className="font-heading font-bold text-xl tracking-wider">RESTRICTED ACCESS</h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">AUTHENTICATION REQUIRED FOR TERMINAL ROUTING.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">OPERATOR ID</label>
                <input type="text" placeholder="Enter operator handle..." className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-red-500" />
              </div>
              <button onClick={() => alert("Ready for additional image and backend connection assets.")} className="w-full py-3 bg-red-600 hover:bg-red-700 font-mono text-sm font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] cursor-pointer">
                AUTHENTICATE
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-red-600/20 bg-black/60 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500">
        <p>© 2026 VARNOX SYSTEM INC. ALL RIGHTS RESERVED.</p>
        <p className="mt-2 sm:mt-0 text-red-500/80">BACKGROUND ARTWORK LOADED SECURELY</p>
      </footer>
    </div>
  );
}
