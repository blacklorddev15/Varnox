import React, { useState } from 'react';
import { Shield, Terminal, Zap, ChevronRight, Sparkles, Cpu, Lock, Smartphone, Check, Copy, RefreshCw, Radio, Server } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'pairing' | 'modules'>('pairing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const pairingBridgeUrl = (import.meta.env.VITE_VARNOX_PAIRING_URL || '').replace(/\/$/, '');
  const [isLoading, setIsLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGeneratePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid WhatsApp phone number with country code (e.g. 2547XXXXXXXX).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setPairingCode(null);

    try {
      // Clean phone number
      const cleaned = phoneNumber.replace(/[^0-9]/g, '');
      
      if (!pairingBridgeUrl) {
        throw new Error('The Varnox pairing bridge is not configured yet. Add VITE_VARNOX_PAIRING_URL in Vercel, then redeploy.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${pairingBridgeUrl}/pair?phone=${cleaned}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'The pairing bridge rejected the request.');
      }

      const code = data.code || data.pairingCode || data.pairCode;
      if (!code) {
        throw new Error('The pairing bridge responded without a pairing code.');
      }
      setPairingCode(String(code));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to reach the Varnox pairing bridge.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-anime-artwork text-white relative flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Ambient background cyan glow */}
      <div className="absolute inset-0 bg-cyan-400/5 pointer-events-none animate-pulse-glow z-0"></div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-cyan-500/30 bg-black/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/60 flex items-center justify-center font-heading font-extrabold text-cyan-400 text-2xl shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            V
          </div>
          <div>
            <h1 className="text-xl font-heading font-black tracking-widest text-cyan-400 flex items-center gap-2">
              VARNOX <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 font-mono text-cyan-300">XMD</span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono tracking-wider">NEURAL LINK & PAIRING GATEWAY</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-mono text-sm tracking-wider">
          <button 
            onClick={() => setActiveTab('pairing')} 
            className={`transition-all hover:text-cyan-400 ${activeTab === 'pairing' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-zinc-300'}`}
          >
            // PAIRING PORTAL
          </button>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`transition-all hover:text-cyan-400 ${activeTab === 'overview' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-zinc-300'}`}
          >
            // OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab('modules')} 
            className={`transition-all hover:text-cyan-400 ${activeTab === 'modules' ? 'text-cyan-400 border-b-2 border-cyan-400 pb-1' : 'text-zinc-300'}`}
          >
            // MODULES
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            PORTAL ACTIVE
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex flex-col justify-center flex-grow w-full items-center">
        
        {/* Mobile Tab switcher for small screens */}
        <div className="flex md:hidden w-full gap-2 mb-6 font-mono text-xs">
          <button 
            onClick={() => setActiveTab('pairing')}
            className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${activeTab === 'pairing' ? 'bg-cyan-500 text-black font-bold border-cyan-400' : 'bg-black/60 text-zinc-300 border-cyan-500/30'}`}
          >
            PAIRING
          </button>
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${activeTab === 'overview' ? 'bg-cyan-500 text-black font-bold border-cyan-400' : 'bg-black/60 text-zinc-300 border-cyan-500/30'}`}
          >
            OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-2.5 rounded-lg border text-center transition-all ${activeTab === 'modules' ? 'bg-cyan-500 text-black font-bold border-cyan-400' : 'bg-black/60 text-zinc-300 border-cyan-500/30'}`}
          >
            MODULES
          </button>
        </div>

        {activeTab === 'pairing' && (
          <div className="w-full max-w-xl bg-black/85 backdrop-blur-xl p-8 rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.2)] space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-mono text-xs">
                <Radio size={14} className="animate-pulse" />
                WHATSAPP PAIRING BRIDGE
              </div>
              <h2 className="text-3xl font-heading font-black tracking-wider text-white">
                CONNECT <span className="text-cyan-400">VARNOX XMD</span>
              </h2>
              <p className="text-sm text-zinc-400 font-sans">
                Enter your WhatsApp number with country code to generate your secure pairing code instantly.
              </p>
            </div>

            <form onSubmit={handleGeneratePairing} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1.5 uppercase tracking-wider">
                  WhatsApp Number (with country code)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-mono">
                    +
                  </div>
                  <input 
                    type="text" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="254700000000" 
                    className="w-full bg-zinc-950/90 border border-cyan-500/30 focus:border-cyan-400 rounded-xl pl-8 pr-4 py-3.5 text-base font-mono text-white placeholder-zinc-600 focus:outline-none shadow-inner transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Server size={15} className={pairingBridgeUrl ? 'text-cyan-400' : 'text-amber-400'} />
                    <div>
                      <p className="text-xs font-mono text-zinc-300">PAIRING BRIDGE</p>
                      <p className="mt-0.5 text-[10px] font-mono text-zinc-500">
                        {pairingBridgeUrl ? 'Backend endpoint configured' : 'Waiting for Varnox backend endpoint'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono ${pairingBridgeUrl ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {pairingBridgeUrl ? 'READY' : 'PENDING'}
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono">
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-black text-base rounded-xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    GENERATING SECURE CODE...
                  </>
                ) : (
                  <>
                    <Cpu size={18} />
                    GENERATE PAIRING CODE
                  </>
                )}
              </button>
            </form>

            {pairingCode && (
              <div className="mt-6 p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-center space-y-3 animate-fadeIn">
                <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest">Your Pairing Code</p>
                <div className="text-3xl md:text-4xl font-mono font-black tracking-widest text-white bg-black/60 py-3 rounded-xl border border-cyan-400/40 select-all">
                  {pairingCode}
                </div>
                <button 
                  onClick={handleCopyCode}
                  className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-mono text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'COPIED TO CLIPBOARD!' : 'COPY CODE TO LINK'}
                </button>
                <p className="text-[11px] text-zinc-400 font-sans">
                  Open WhatsApp on your phone &gt; Linked Devices &gt; Link with phone number instead &gt; Enter this live code.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="max-w-2xl space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 font-mono text-xs">
              <Sparkles size={14} />
              CYBERNETIC ANIME ECOSYSTEM
            </div>
            
            <h2 className="text-4xl md:text-6xl font-heading font-black tracking-wider leading-tight text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
              BEYOND LIMITS. <br />
              <span className="text-cyan-400">ABSOLUTE CONTROL.</span>
            </h2>

            <p className="text-base text-zinc-300 leading-relaxed font-sans max-w-xl bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-cyan-500/20 shadow-xl">
              Varnox XMD is engineered for elite performance, lightning-fast response times, and seamless multi-device bot synchronization across Pterodactyl server nodes.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
              <button 
                onClick={() => setActiveTab('pairing')}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 cursor-pointer"
              >
                PAIR DEVICE NOW <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setActiveTab('modules')}
                className="px-6 py-3 bg-black/60 hover:bg-black/80 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 font-mono text-sm rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Server size={14} /> VIEW MODULES
              </button>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="w-full max-w-4xl space-y-6">
            <h3 className="text-2xl font-heading font-bold tracking-wider text-cyan-400 text-center md:text-left">// CORE ARCHITECTURE MODULES</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-black/70 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-lg">
                <Terminal className="text-cyan-400 mb-4" size={28} />
                <h4 className="font-heading font-bold text-lg mb-2 text-white">PAIRING ENGINE</h4>
                <p className="text-sm text-zinc-400 font-sans">High-speed WebSocket bridge connecting web portal requests directly to bot backends.</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/70 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-lg">
                <Zap className="text-cyan-400 mb-4" size={28} />
                <h4 className="font-heading font-bold text-lg mb-2 text-white">SYNAPSE AI</h4>
                <p className="text-sm text-zinc-400 font-sans">Automated heuristic analysis engine powered by high-speed neural pipelines.</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/70 backdrop-blur-md border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-lg">
                <Shield className="text-cyan-400 mb-4" size={28} />
                <h4 className="font-heading font-bold text-lg mb-2 text-white">SHIELD DEFENSE</h4>
                <p className="text-sm text-zinc-400 font-sans">Multi-layered security protocols ensuring 24/7 uninterrupted uptime on Pterodactyl.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-black/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-400">
        <p>© 2026 VARNOX ECOSYSTEM. ALL RIGHTS RESERVED.</p>
        <p className="mt-2 sm:mt-0 text-cyan-400">DISTINCT CYAN ANIME THEME • READY FOR PRODUCTION</p>
      </footer>
    </div>
  );
}
